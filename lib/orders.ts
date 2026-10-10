import 'server-only'
import { randomUUID } from 'node:crypto'
import type Stripe from 'stripe'
import {
  createCustomerOrder,
  customerOrderIdFor,
  findCustomerOrderByPaymentIntent,
  findCustomerOrderBySanityId,
  getCustomerOrder,
  updateCustomerOrder,
} from '@/lib/account/customer-orders'
import { ensureProfile } from '@/lib/account/store'
import type { CustomerOrder, CustomerOrderStatus, ShippingAddress } from '@/lib/account/types'
import { getPromoCodes } from '@/lib/data'
import { sendAccountSetupEmail } from '@/lib/auth/links'
import { emailShell, sendEmail } from '@/lib/email/send'
import {
  OrderConfirmationEmail,
  OwnerOrderEmail,
  ShippingEmail,
} from '@/lib/email/templates/emails'
import type { EmailLine } from '@/lib/email/templates/order-items'
import { hashEmail } from '@/lib/email-hash'
import { env, features } from '@/lib/env'
import { adminAuth } from '@/lib/firebase/admin'
import { generateOrderNumber, skuKey } from '@/lib/order-number'
import type { Quote, TaxLine } from '@/lib/pricing/types'
import { absoluteUrl } from '@/lib/public-env'
import { getStripe } from '@/lib/stripe'

/**
 * Order lifecycle (PRD 9.2 to 9.4): pending -> paid -> shipped -> delivered (+ expired, cancelled, refunded,
 * partially_refunded).
 *
 * Two independent stores (PRD 9.8):
 *  - Sanity: the non-personal order (number, lines, amounts, tax lines, status, province, tracking, Stripe IDs,
 *    `emailHash`). Needed for the Studio workflow and stock. The Sanity free plan is a public dataset.
 *  - Firestore `customerOrders`: the customer side (name, email, phone, address) plus a copy of the lines and
 *    totals for the account pages. Written only here, with the Admin SDK.
 * Either may be missing (not configured); emails then fall back to the PaymentIntent, which also carries the
 * shipping details and receipt email for payment and fraud checks.
 */

export type OrderStatus = CustomerOrderStatus

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
  taxLines: (TaxLine & { _key?: string })[]
  promoCode: string | null
  quoteSnapshot: string
  /** Salted SHA-256 of the lowercased email (lib/email-hash.ts). Never the email itself. */
  emailHash?: string | null
  /** Two-letter province code for reporting; the full address stays in Firestore. */
  shippingProvince?: string | null
  shippingMethod?: string | null
  shippingEta?: string | null
  carrier?: string | null
  trackingNumber?: string | null
  stripe?: { paymentIntentId?: string | null; livemode?: boolean; lastPaymentError?: string | null }
  processedEventIds: string[]
  stockDecremented: boolean
  needsReview: boolean
  notes?: string | null
  createdAt: string
  paidAt?: string | null
  shippedAt?: string | null
  updatedAt?: string | null
}

type CustomerOrderDoc = CustomerOrder & { processedEventIds?: string[] }

async function sanityClient() {
  const { sanityWriteClient } = await import('@/sanity/lib/server-client')
  return sanityWriteClient()
}

const now = () => new Date().toISOString()

/** The customer as collected at checkout. Never stored in Sanity. */
export interface CustomerDetails {
  email: string | null
  name: string | null
  phone: string | null
  address: ShippingAddress | null
}

// ---------- Snapshots ----------

function orderLinesFromQuote(quote: Quote): OrderLine[] {
  return quote.lines.map((l) => ({
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
  }))
}

function amountsFromQuote(quote: Quote): OrderDoc['amounts'] {
  return {
    subtotalCents: quote.merchandiseSubtotalCents,
    automaticDiscountCents: quote.automaticDiscountCents,
    codeDiscountCents: quote.codeDiscountCents,
    discountCents: quote.automaticDiscountCents + quote.codeDiscountCents,
    shippingCents: quote.shipping?.amountCents ?? 0,
    taxCents: quote.taxCents,
    totalCents: quote.totalCents,
  }
}

function taxLinesWithKeys(quote: Quote) {
  return quote.taxLines.map((l) => ({
    ...l,
    _key: `${l.code.toLowerCase()}-${l.ratePercent}`.replace(/[^a-z0-9-]/g, '-'),
  }))
}

