import { z } from 'zod'
import { features } from '@/lib/env'
import { authoriseAdmin } from '@/lib/admin-auth'
import { customerForOrder, getOrder } from '@/lib/orders'

const schema = z.object({ orderId: z.string().min(1).max(120) })

/**
 * Studio Customer panel (PRD 9.4, 9.8): name, email, phone and address for one order, read live from Firestore
 * `customerOrders` (by sanityOrderId), falling back to the Stripe PaymentIntent. Authenticated with the Studio
 * user's Sanity token. Nothing is cached or stored.
 */
export async function POST(request: Request) {
  if (!features.sanityWrite) return Response.json({ error: 'unavailable' }, { status: 503 })
  const auth = await authoriseAdmin(request)
  if (!auth.ok) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 })
  const order = await getOrder(parsed.data.orderId.replace(/^drafts\./, ''))
  if (!order) return Response.json({ error: 'not_found' }, { status: 404 })
  const customer = await customerForOrder(order)
  if (!customer) return Response.json({ error: 'no_customer_data' }, { status: 404 })
  const a = customer.address
  return Response.json(
    {
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: a
          ? {
              line1: a.line1,
              line2: a.line2,
              city: a.city,
              state: a.province,
              postal_code: a.postalCode,
              country: 'CA',
            }
          : null,
        stripeUrl: customer.stripeUrl,
        source: customer.source,
      },
    },
    { headers: { 'Cache-Control': 'no-store, private' } },
  )
}
