import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import type { CustomerOrder } from './types'

/**
 * `customerOrders/{orderId}` (PRD 10.1): the customer side of every order, the only place names, emails,
 * phones and addresses are stored. Written only here, by the server (the rules forbid client writes).
 */
const col = () => adminDb().collection('customerOrders')

export async function createCustomerOrder(id: string, order: CustomerOrder): Promise<void> {
  await col().doc(id).set(order)
}

export async function updateCustomerOrder(
  id: string,
  patch: Partial<CustomerOrder>,
): Promise<void> {
  await col().doc(id).set(patch, { merge: true })
}

export async function getCustomerOrder(id: string): Promise<CustomerOrder | null> {
  const snap = await col().doc(id).get()
  return snap.exists ? (snap.data() as CustomerOrder) : null
}

/** The Firestore document ID for a Sanity order ID (`orders.<uuid>` -> `<uuid>`). */
export const customerOrderIdFor = (sanityOrderId: string) => sanityOrderId.replace(/^orders\./, '')

export async function findCustomerOrderBySanityId(
  sanityOrderId: string,
): Promise<(CustomerOrder & { id: string }) | null> {
  const direct = await col().doc(customerOrderIdFor(sanityOrderId)).get()
  if (direct.exists) return { ...(direct.data() as CustomerOrder), id: direct.id }
  const q = await col().where('sanityOrderId', '==', sanityOrderId).limit(1).get()
  const d = q.docs[0]
  return d ? { ...(d.data() as CustomerOrder), id: d.id } : null
}

export async function findCustomerOrderByPaymentIntent(
  paymentIntentId: string,
): Promise<(CustomerOrder & { id: string }) | null> {
  const q = await col().where('stripePaymentIntentId', '==', paymentIntentId).limit(1).get()
  const d = q.docs[0]
  return d ? { ...(d.data() as CustomerOrder), id: d.id } : null
}

/** A customer's orders, newest first. Pending checkouts that never paid are not shown. */
export async function listOrdersForUser(
  uid: string,
  limit = 50,
): Promise<(CustomerOrder & { id: string })[]> {
  const q = await col().where('uid', '==', uid).orderBy('createdAt', 'desc').limit(limit).get()
  return q.docs
    .map((d) => ({ ...(d.data() as CustomerOrder), id: d.id }))
    .filter((o) => o.status !== 'pending' && o.status !== 'expired')
}

export async function getOrderForUser(
  uid: string,
  orderNumber: string,
): Promise<(CustomerOrder & { id: string }) | null> {
  const q = await col()
    .where('uid', '==', uid)
    .where('orderNumber', '==', orderNumber)
    .limit(1)
    .get()
  const d = q.docs[0]
  return d ? { ...(d.data() as CustomerOrder), id: d.id } : null
}

/**
 * Links guest orders (uid null) with this email to the account. Call only for a verified email address
 * (PRD 9.9), otherwise anyone could claim someone else's orders by signing up with their address.
 */
export async function linkGuestOrders(uid: string, email: string): Promise<number> {
  const q = await col().where('email', '==', email.toLowerCase()).where('uid', '==', null).get()
  if (q.empty) return 0
  const batch = adminDb().batch()
  for (const d of q.docs) batch.update(d.ref, { uid })
  await batch.commit()
  return q.size
}

/**
 * Account deletion (PIPEDA, PRD 9.8): removes the personal fields but keeps what tax law requires
 * (order number, lines, totals, tax lines, dates). Returns the Sanity order IDs so their `emailHash` can be cleared.
 */
export async function anonymiseOrdersForUser(uid: string): Promise<string[]> {
  const q = await col().where('uid', '==', uid).get()
  if (q.empty) return []
  const now = new Date().toISOString()
  const sanityIds: string[] = []
  const batch = adminDb().batch()
  for (const d of q.docs) {
    const data = d.data() as CustomerOrder
    if (data.sanityOrderId) sanityIds.push(data.sanityOrderId)
    batch.update(d.ref, {
      uid: null,
      email: null,
      name: null,
      phone: null,
      shippingAddress: data.shippingAddress
        ? {
            name: '',
            line1: '',
            line2: '',
            city: '',
            province: data.shippingAddress.province,
            postalCode: '',
            phone: '',
          }
        : null,
      anonymisedAt: now,
    })
  }
  await batch.commit()
  return sanityIds
}