function customerOrderFromQuote(args: {
  sanityOrderId: string | null
  orderNumber: string
  quote: Quote
  customer: CustomerDetails
  uid: string | null
  createAccount: boolean
  paymentIntentId: string | null
  createdAt?: string
}): CustomerOrder {
  const { quote } = args
  const a = amountsFromQuote(quote)
  return {
    sanityOrderId: args.sanityOrderId,
    orderNumber: args.orderNumber,
    uid: args.uid,
    email: args.customer.email?.toLowerCase() ?? null,
    name: args.customer.name,
    phone: args.customer.phone,
    shippingAddress: args.customer.address,
    stripePaymentIntentId: args.paymentIntentId,
    status: 'pending',
    totals: {
      subtotalCents: a.subtotalCents,
      discountCents: a.discountCents,
      shippingCents: a.shippingCents,
      taxCents: a.taxCents,
      totalCents: a.totalCents,
      taxLines: quote.taxLines,
    },
    lines: quote.lines.map((l) => ({
      sku: l.sku,
      productSlug: l.productSlug,
      title: l.title,
      variantTitle: l.variantTitle,
      qty: l.qty,
      unitPriceCents: l.unitPriceCents,
      lineTotalCents: l.lineSubtotalCents - l.discountCents,
      image: l.image?.src ?? null,
    })),
    shippingMethod: quote.shipping?.label ?? null,
    promoCode: quote.promoCode?.applied ? quote.promoCode.code : null,
    carrier: null,
    trackingNumber: null,
    shippedAt: null,
    createAccount: args.createAccount,
    createdAt: args.createdAt ?? now(),
    paidAt: null,
    anonymisedAt: null,
  }
}

// ---------- Create and update the pending order ----------

export interface PendingOrderInput {
  quote: Quote
  customer: CustomerDetails
  /** Province for reporting and tax when only it is known (no full address yet). */
  province?: string | null
  uid: string | null
  createAccount: boolean
}

export interface PendingOrder {
  /** Sanity document ID; also the base of the Firestore document ID. */
  id: string
  orderNumber: string
  stores: { sanity: boolean; firestore: boolean }
}

/** Paid redemptions of codes by this email, for first-order-only checks (PRD 7.4), matched on emailHash. */
export async function findCodeRedemptions(
  email: string,
): Promise<{ code: string; email: string }[]> {
  if (!features.sanityWrite) return []
  const codes = await (
    await sanityClient()
  ).fetch<(string | null)[]>(
    `*[_type == "order" && status in ["paid","shipped","delivered","partially_refunded"] && emailHash == $hash && defined(promoCode)].promoCode`,
    { hash: hashEmail(email) },
  )
  // Rows found belong to this email (same hash), so the email is echoed back for the pricing engine.
  return codes.filter((c): c is string => Boolean(c)).map((code) => ({ code, email }))
}

export async function createPendingOrder(input: PendingOrderInput): Promise<PendingOrder> {
  const id = `orders.${randomUUID()}`
  const orderNumber = generateOrderNumber()
  const { quote, customer } = input
  const stores = { sanity: features.sanityWrite, firestore: features.firebaseAdmin }
  if (!stores.sanity)
    console.warn(
      `[orders] SANITY_API_WRITE_TOKEN is not set: order ${orderNumber} has no Sanity document (no stock decrement, no Studio workflow)`,
    )

  if (stores.sanity) {
    const doc: OrderDoc = {
      _id: id,
      _type: 'order',
      orderNumber,
      status: 'pending',
      lines: orderLinesFromQuote(quote),
      amounts: amountsFromQuote(quote),
      taxLines: taxLinesWithKeys(quote),
      promoCode: quote.promoCode?.applied ? quote.promoCode.code : null,
      quoteSnapshot: JSON.stringify(quote),
      emailHash: customer.email ? hashEmail(customer.email) : null,
      shippingProvince: input.province ?? customer.address?.province ?? null,
      shippingMethod: quote.shipping?.label ?? null,
      shippingEta: quote.shipping?.eta ?? null,
      processedEventIds: [],
      stockDecremented: false,
      needsReview: false,
      createdAt: now(),
    }
    await (await sanityClient()).create(doc)
  }
  if (stores.firestore) {
    await createCustomerOrder(
      customerOrderIdFor(id),
      customerOrderFromQuote({
        sanityOrderId: stores.sanity ? id : null,
        orderNumber,
        quote,
        customer,
        uid: input.uid,
        createAccount: input.createAccount,
        paymentIntentId: null,
      }),
    )
  }
  return { id, orderNumber, stores }
}

