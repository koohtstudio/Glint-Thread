import 'server-only'
import { randomUUID } from 'node:crypto'
import type Stripe from 'stripe'
import { env, features } from '@/lib/env'
import { getPromoCodes } from '@/lib/data'
import type { Quote } from '@/lib/pricing/types'
import { generateOrderNumber, skuKey } from '@/lib/order-number'
import { absoluteUrl } from '@/lib/public-env'
import { emailShell, sendEmail } from '@/lib/email/send'
import {
  OrderConfirmationEmail,
  OwnerOrderEmail,
  ShippingEmail,
} from '@/lib/email/templates/emails'
import type { EmailLine } from '@/lib/email/templates/order-items'

/**
 * Order lifecycle (PRD 9.2 to 9.4): pending -> paid -> shipped -> delivered (+ expired, cancelled,
 * refunded, partially_refunded). Orders live in Sanity under private `orders.` IDs, so they are never
 * readable without a token. Without a write token the store degrades: checkout still works, and
 * webhooks send emails from the Stripe session but cannot store the order.
 */

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'expired'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export interface OrderLine {
  _key: string
  sku: string
  productSlug: string
  title: string
  variantTitle: string
  qty: number
  unitPriceCents: number
  lineSubtotalCents: number
  discountCents: number
  imageUrl: string | null
}

export interface OrderDoc {
  _id: string
  _rev?: string
  _type: 'order'
  orderNumber: string
  status: OrderStatus
  lines: OrderLine[]
  amounts: {
    subtotalCents: number
    automaticDiscountCents: number
    codeDiscountCents: number
    discountCents: number
    shippingCents: number
    taxCents: number
    totalCents: number
  }
  promoCode: string | null
  quoteSnapshot: string
  customer?: { email?: string | null; name?: string | null; phone?: string | null }
  shippingAddress?: {
    line1?: string | null
    line2?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    country?: string | null
  }
  shippingMethod?: string | null
  shippingEta?: string | null
  carrier?: string | null
  trackingNumber?: string | null
  stripe?: {
    checkoutSessionId?: string | null
    paymentIntentId?: string | null
    couponId?: string | null
  }
  processedEventIds: string[]
  stockDecremented: boolean
  needsReview: boolean
  notes?: string | null
  createdAt: string
  paidAt?: string | null
  shippedAt?: string | null
  updatedAt?: string | null
}

async function client() {
  const { sanityWriteClient } = await import('@/sanity/lib/server-client')
  return sanityWriteClient()
}

/** Paid redemptions of codes by this email, for first-order-only checks (PRD 7.4). */
export async function findCodeRedemptions(
  email: string,
): Promise<{ code: string; email: string }[]> {
  if (!features.sanityWrite) return []
  const rows = await (
    await client()
  ).fetch<{ code: string | null; email: string }[]>(
    `*[_type == "order" && status in ["paid","shipped","delivered","partially_refunded"] && lower(customer.email) == $email && defined(promoCode)]{ "code": promoCode, "email": customer.email }`,
    { email: email.toLowerCase() },
  )
  return rows.filter((r): r is { code: string; email: string } => Boolean(r.code))
}

/** Step 4 of checkout: snapshot the quote as a pending order. */
export async function createPendingOrder(
  quote: Quote,
): Promise<{ id: string; orderNumber: string; persisted: boolean }> {
  const id = `orders.${randomUUID()}`
  const orderNumber = generateOrderNumber()
  if (!features.sanityWrite) {
    console.warn(
      `[orders] SANITY_API_WRITE_TOKEN is not set: order ${orderNumber} lives only in Stripe metadata`,
    )
    return { id, orderNumber, persisted: false }
  }
  const doc: OrderDoc = {
    _id: id,
    _type: 'order',
    orderNumber,
    status: 'pending',
    lines: quote.lines.map((l) => ({
      _key: skuKey(l.sku),
      sku: l.sku,
      productSlug: l.productSlug,
      title: l.title,
      variantTitle: l.variantTitle,
      qty: l.qty,
      unitPriceCents: l.unitPriceCents,
      lineSubtotalCents: l.lineSubtotalCents,
      discountCents: l.discountCents,
      imageUrl: l.image ? absoluteUrl(l.image.src) : null,
    })),
    amounts: {
      subtotalCents: quote.merchandiseSubtotalCents,
      automaticDiscountCents: quote.automaticDiscountCents,
      codeDiscountCents: quote.codeDiscountCents,
      discountCents: quote.automaticDiscountCents + quote.codeDiscountCents,
      shippingCents: 0,
      taxCents: 0,
      totalCents: quote.discountedSubtotalCents,
    },
    promoCode: quote.promoCode?.applied ? quote.promoCode.code : null,
    quoteSnapshot: JSON.stringify(quote),
    processedEventIds: [],
    stockDecremented: false,
    needsReview: false,
    createdAt: new Date().toISOString(),
  }
  await (await client()).create(doc)
  return { id, orderNumber, persisted: true }
}

