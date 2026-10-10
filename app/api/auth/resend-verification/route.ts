import { jsonError, noStore } from '@/lib/api'
import { getSessionUser } from '@/lib/auth/session'
import { sendVerificationEmail } from '@/lib/auth/links'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { t } from '@/lib/i18n'

/** Re-sends the verification email to the signed-in customer. */
export async function POST(request: Request) {
  const rl = limiters.authEmail.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const user = await getSessionUser()
  if (!user?.email) return jsonError('unauthorized', t('auth.signInRequired'), 401)
  if (user.emailVerified) return noStore({ ok: true, alreadyVerified: true })
  await sendVerificationEmail(user.email)
  return noStore({ ok: true })
}