/** Re-quote of a still-pending order: refresh amounts, lines, tax and the customer details everywhere. */
export async function updatePendingOrder(id: string, input: PendingOrderInput) {
  const { quote, customer } = input
  if (features.sanityWrite) {
    await (
      await sanityClient()
    )
      .patch(id)
      .set({
        lines: orderLinesFromQuote(quote),
        amounts: amountsFromQuote(quote),
        taxLines: taxLinesWithKeys(quote),
        promoCode: quote.promoCode?.applied ? quote.promoCode.code : null,
        quoteSnapshot: JSON.stringify(quote),
        emailHash: customer.email ? hashEmail(customer.email) : null,
        shippingProvince: input.province ?? customer.address?.province ?? null,
        shippingMethod: quote.shipping?.label ?? null,
        shippingEta: quote.shipping?.eta ?? null,
        updatedAt: now(),
      })
      .commit()
  }
  if (features.firebaseAdmin) {
    const existing = await getCustomerOrder(customerOrderIdFor(id))
    if (!existing) return
    const fresh = customerOrderFromQuote({
      sanityOrderId: existing.sanityOrderId,
      orderNumber: existing.orderNumber,
      quote,
      customer,
      uid: input.uid,
      createAccount: input.createAccount,
      paymentIntentId: existing.stripePaymentIntentId,
      createdAt: existing.createdAt,
    })
    await updateCustomerOrder(customerOrderIdFor(id), { ...fresh, status: existing.status })
  }
}

export async function attachPaymentIntent(
  id: string,
  pi: Pick<Stripe.PaymentIntent, 'id' | 'livemode'>,
) {
  if (features.sanityWrite) {
    await (
      await sanityClient()
    )
      .patch(id)
      .set({ 'stripe.paymentIntentId': pi.id, 'stripe.livemode': pi.livemode, updatedAt: now() })
      .commit()
  }
  if (features.firebaseAdmin)
    await updateCustomerOrder(customerOrderIdFor(id), { stripePaymentIntentId: pi.id })
}

export async function getOrder(id: string): Promise<OrderDoc | null> {
  if (!features.sanityWrite) return null
  return (await sanityClient()).getDocument<OrderDoc>(id).then((d) => d ?? null)
}

// ---------- Customer details (Firestore first, PaymentIntent as the fallback) ----------

function addressFromStripe(
  a: Stripe.Address | null | undefined,
  name: string | null | undefined,
  phone: string | null | undefined,
): ShippingAddress | null {
  if (!a) return null
  return {
    name: name ?? '',
    line1: a.line1 ?? '',
    line2: a.line2 ?? '',
    city: a.city ?? '',
    province: a.state ?? '',
    postalCode: a.postal_code ?? '',
    phone: phone ?? '',
  }
}

export function customerFromPaymentIntent(pi: Stripe.PaymentIntent): CustomerDetails {
  return {
    email: pi.receipt_email ?? null,
    name: pi.shipping?.name ?? null,
    phone: pi.shipping?.phone ?? null,
    address: addressFromStripe(pi.shipping?.address, pi.shipping?.name, pi.shipping?.phone),
  }
}

export function addressLines(c: CustomerDetails): string[] {
  const a = c.address
  if (!a) return []
  return [
    c.name ?? a.name,
    a.line1,
    a.line2,
    [a.city, a.province, a.postalCode].filter(Boolean).join(' '),
    'Canada',
  ].filter((x): x is string => Boolean(x))
}

/** The customer behind an order: the Firestore customerOrders document, else the Stripe PaymentIntent. */
export async function customerForOrder(order: {
  _id: string
  stripe?: { paymentIntentId?: string | null; livemode?: boolean } | null
}): Promise<
  (CustomerDetails & { stripeUrl: string | null; source: 'firestore' | 'stripe' }) | null
