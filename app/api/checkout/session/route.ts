import { jsonError, zodFields } from '@/lib/api'
import { checkoutSessionSchema } from '@/lib/commerce/schemas'
import { handleCheckoutSession } from '@/lib/checkout/session'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { t } from '@/lib/i18n'

/** Creates or updates the PaymentIntent for the one-page checkout (PRD 9.2). No Stripe keys: 503. */
export async function POST(request: Request) {
  const rl = limiters.checkout.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const parsed = checkoutSessionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return jsonError('invalid_request', t('checkout.empty'), 400, {
      fields: zodFields(parsed.error),
    })
  return handleCheckoutSession(parsed.data)
}