export async function attachCheckoutSession(
  orderId: string,
  sessionId: string,
  couponId: string | null,
) {
  if (!features.sanityWrite) return
  await (
    await client()
  )
    .patch(orderId)
    .set({
      'stripe.checkoutSessionId': sessionId,
      'stripe.couponId': couponId,
      updatedAt: new Date().toISOString(),
    })
    .commit()
}

async function getOrder(id: string): Promise<OrderDoc | null> {
  return (await client()).getDocument<OrderDoc>(id).then((d) => d ?? null)
}

function addressLines(a: OrderDoc['shippingAddress']): string[] {
  if (!a) return []
  return [
    a.line1,
    a.line2,
    [a.city, a.province, a.postalCode].filter(Boolean).join(' '),
    a.country === 'CA' ? 'Canada' : a.country,
  ].filter((x): x is string => Boolean(x))
}

function emailLines(lines: OrderLine[]): EmailLine[] {
  return lines.map((l) => ({
    title: l.title,
    variantTitle: l.variantTitle,
    qty: l.qty,
    lineTotalCents: l.lineSubtotalCents - l.discountCents,
    imageUrl: l.imageUrl,
  }))
}

function studioUrl(id: string) {
  return absoluteUrl(`/studio/structure/orders;${encodeURIComponent(id)}`)
}

function fromSession(session: Stripe.Checkout.Session) {
  const shipping = session.collected_information?.shipping_details
  const rate = session.shipping_cost?.shipping_rate
  const rateObj = rate && typeof rate === 'object' ? rate : null
  const est = rateObj?.delivery_estimate
  return {
    customer: {
      email: session.customer_details?.email ?? session.customer_email ?? null,
      name: session.customer_details?.name ?? shipping?.name ?? null,
      phone: session.customer_details?.phone ?? null,
    },
    shippingAddress: shipping
      ? {
          line1: shipping.address.line1,
          line2: shipping.address.line2,
          city: shipping.address.city,
          province: shipping.address.state,
          postalCode: shipping.address.postal_code,
          country: shipping.address.country,
        }
      : undefined,
    shippingMethod: rateObj?.display_name ?? null,
    shippingEta:
      est?.minimum && est?.maximum
        ? `${est.minimum.value} to ${est.maximum.value} business days`
        : null,
    amounts: {
      shippingCents:
        session.total_details?.amount_shipping ?? session.shipping_cost?.amount_total ?? 0,
      taxCents: session.total_details?.amount_tax ?? 0,
      totalCents: session.amount_total ?? 0,
      discountCents: session.total_details?.amount_discount ?? 0,
    },
    paymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
  }
}

/**
 * checkout.session.completed / async_payment_succeeded (PRD 9.3): mark paid, decrement stock once,
 * flag oversells for review, send the confirmation and owner emails. Idempotent on event ID.
 */