> {
  const piId = order.stripe?.paymentIntentId ?? null
  const dashboard = `https://dashboard.stripe.com${order.stripe?.livemode ? '' : '/test'}`
  const stripeUrl = piId ? `${dashboard}/payments/${piId}` : null
  if (features.firebaseAdmin) {
    const fs = await findCustomerOrderBySanityId(order._id)
    if (fs && (fs.email || fs.name))
      return {
        email: fs.email,
        name: fs.name,
        phone: fs.phone,
        address: fs.shippingAddress,
        stripeUrl,
        source: 'firestore',
      }
  }
  const stripe = getStripe()
  if (stripe && piId) {
    const pi = await stripe.paymentIntents.retrieve(piId)
    return { ...customerFromPaymentIntent(pi), stripeUrl, source: 'stripe' }
  }
  return null
}

// ---------- Email building ----------

function emailLinesFromOrder(order: OrderDoc | null, fs: CustomerOrder | null): EmailLine[] {
  if (order)
    return order.lines.map((l) => ({
      title: l.title,
      variantTitle: l.variantTitle,
      qty: l.qty,
      lineTotalCents: l.lineSubtotalCents - l.discountCents,
      imageUrl: l.imageUrl,
    }))
  return (fs?.lines ?? []).map((l) => ({
    title: l.title,
    variantTitle: l.variantTitle,
    qty: l.qty,
    lineTotalCents: l.lineTotalCents,
    imageUrl: l.image ? absoluteUrl(l.image) : null,
  }))
}

function studioUrl(id: string) {
  return absoluteUrl(`/studio/structure/orders;${encodeURIComponent(id)}`)
}

// ---------- Webhook handlers (PRD 9.3) ----------

export type WebhookResult = 'processed' | 'duplicate' | 'ignored'

async function loadOrderStores(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId
  if (!orderId) return null
  const [order, fsOrder] = await Promise.all([
    getOrder(orderId),
    features.firebaseAdmin ? getCustomerOrder(customerOrderIdFor(orderId)) : Promise.resolve(null),
  ])
  return { orderId, order, fsOrder: fsOrder as CustomerOrderDoc | null }
}

function seen(eventId: string, order: OrderDoc | null, fs: CustomerOrderDoc | null): boolean {
  return Boolean(
    order?.processedEventIds?.includes(eventId) || fs?.processedEventIds?.includes(eventId),
  )
}

/** Update the Firestore mirror and remember the webhook event ID there too (idempotency without Sanity). */
async function mirror(
  orderId: string,
  patch: Partial<CustomerOrder>,
  existing: CustomerOrderDoc | null,
  eventId?: string,
) {
  if (!features.firebaseAdmin || !existing) return
  const prior = existing.processedEventIds ?? []
  await updateCustomerOrder(customerOrderIdFor(orderId), {
    ...patch,
    ...(eventId ? { processedEventIds: [...prior, eventId] } : {}),
  } as Partial<CustomerOrder>)
}

/**
 * payment_intent.succeeded (PRD 9.3): verify the amount, mark paid, decrement stock once, flag oversells and
 * mismatches for review, mirror to the account, link or set up the customer's account, send the emails.
 * Idempotent on the event ID; a failure throws so the route returns 500 and Stripe retries.
 */
