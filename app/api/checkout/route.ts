import type Stripe from 'stripe'
import { env } from '@/lib/env'
import { computeQuote } from '@/lib/commerce/quote'
import { checkoutRequestSchema } from '@/lib/commerce/schemas'
import { attachCheckoutSession, createPendingOrder } from '@/lib/orders'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { getStripe, parseEta } from '@/lib/stripe'
import { absoluteUrl, publicEnv } from '@/lib/public-env'
import { t } from '@/lib/i18n'

/** Stripe Tax codes: general tangible goods and shipping. */
const TAX_CODE_GOODS = 'txcd_99999999'
const TAX_CODE_SHIPPING = 'txcd_92010001'

/**
 * POST cart -> Stripe Checkout Session URL (PRD 9.2). Never accepts prices from the client:
 * re-prices, creates a pending order, then a session with a one-off coupon for all discounts.
 */
export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe)
    return Response.json(
      { error: 'checkout_unavailable', message: t('checkout.unavailable') },
      { status: 503 },
    )

  const rl = limiters.checkout.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return Response.json(
      { error: 'invalid_request', message: t('checkout.empty') },
      { status: 400 },
    )

  const quote = await computeQuote(parsed.data)
  const blocking = quote.messages.filter(
    (m) =>
      m.sku &&
      (m.code === 'unknown_sku' ||
        m.code === 'inactive_sku' ||
        m.code === 'sold_out' ||
        m.code === 'stock_clamped'),
  )
  if (!quote.lines.length || blocking.length) {
    return Response.json(
      { error: 'lines_unavailable', message: blocking[0]?.text ?? t('checkout.empty'), quote },
      { status: 409 },
    )
  }
  if (quote.promoCode && !quote.promoCode.applied && quote.promoCode.requiresEmail) {
    return Response.json(
      {
        error: 'code_needs_email',
        message: t('checkout.codeNeedsEmail', { code: quote.promoCode.code }),
      },
      { status: 409 },
    )
  }

  const order = await createPendingOrder(quote, parsed.data.email)
  const discountCents = quote.automaticDiscountCents + quote.codeDiscountCents
  const taxed = env.TAX_MODE === 'stripe'
  const publicImages = publicEnv.siteUrl.startsWith('https://')

  let couponId: string | null = null
  if (discountCents > 0) {
    // One-off coupon: Checkout can't combine `discounts` with allow_promotion_codes, so codes are ours (PRD 9.2).
    const coupon = await stripe.coupons.create({
      amount_off: discountCents,
      currency: 'cad',
      duration: 'once',
      max_redemptions: 1,
      name: 'Bundle & promo savings',
      metadata: { orderNumber: order.orderNumber },
    })
    couponId = coupon.id
  }

  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
    quote.shippingOptions.map((o) => {
      const eta = parseEta(o.eta)
      return {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: o.isFree && o.id === 'standard' ? `${o.label}, free` : o.label,
          fixed_amount: { amount: o.amountCents, currency: 'cad' },
          ...(eta
            ? {
                delivery_estimate: {
                  minimum: { unit: 'business_day', value: eta.min },
                  maximum: { unit: 'business_day', value: eta.max },
                },
              }
            : {}),
          ...(taxed ? { tax_behavior: 'exclusive', tax_code: TAX_CODE_SHIPPING } : {}),
          metadata: { methodId: o.id },
        },
      }
    })

  const email = parsed.data.email?.trim() || undefined
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'cad',
    locale: 'en',
    line_items: quote.lines.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency: 'cad',
        unit_amount: l.unitPriceCents,
        ...(taxed ? { tax_behavior: 'exclusive' as const } : {}),
        product_data: {
          name: l.variantTitle === 'Default' ? l.title : `${l.title} · ${l.variantTitle}`,
          ...(publicImages && l.image ? { images: [absoluteUrl(l.image.src)] } : {}),
          metadata: { sku: l.sku },
          ...(taxed ? { tax_code: TAX_CODE_GOODS } : {}),
        },
      },
    })),
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    shipping_address_collection: { allowed_countries: ['CA'] },
    phone_number_collection: { enabled: true },
    shipping_options: shippingOptions,
    automatic_tax: { enabled: taxed },
    ...(email ? { customer_email: email } : {}),
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      promoCode: quote.promoCode?.applied ? quote.promoCode.code : '',
    },
    payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.orderNumber } },
    client_reference_id: order.id,
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${publicEnv.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicEnv.siteUrl}/bag?checkout=cancelled`,
  })

  await attachCheckoutSession(order.id, session.id, couponId)
  return Response.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
}