export async function markOrderPaid(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<'processed' | 'duplicate' | 'pending_payment' | 'not_stored'> {
  const info = fromSession(session)
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  const orderId = session.metadata?.orderId ?? session.client_reference_id
  const shell = await emailShell()

  if (!features.sanityWrite || !orderId) {
    // Degraded mode: no order store, but the customer still gets a confirmation built from Stripe.
    if (!paid) return 'pending_payment'
    const lines: EmailLine[] = (session.line_items?.data ?? []).map((li) => ({
      title: li.description ?? 'Item',
      variantTitle: 'Default',
      qty: li.quantity ?? 1,
      lineTotalCents: li.amount_total,
    }))
    if (info.customer.email)
      await sendEmail({
        to: info.customer.email,
        subject: `Order ${session.metadata?.orderNumber ?? ''} confirmed`,
        react: OrderConfirmationEmail({
          order: {
            orderNumber: session.metadata?.orderNumber ?? session.id.slice(-8),
            customerName: info.customer.name,
            lines,
            subtotalCents: session.amount_subtotal ?? 0,
            discountCents: info.amounts.discountCents,
            shippingCents: info.amounts.shippingCents,
            taxCents: info.amounts.taxCents,
            totalCents: info.amounts.totalCents,
            shippingMethod: info.shippingMethod,
            eta: info.shippingEta,
            address: addressLines(info.shippingAddress),
          },
          shell,
        }),
      })
    return 'not_stored'
  }

  const sanity = await client()
  for (let attempt = 0; attempt < 3; attempt++) {
    const order = await getOrder(orderId)
    if (!order) {
      console.error(`[orders] webhook for unknown order ${orderId}`)
      return 'not_stored'
    }
    if (order.processedEventIds?.includes(eventId)) return 'duplicate'

    const now = new Date().toISOString()
    const tx = sanity.transaction()
    const orderPatch = sanity
      .patch(order._id)
      .ifRevisionId(order._rev!)
      .setIfMissing({ processedEventIds: [] })
      .append('processedEventIds', [eventId])
      .set({
        customer: info.customer,
        ...(info.shippingAddress ? { shippingAddress: info.shippingAddress } : {}),
        shippingMethod: info.shippingMethod,
        shippingEta: info.shippingEta,
        'amounts.shippingCents': info.amounts.shippingCents,
        'amounts.taxCents': info.amounts.taxCents,
        'amounts.totalCents': info.amounts.totalCents,
        'stripe.checkoutSessionId': session.id,
        'stripe.paymentIntentId': info.paymentIntentId,
        updatedAt: now,
      })

    const firstPayment = paid && (order.status === 'pending' || order.status === 'expired')
    const shouldDecrement = paid && !order.stockDecremented
    if (firstPayment) orderPatch.set({ status: 'paid', paidAt: order.paidAt ?? now })
    if (shouldDecrement) orderPatch.set({ stockDecremented: true })
    tx.patch(orderPatch)

    // Decrement tracked stock per variant with `dec`, in the same transaction as the order flag.
    let productIds: string[] = []
    if (shouldDecrement) {
      productIds = [...new Set(order.lines.map((l) => `product-${l.productSlug}`))]
      const products = await sanity.fetch<
        { _id: string; variants: { _key: string; stock: number | null }[] }[]
      >(`*[_id in $ids]{ _id, variants[]{ _key, stock } }`, { ids: productIds })
      for (const line of order.lines) {
        const product = products.find((p) => p._id === `product-${line.productSlug}`)
        const variant = product?.variants?.find((v) => v._key === skuKey(line.sku))
        if (product && variant && typeof variant.stock === 'number')
          tx.patch(product._id, (p) =>
            p.dec({ [`variants[_key=="${variant._key}"].stock`]: line.qty }),
          )
      }
    }

    try {
      await tx.commit({ visibility: 'sync' })
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 409 && attempt < 2) continue // another event changed the order first: re-read
      throw err
    }

    if (!paid) return 'pending_payment'

    // Oversell check (PRD 9.3) and first-order code re-check.
    const reasons: string[] = []
    if (shouldDecrement && productIds.length) {
      const negatives = await sanity.fetch<number>(
        `count(*[_id in $ids && count(variants[stock < 0]) > 0])`,
        {
          ids: productIds,
        },
      )
      if (negatives > 0) reasons.push('Stock went below zero on at least one variant.')
    }
    if (order.promoCode && info.customer.email) {
      const code = (await getPromoCodes()).find((c) => c.code === order.promoCode)
      if (code?.firstOrderOnly) {
        const prior = await sanity.fetch<number>(
          `count(*[_type == "order" && _id != $id && status in ["paid","shipped","delivered"] && lower(customer.email) == $email && promoCode == $code])`,
          { id: order._id, email: info.customer.email.toLowerCase(), code: order.promoCode },
        )
        if (prior > 0) reasons.push(`${order.promoCode} was already used by this email.`)
      }
    }
    const needsReview = reasons.length > 0
    if (needsReview)
      await sanity
        .patch(order._id)
        .set({ needsReview: true, notes: reasons.join(' ') })
        .commit()

    if (firstPayment) {
      const lines = emailLines(order.lines)
      if (info.customer.email)
        await sendEmail({
          to: info.customer.email,
          subject: `Order ${order.orderNumber} confirmed`,
          react: OrderConfirmationEmail({
            order: {
              orderNumber: order.orderNumber,
              customerName: info.customer.name,
              lines,
              subtotalCents: order.amounts.subtotalCents,
              discountCents: info.amounts.discountCents || order.amounts.discountCents,
              shippingCents: info.amounts.shippingCents,
              taxCents: info.amounts.taxCents,
              totalCents: info.amounts.totalCents,
              shippingMethod: info.shippingMethod,
              eta: info.shippingEta,
              address: addressLines(info.shippingAddress),
            },
            shell,
          }),
        })
      if (env.OWNER_EMAIL)
        await sendEmail({
          to: env.OWNER_EMAIL,
          subject: `${needsReview ? '[Needs review] ' : ''}New order ${order.orderNumber}`,
          react: OwnerOrderEmail({
            orderNumber: order.orderNumber,
            totalCents: info.amounts.totalCents,
            customer: [info.customer.name, info.customer.email].filter(Boolean).join(', '),
            lines,
            studioUrl: studioUrl(order._id),
            needsReview,
            shell,
          }),
        })
    }
    return 'processed'
  }
  return 'duplicate'
}