export async function markOrderPaid(
  pi: Stripe.PaymentIntent,
  eventId: string,
): Promise<WebhookResult> {
  const stores = await loadOrderStores(pi)
  if (!stores) {
    console.warn(`[orders] payment_intent.succeeded ${pi.id} has no orderId metadata`)
    return 'ignored'
  }
  const { orderId, order, fsOrder } = stores
  if (!order && !fsOrder) {
    // Neither store is configured: confirm to the customer from the PaymentIntent alone.
    await sendMinimalConfirmation(pi)
    return 'processed'
  }
  if (seen(eventId, order, fsOrder)) return 'duplicate'

  const expectedTotal = order?.amounts.totalCents ?? fsOrder?.totals.totalCents ?? pi.amount
  const reasons: string[] = []
  if (pi.amount_received !== expectedTotal)
    reasons.push(`Paid ${pi.amount_received} cents but the order total is ${expectedTotal}.`)

  const orderNumber = order?.orderNumber ?? fsOrder?.orderNumber ?? pi.metadata.orderNumber ?? pi.id
  const paidAt = now()
  const firstPayment = order
    ? order.status === 'pending' || order.status === 'expired'
    : fsOrder?.status === 'pending' || fsOrder?.status === 'expired'
  let productIds: string[] = []

  if (order) {
    const sanity = await sanityClient()
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = attempt === 0 ? order : await getOrder(orderId)
      if (!current) return 'ignored'
      if (current.processedEventIds?.includes(eventId)) return 'duplicate'
      const tx = sanity.transaction()
      const patch = sanity
        .patch(current._id)
        .ifRevisionId(current._rev!)
        .setIfMissing({ processedEventIds: [] })
        .append('processedEventIds', [eventId])
        .set({ 'stripe.paymentIntentId': pi.id, 'stripe.livemode': pi.livemode, updatedAt: paidAt })
      const shouldDecrement = !current.stockDecremented
      if (current.status === 'pending' || current.status === 'expired')
        patch.set({ status: 'paid', paidAt: current.paidAt ?? paidAt })
      if (shouldDecrement) patch.set({ stockDecremented: true })
      tx.patch(patch)

      if (shouldDecrement) {
        productIds = [...new Set(current.lines.map((l) => `product-${l.productSlug}`))]
        const products = await sanity.fetch<
          { _id: string; variants: { _key: string; stock: number | null }[] }[]
        >(`*[_id in $ids]{ _id, variants[]{ _key, stock } }`, { ids: productIds })
        for (const line of current.lines) {
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
        break
      } catch (err) {
        if ((err as { statusCode?: number }).statusCode === 409 && attempt < 2) continue // another event changed the order: re-read
        throw err
      }
    }
    if (productIds.length) {
      const negatives = await sanity.fetch<number>(
        `count(*[_id in $ids && count(variants[stock < 0]) > 0])`,
        { ids: productIds },
      )
      if (negatives > 0) reasons.push('Stock went below zero on at least one variant.')
    }
    if (order.promoCode && order.emailHash) {
      const code = (await getPromoCodes()).find((c) => c.code === order.promoCode)
      if (code?.firstOrderOnly) {
        const prior = await sanity.fetch<number>(
          `count(*[_type == "order" && _id != $id && status in ["paid","shipped","delivered"] && emailHash == $hash && promoCode == $code])`,
          { id: order._id, hash: order.emailHash, code: order.promoCode },
        )
        if (prior > 0) reasons.push(`${order.promoCode} was already used by this email.`)
      }
    }
    if (reasons.length)
      await sanity
        .patch(orderId)
        .set({ needsReview: true, notes: reasons.join(' ') })
        .commit()
  }

  // Customer details: Firestore, else the PaymentIntent. Mirror "paid" to Firestore and link a verified account.
  const customer: CustomerDetails =
    fsOrder && (fsOrder.email || fsOrder.name)
      ? {
          email: fsOrder.email,
          name: fsOrder.name,
          phone: fsOrder.phone,
          address: fsOrder.shippingAddress,
        }
      : customerFromPaymentIntent(pi)
  let uid = fsOrder?.uid ?? null
  if (fsOrder && !uid && customer.email && features.firebaseAdmin) {
    // A guest who already has a verified account with this email: link the order right away (PRD 9.9).
    try {
      const record = await adminAuth().getUserByEmail(customer.email)
      if (record.emailVerified) uid = record.uid
    } catch {
      /* no account with that email */
    }
  }
  await mirror(
    orderId,
    {
      status: firstPayment ? 'paid' : (fsOrder?.status ?? 'paid'),
      paidAt: fsOrder?.paidAt ?? paidAt,
      uid,
      stripePaymentIntentId: pi.id,
    },
    fsOrder,
    eventId,
  )

  if (firstPayment) {
    const lines = emailLinesFromOrder(order, fsOrder)
    const totals = fsOrder?.totals ?? {
      subtotalCents: order!.amounts.subtotalCents,
      discountCents: order!.amounts.discountCents,
      shippingCents: order!.amounts.shippingCents,
      taxCents: order!.amounts.taxCents,
      totalCents: order!.amounts.totalCents,
      taxLines: order!.taxLines,
    }
    const shell = await emailShell()
    if (customer.email)
      await sendEmail({
        to: customer.email,
        subject: `Order ${orderNumber} confirmed`,
        react: OrderConfirmationEmail({
          order: {
            orderNumber,
            customerName: customer.name,
            lines,
            subtotalCents: totals.subtotalCents,
            discountCents: totals.discountCents,
            shippingCents: totals.shippingCents,
            taxLines: totals.taxLines,
            taxCents: totals.taxCents,
            totalCents: totals.totalCents,
            shippingMethod: order?.shippingMethod ?? fsOrder?.shippingMethod ?? null,
            eta: order?.shippingEta ?? null,
            address: addressLines(customer),
          },
          shell,
        }),
      })
    if (env.OWNER_EMAIL)
      await sendEmail({
        to: env.OWNER_EMAIL,
        subject: `${reasons.length ? '[Needs review] ' : ''}New order ${orderNumber}`,
        react: OwnerOrderEmail({
          orderNumber,
          totalCents: totals.totalCents,
          customer: [customer.name, customer.email].filter(Boolean).join(', '),
          lines,
          studioUrl: order ? studioUrl(order._id) : absoluteUrl('/studio'),
          needsReview: reasons.length > 0,
          shell,
        }),
      })
    if (fsOrder?.createAccount && !uid && customer.email)
      await setUpGuestAccount(customer, orderNumber).catch((err) =>
        console.error('[orders] could not set up the account', err),
      )
  }
  return 'processed'
}

