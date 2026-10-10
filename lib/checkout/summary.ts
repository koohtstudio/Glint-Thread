import 'server-only'
import { customerOrderIdFor, getCustomerOrder } from '@/lib/account/customer-orders'
import { features } from '@/lib/env'
import { getOrder } from '@/lib/orders'
import type { TaxLine } from '@/lib/pricing/types'
import { getStripe } from '@/lib/stripe'

export interface ConfirmationView {
  orderNumber: string
  email: string | null
  /** succeeded: paid; processing: bank debits and the like; failed: back to checkout. */
  state: 'succeeded' | 'processing' | 'failed'
  items: { title: string; qty: number; totalCents: number }[]
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  taxLines: TaxLine[]
  totalCents: number
}

const itemTitle = (title: string, variantTitle: string) =>
  variantTitle && variantTitle !== 'Default' ? `${title}, ${variantTitle}` : title

/**
 * The confirmation page's data (PRD 6.4.6). The PaymentIntent is retrieved server-side with the secret key, and the
 * browser must present the matching client secret, so an order number alone never reveals an order. Safe to refresh.
 */
export async function loadConfirmation(
  paymentIntentId: string,
  clientSecret: string,
): Promise<ConfirmationView | null> {
  const stripe = getStripe()
  if (!stripe || !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return null
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (!clientSecret || pi.client_secret !== clientSecret) return null
    const orderId = pi.metadata?.orderId
    const [order, fs] = await Promise.all([
      orderId && features.sanityWrite ? getOrder(orderId).catch(() => null) : null,
      orderId && features.firebaseAdmin
        ? getCustomerOrder(customerOrderIdFor(orderId)).catch(() => null)
        : null,
    ])
    const state =
      pi.status === 'succeeded' ? 'succeeded' : pi.status === 'processing' ? 'processing' : 'failed'
    const base = {
      orderNumber:
        order?.orderNumber ?? fs?.orderNumber ?? pi.metadata?.orderNumber ?? pi.id.slice(-8),
      email: fs?.email ?? pi.receipt_email ?? null,
      state,
    } as const
    if (fs)
      return {
        ...base,
        items: fs.lines.map((l) => ({
          title: itemTitle(l.title, l.variantTitle),
          qty: l.qty,
          totalCents: l.lineTotalCents,
        })),
        subtotalCents: fs.totals.subtotalCents,
        discountCents: fs.totals.discountCents,
        shippingCents: fs.totals.shippingCents,
        taxCents: fs.totals.taxCents,
        taxLines: fs.totals.taxLines,
        totalCents: fs.totals.totalCents,
      }
    if (order)
      return {
        ...base,
        items: order.lines.map((l) => ({
          title: itemTitle(l.title, l.variantTitle),
          qty: l.qty,
          totalCents: l.lineSubtotalCents - l.discountCents,
        })),
        subtotalCents: order.amounts.subtotalCents,
        discountCents: order.amounts.discountCents,
        shippingCents: order.amounts.shippingCents,
        taxCents: order.amounts.taxCents,
        taxLines: order.taxLines,
        totalCents: order.amounts.totalCents,
      }
    return {
      ...base,
      items: [],
      subtotalCents: pi.amount,
      discountCents: 0,
      shippingCents: 0,
      taxCents: 0,
      taxLines: [],
      totalCents: pi.amount,
    }
  } catch (err) {
    console.error('[success] could not load the confirmation', err)
    return null
  }
}
