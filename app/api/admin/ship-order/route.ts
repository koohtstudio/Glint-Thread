import { z } from 'zod'
import { features } from '@/lib/env'
import { authoriseAdmin } from '@/lib/admin-auth'
import { CARRIERS, shipOrder } from '@/lib/orders'

const schema = z.object({
  orderId: z.string().min(1).max(120),
  carrier: z
    .string()
    .refine((c) => c in CARRIERS, 'unknown carrier')
    .default('Canada Post'),
  trackingNumber: z.string().trim().min(4).max(64),
})

/** Called by the Studio "Mark as shipped" action (PRD 9.4). See lib/admin-auth.ts for authorisation. */
export async function POST(request: Request) {
  if (!features.sanityWrite) return Response.json({ error: 'unavailable' }, { status: 503 })
  const auth = await authoriseAdmin(request)
  if (!auth.ok) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return Response.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 })
  const result = await shipOrder(
    parsed.data.orderId,
    parsed.data.carrier,
    parsed.data.trackingNumber,
  )
  console.info(
    `[admin] ship-order ${parsed.data.orderId} by ${auth.by}: ${result.ok ? 'ok' : result.error}`,
  )
  return Response.json(result, { status: result.ok ? 200 : 409 })
}