/** Creates the Firebase user for a guest who ticked "Create an account" and emails them a sign-in link. */
async function setUpGuestAccount(customer: CustomerDetails, orderNumber: string) {
  if (!customer.email) return
  const auth = adminAuth()
  try {
    await auth.getUserByEmail(customer.email)
  } catch {
    const created = await auth.createUser({
      email: customer.email,
      emailVerified: false,
      displayName: customer.name ?? undefined,
    })
    const [firstName, ...rest] = (customer.name ?? '').split(' ')
    await ensureProfile(created.uid, customer.email, {
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      phone: customer.phone ?? '',
    })
  }
  await sendAccountSetupEmail(customer.email, orderNumber)
}

/** Fallback with no order stores at all: a plain confirmation built from the PaymentIntent. */
async function sendMinimalConfirmation(pi: Stripe.PaymentIntent) {
  const customer = customerFromPaymentIntent(pi)
  if (!customer.email) return
  await sendEmail({
    to: customer.email,
    subject: `Order ${pi.metadata.orderNumber ?? ''} confirmed`.replace('  ', ' '),
    react: OrderConfirmationEmail({
      order: {
        orderNumber: pi.metadata.orderNumber ?? pi.id.slice(-8),
        customerName: customer.name,
        lines: [],
        subtotalCents: pi.amount_received,
        discountCents: 0,
        shippingCents: 0,
        taxLines: [],
        taxCents: 0,
        totalCents: pi.amount_received,
        shippingMethod: null,
        eta: null,
        address: addressLines(customer),
      },
      shell: await emailShell(),
    }),
  })
}

/** payment_intent.payment_failed: remember why; the order stays pending, stock is untouched, no customer email. */
export async function markPaymentFailed(
  pi: Stripe.PaymentIntent,
  eventId: string,
): Promise<WebhookResult> {
  const stores = await loadOrderStores(pi)
  if (!stores || (!stores.order && !stores.fsOrder)) return 'ignored'
  const { orderId, order, fsOrder } = stores
  if (seen(eventId, order, fsOrder)) return 'duplicate'
  const code =
    pi.last_payment_error?.decline_code ?? pi.last_payment_error?.code ?? 'payment_failed'
  if (order)
    await (
      await sanityClient()
    )
      .patch(orderId)
      .setIfMissing({ processedEventIds: [] })
      .append('processedEventIds', [eventId])
      .set({ 'stripe.lastPaymentError': code, updatedAt: now() })
      .commit()
  await mirror(orderId, {}, fsOrder, eventId)
  return 'processed'
}

/** payment_intent.canceled: the checkout was abandoned or cancelled; no stock change (PRD 9.3). */
export async function markOrderExpired(
  pi: Stripe.PaymentIntent,
  eventId: string,
): Promise<WebhookResult> {
  const stores = await loadOrderStores(pi)
  if (!stores || (!stores.order && !stores.fsOrder)) return 'ignored'
  const { orderId, order, fsOrder } = stores
  if (seen(eventId, order, fsOrder)) return 'duplicate'
  if (order)
    await (
      await sanityClient()
    )
      .patch(orderId)
      .setIfMissing({ processedEventIds: [] })
      .append('processedEventIds', [eventId])
      .set({ ...(order.status === 'pending' ? { status: 'expired' } : {}), updatedAt: now() })
      .commit()
  await mirror(
    orderId,
    fsOrder?.status === 'pending' ? { status: 'expired' } : {},
    fsOrder,
    eventId,
  )
  return 'processed'
}