/** checkout.session.expired: no stock change (PRD 9.3). */
export async function markOrderExpired(session: Stripe.Checkout.Session, eventId: string) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id
  if (!features.sanityWrite || !orderId) return 'not_stored'
  const order = await getOrder(orderId)
  if (!order) return 'not_stored'
  if (order.processedEventIds?.includes(eventId)) return 'duplicate'
  await (
    await client()
  )
    .patch(orderId)
    .setIfMissing({ processedEventIds: [] })
    .append('processedEventIds', [eventId])
    .set({
      ...(order.status === 'pending' ? { status: 'expired' } : {}),
      updatedAt: new Date().toISOString(),
    })
    .commit()
  return 'processed'
}

/** charge.refunded: refunded or partially_refunded; restocking is the owner's call (PRD 9.3). */
export async function markOrderRefunded(charge: Stripe.Charge, eventId: string) {
  if (!features.sanityWrite) return 'not_stored'
  const pi =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!pi) return 'not_stored'
  const sanity = await client()
  const order = await sanity.fetch<OrderDoc | null>(
    `*[_type == "order" && stripe.paymentIntentId == $pi][0]`,
    { pi },
  )
  if (!order) return 'not_stored'
  if (order.processedEventIds?.includes(eventId)) return 'duplicate'
  const status: OrderStatus =
    charge.amount_refunded >= charge.amount ? 'refunded' : 'partially_refunded'
  await sanity
    .patch(order._id)
    .setIfMissing({ processedEventIds: [] })
    .append('processedEventIds', [eventId])
    .set({ status, updatedAt: new Date().toISOString() })
    .commit()
  return 'processed'
}

export const CARRIERS: Record<string, (tracking: string) => string> = {
  'Canada Post': (n) =>
    `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${encodeURIComponent(n)}`,
  Purolator: (n) => `https://www.purolator.com/en/shipping/tracker?pin=${encodeURIComponent(n)}`,
  UPS: (n) => `https://www.ups.com/track?loc=en_CA&tracknum=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
}

export function trackingUrl(carrier: string, tracking: string): string {
  return (CARRIERS[carrier] ?? CARRIERS['Canada Post'])(tracking)
}

/** "Mark as shipped" (PRD 9.4): set carrier and tracking, then email the customer. */
export async function shipOrder(orderId: string, carrier: string, trackingNumber: string) {
  const sanity = await client()
  const order = await getOrder(orderId)
  if (!order) return { ok: false as const, error: 'not_found' }
  if (!['paid', 'shipped'].includes(order.status))
    return { ok: false as const, error: `cannot_ship_${order.status}` }
  const now = new Date().toISOString()
  await sanity
    .patch(orderId)
    .set({
      status: 'shipped',
      carrier,
      trackingNumber,
      shippedAt: order.shippedAt ?? now,
      updatedAt: now,
    })
    .commit()
  if (order.customer?.email)
    await sendEmail({
      to: order.customer.email,
      subject: `Order ${order.orderNumber} has shipped`,
      react: ShippingEmail({
        orderNumber: order.orderNumber,
        carrier,
        trackingNumber,
        trackingUrl: trackingUrl(carrier, trackingNumber),
        lines: emailLines(order.lines),
        shell: await emailShell(),
      }),
    })
  return { ok: true as const, orderNumber: order.orderNumber }
}

/** Order status lookup (PRD 13): requires number + email, returns minimal data. */
export async function lookupOrder(orderNumber: string, email: string) {
  const order = await (
    await client()
  ).fetch<OrderDoc | null>(
    `*[_type == "order" && orderNumber == $n && lower(customer.email) == $e][0]`,
    { n: orderNumber.trim().toUpperCase(), e: email.trim().toLowerCase() },
  )
  if (!order || order.status === 'pending') return null
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.paidAt ?? order.createdAt,
    items: order.lines.map((l) => ({ title: l.title, variantTitle: l.variantTitle, qty: l.qty })),
    carrier: order.carrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    trackingUrl:
      order.carrier && order.trackingNumber
        ? trackingUrl(order.carrier, order.trackingNumber)
        : null,
  }
}

/** For the success page: the order behind a Checkout Session, if stored. */
export async function findOrderBySession(
  sessionId: string,
  orderId?: string | null,
): Promise<OrderDoc | null> {
  if (!features.sanityWrite) return null
  if (orderId) {
    const byId = await getOrder(orderId)
    if (byId) return byId
  }
  return (await client()).fetch<OrderDoc | null>(
    `*[_type == "order" && stripe.checkoutSessionId == $id][0]`,
    {
      id: sessionId,
    },
  )
}
