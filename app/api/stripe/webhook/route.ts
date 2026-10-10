import type Stripe from 'stripe'
import { env } from '@/lib/env'
import { getStripe } from '@/lib/stripe'
import { markOrderExpired, markOrderPaid, markOrderRefunded, markPaymentFailed } from '@/lib/orders'

/**
 * Stripe webhook (PRD 9.3). Verifies the signature against the raw body; 400 only on a bad signature,
 * 200 for handled and unexpected events (logged), 500 if processing fails so Stripe retries.
 * Handlers are idempotent on event ID. Events: payment_intent.succeeded, payment_intent.payment_failed,
 * payment_intent.canceled, charge.refunded.
 */
export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET)
    return Response.json({ error: 'webhook_unavailable' }, { status: 503 })

  const signature = request.headers.get('stripe-signature')
  const body = await request.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? '', env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.warn('[webhook] bad signature', (err as Error).message)
    return Response.json({ error: 'bad_signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const result = await markOrderPaid(event.data.object, event.id)
        console.info(`[webhook] ${event.type} ${event.data.object.id}: ${result}`)
        break
      }
      case 'payment_intent.payment_failed': {
        const result = await markPaymentFailed(event.data.object, event.id)
        console.info(`[webhook] ${event.type} ${event.data.object.id}: ${result}`)
        break
      }
      case 'payment_intent.canceled': {
        const result = await markOrderExpired(event.data.object, event.id)
        console.info(`[webhook] ${event.type} ${event.data.object.id}: ${result}`)
        break
      }
      case 'charge.refunded': {
        const result = await markOrderRefunded(event.data.object, event.id)
        console.info(`[webhook] ${event.type} ${event.data.object.id}: ${result}`)
        break
      }
      default:
        console.info(`[webhook] ignored ${event.type}`)
    }
  } catch (err) {
    // A processing failure (for example Sanity unreachable) returns 500 so Stripe retries;
    // handlers are idempotent on event ID, so a retry can never double-decrement stock.
    console.error(`[webhook] failed to handle ${event.type} ${event.id}`, err)
    return Response.json({ error: 'processing_failed' }, { status: 500 })
  }
  return Response.json({ received: true })
}