/** charge.refunded: refunded or partially_refunded; restocking is the owner's call (PRD 9.3). */
export async function markOrderRefunded(
  charge: Stripe.Charge,
  eventId: string,
): Promise<WebhookResult> {
  const pi =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!pi) return 'ignored'
  const status: OrderStatus =
    charge.amount_refunded >= charge.amount ? 'refunded' : 'partially_refunded'
  let handled = false
  if (features.sanityWrite) {
    const sanity = await sanityClient()
    const order = await sanity.fetch<OrderDoc | null>(
      `*[_type == "order" && stripe.paymentIntentId == $pi][0]`,
      { pi },
    )
    if (order) {
      if (order.processedEventIds?.includes(eventId)) return 'duplicate'
      await sanity
        .patch(order._id)
        .setIfMissing({ processedEventIds: [] })
        .append('processedEventIds', [eventId])
        .set({ status, updatedAt: now() })
        .commit()
      if (features.firebaseAdmin && (await findCustomerOrderBySanityId(order._id)))
        await updateCustomerOrder(customerOrderIdFor(order._id), { status })
      handled = true
    }
  }
  if (!handled && features.firebaseAdmin) {
    const fs = (await findCustomerOrderByPaymentIntent(pi)) as
      (CustomerOrderDoc & { id: string }) | null
    if (fs) {
      const prior = fs.processedEventIds ?? []
      if (prior.includes(eventId)) return 'duplicate'
      await updateCustomerOrder(fs.id, {
        status,
        processedEventIds: [...prior, eventId],
      } as Partial<CustomerOrder>)
      handled = true
    }
  }
  return handled ? 'processed' : 'ignored'
}

// ---------- Fulfilment ----------

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

/** "Mark as shipped" (PRD 9.4): set carrier and tracking, mirror to the account, then email the customer. */
export async function shipOrder(orderId: string, carrier: string, trackingNumber: string) {
  const sanity = await sanityClient()
  const order = await getOrder(orderId)
  if (!order) return { ok: false as const, error: 'not_found' }
  if (!['paid', 'shipped'].includes(order.status))
    return { ok: false as const, error: `cannot_ship_${order.status}` }
  const at = now()
  await sanity
    .patch(orderId)
    .set({
      status: 'shipped',
      carrier,
      trackingNumber,
      shippedAt: order.shippedAt ?? at,
      updatedAt: at,
    })
    .commit()
  if (features.firebaseAdmin) {
    const fs = await findCustomerOrderBySanityId(orderId)
    if (fs)
      await updateCustomerOrder(customerOrderIdFor(orderId), {
        status: 'shipped',
        carrier,
        trackingNumber,
        shippedAt: fs.shippedAt ?? at,
      })
  }
  // The customer's email comes from Firestore (or Stripe) at send time, never from Sanity (PRD 9.8).
  const customer = await customerForOrder(order)
  if (customer?.email)
    await sendEmail({
      to: customer.email,
      subject: `Order ${order.orderNumber} has shipped`,
      react: ShippingEmail({
        orderNumber: order.orderNumber,
        carrier,
        trackingNumber,
        trackingUrl: trackingUrl(carrier, trackingNumber),
        lines: emailLinesFromOrder(order, null),
        shell: await emailShell(),
      }),
    })
  else console.warn(`[orders] shipped ${order.orderNumber} but could not find the customer's email`)
  return { ok: true as const, orderNumber: order.orderNumber, emailed: Boolean(customer?.email) }
}

/** Order status lookup (PRD 13): order number + email, matched via emailHash; status and tracking only. */
export async function lookupOrder(orderNumber: string, email: string) {
  const order = await (
    await sanityClient()
  ).fetch<OrderDoc | null>(`*[_type == "order" && orderNumber == $n && emailHash == $h][0]`, {
    n: orderNumber.trim().toUpperCase(),
    h: hashEmail(email),
  })
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

/** Account deletion: clears `emailHash` on the customer's Sanity orders so nothing links back to them (PRD 9.8). */
export async function clearOrderEmailHashes(sanityOrderIds: string[]) {
  if (!features.sanityWrite || !sanityOrderIds.length) return
  const sanity = await sanityClient()
  const tx = sanity.transaction()
  for (const id of sanityOrderIds) tx.patch(id, (p) => p.unset(['emailHash']))
  await tx.commit()
}
