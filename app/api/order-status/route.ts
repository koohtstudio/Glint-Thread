import { z } from 'zod'
import { features } from '@/lib/env'
import { lookupOrder } from '@/lib/orders'
import { isOrderNumber } from '@/lib/order-number'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { t } from '@/lib/i18n'

const schema = z.object({ orderNumber: z.string().trim().max(12), email: z.email().max(254) })

/** Order lookup by number + email (PRD 5.3, 13). Minimal data; rate limited against guessing. */
export async function POST(request: Request) {
  const rl = limiters.orderStatus.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !isOrderNumber(parsed.data.orderNumber))
    return Response.json(
      { error: 'not_found', message: t('orderStatus.notFound') },
      { status: 404 },
    )
  if (!features.sanityWrite)
    return Response.json(
      { error: 'unavailable', message: t('orderStatus.unavailable') },
      { status: 503 },
    )
  const order = await lookupOrder(parsed.data.orderNumber, parsed.data.email)
  if (!order)
    return Response.json(
      { error: 'not_found', message: t('orderStatus.notFound') },
      { status: 404 },
    )
  return Response.json({ order }, { headers: { 'Cache-Control': 'no-store' } })
}
