import 'server-only'
import type Stripe from 'stripe'
import { jsonError, noStore } from '@/lib/api'
import { getSessionUser } from '@/lib/auth/session'
import { computeQuote } from '@/lib/commerce/quote'
import type { CheckoutSessionInput } from '@/lib/commerce/schemas'
import { features } from '@/lib/env'
import {
  attachPaymentIntent,
  createPendingOrder,
  updatePendingOrder,
  type CustomerDetails,
} from '@/lib/orders'
import { getStripe } from '@/lib/stripe'
import { signCheckoutToken, verifyCheckoutToken } from '@/lib/tokens'
import { t } from '@/lib/i18n'

/** Stripe's minimum charge in CAD is 50 cents. */
const MIN_AMOUNT_CENTS = 50
const UPDATABLE: Stripe.PaymentIntent.Status[] = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
]
const BLOCKING_CODES = new Set(['unknown_sku', 'inactive_sku', 'sold_out', 'stock_clamped'])

function shippingForStripe(
  c: CustomerDetails,
): Stripe.PaymentIntentCreateParams.Shipping | undefined {
  if (!c.address) return undefined
  return {
    name: c.address.name,
    phone: c.address.phone || undefined,
    address: {
      line1: c.address.line1,
      line2: c.address.line2 || undefined,
      city: c.address.city,
      state: c.address.province,
      postal_code: c.address.postalCode,
      country: 'CA',
    },
  }
}

/**
 * POST /api/checkout/session (PRD 9.2). Re-prices from canonical data, then either creates the pending order(s) and a
 * PaymentIntent (first call) or updates them (calls carrying `session`). The amount is always the server's quote.
 */
export async function handleCheckoutSession(input: CheckoutSessionInput): Promise<Response> {
  const stripe = getStripe()
  if (!stripe) return jsonError('checkout_unavailable', t('checkout.unavailable'), 503)

  // Signed-in customers check out as themselves: the account email wins and the order attaches to the account.
  const user = features.firebaseAdmin ? await getSessionUser() : null
  const email = (user?.email ?? input.email ?? '').trim().toLowerCase() || null
  const address = input.address ?? null
  const customer: CustomerDetails = {
    email,
    name: address?.name ?? null,
    phone: address?.phone ?? null,
    address,
  }

  const quote = await computeQuote({
    lines: input.lines,
    promoCode: input.promoCode,
    email,
    province: address?.province ?? null,
    shippingMethodId: input.shippingMethodId,
  })
  const blocking = quote.messages.filter((m) => m.sku && BLOCKING_CODES.has(m.code))
  if (!quote.lines.length || blocking.length)
    return jsonError('lines_unavailable', blocking[0]?.text ?? t('checkout.empty'), 409, { quote })
  if (quote.promoCode && !quote.promoCode.applied && quote.promoCode.requiresEmail && !email)
    return jsonError(
      'code_needs_email',
      t('checkout.codeNeedsEmail', { code: quote.promoCode.code }),
      409,
      { quote },
    )
  if (quote.totalCents < MIN_AMOUNT_CENTS)
    return jsonError('amount_too_small', t('checkout.error'), 400, { quote })

  const createAccount = Boolean(input.createAccount && !user && features.firebaseAdmin)
  const orderInput = { quote, customer, uid: user?.uid ?? null, createAccount }
  const shipping = shippingForStripe(customer)

  // ----- Later calls: update the order and the PaymentIntent -----
  if (input.session) {
    const { orderId, paymentIntentId, token } = input.session
    if (!verifyCheckoutToken(orderId, paymentIntentId, token))
      return jsonError('invalid_session', t('checkout.error'), 403)
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (pi.metadata.orderId !== orderId)
      return jsonError('invalid_session', t('checkout.error'), 403)
    if (!UPDATABLE.includes(pi.status))
      return jsonError('already_processed', t('checkout.alreadyPaid'), 409, {
        status: pi.status,
        orderNumber: pi.metadata.orderNumber,
      })
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: quote.totalCents,
      ...(email ? { receipt_email: email } : {}),
      ...(shipping ? { shipping } : {}),
    })
    await updatePendingOrder(orderId, orderInput)
    return noStore({
      ok: true,
      quote,
      session: input.session,
      orderNumber: pi.metadata.orderNumber,
      clientSecret: pi.client_secret,
    })
  }

  // ----- First call: create the order(s) and the PaymentIntent -----
  const order = await createPendingOrder(orderInput)
  const pi = await stripe.paymentIntents.create({
    amount: quote.totalCents,
    currency: 'cad',
    automatic_payment_methods: { enabled: true },
    description: `Glint & Thread order ${order.orderNumber}`,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    ...(email ? { receipt_email: email } : {}),
    ...(shipping ? { shipping } : {}),
  })
  await attachPaymentIntent(order.id, pi)
  return noStore({
    ok: true,
    quote,
    clientSecret: pi.client_secret,
    orderNumber: order.orderNumber,
    session: {
      orderId: order.id,
      paymentIntentId: pi.id,
      token: signCheckoutToken(order.id, pi.id),
    },
  })
}
