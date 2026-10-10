import { z } from 'zod'
import { features } from '@/lib/env'
import { authoriseAdmin } from '@/lib/admin-auth'
import { customerForOrder, getOrderById } from '@/lib/orders'

const schema = z.object({ orderId: z.string().min(1).max(120) })

/**
 * Studio Customer panel (PRD 9.4, 9.8): loads name, email, phone and address live from Stripe for one
 * order. Authenticated with the Studio user's Sanity token. Nothing is cached or stored.
 */
export async function POST(request: Request) {
  if (!features.sanity) return Response.json({ error: 'unavailable' }, { status: 503 })
  const auth = await authoriseAdmin(request)
  if (!auth.ok) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 })
  if (!features.stripe) return Response.json({ error: 'stripe_not_configured' }, { status: 503 })
  const order = await getOrderById(parsed.data.orderId.replace(/^drafts\./, ''))
  if (!order) return Response.json({ error: 'not_found' }, { status: 404 })
  const customer = await customerForOrder(order)
  if (!customer) return Response.json({ error: 'no_stripe_session' }, { status: 404 })
  return Response.json({ customer }, { headers: { 'Cache-Control': 'no-store, private' } })
}
