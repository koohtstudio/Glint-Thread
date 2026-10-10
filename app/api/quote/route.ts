import { computeQuote } from '@/lib/commerce/quote'
import { quoteRequestSchema } from '@/lib/commerce/schemas'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'

/** POST cart -> priced quote (PRD 9.1). Drives the bag drawer, bag page and free-shipping progress. */
export async function POST(request: Request) {
  const rl = limiters.quote.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const body = await request.json().catch(() => null)
  const parsed = quoteRequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'invalid_request' }, { status: 400 })
  const quote = await computeQuote(parsed.data)
  return Response.json(quote, { headers: { 'Cache-Control': 'no-store' } })
}
