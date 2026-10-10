import 'server-only'
import { jsonError } from '@/lib/api'
import { getSessionUser, type SessionUser } from '@/lib/auth/session'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { firebaseConfigured } from '@/lib/firebase/admin'
import { t } from '@/lib/i18n'

/** Common guard for /api/account/*: accounts configured, rate limit, signed-in customer. */
export async function apiUser(
  request: Request,
): Promise<{ user: SessionUser } | { response: Response }> {
  if (!firebaseConfigured())
    return { response: jsonError('accounts_unavailable', t('auth.unavailable'), 503) }
  const rl = limiters.account.check(clientIp(request.headers))
  if (!rl.ok) return { response: tooManyRequests(rl.retryAfterSeconds) }
  const user = await getSessionUser()
  if (!user) return { response: jsonError('unauthorized', t('auth.signInRequired'), 401) }
  return { user }
}
