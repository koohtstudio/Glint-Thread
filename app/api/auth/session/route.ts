import { z } from 'zod'
import { jsonError, noStore } from '@/lib/api'
import { afterSignIn } from '@/lib/account/lifecycle'
import {
  clearSessionCookies,
  createSession,
  getSessionUser,
  setSessionCookies,
} from '@/lib/auth/session'
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { t } from '@/lib/i18n'

const schema = z.object({ idToken: z.string().min(20).max(5000) })

/** Exchanges the client SDK's ID token for a Firebase session cookie (PRD 9.9). */
export async function POST(request: Request) {
  if (!firebaseConfigured()) return jsonError('accounts_unavailable', t('auth.unavailable'), 503)
  const rl = limiters.auth.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError('invalid', t('forms.genericError'), 400)
  try {
    const { cookie, user } = await createSession(parsed.data.idToken)
    await setSessionCookies(cookie)
    const { linkedOrders } = await afterSignIn(user)
    return noStore({
      ok: true,
      user: { email: user.email, emailVerified: user.emailVerified },
      linkedOrders,
    })
  } catch (err) {
    console.warn('[auth] could not create session', (err as Error).message)
    return jsonError('invalid_token', t('auth.sessionFailed'), 401)
  }
}

/** Sign out: revoke refresh tokens and clear the cookies. */
export async function DELETE() {
  if (firebaseConfigured()) {
    const user = await getSessionUser()
    if (user)
      await adminAuth()
        .revokeRefreshTokens(user.uid)
        .catch(() => null)
  }
  await clearSessionCookies()
  return noStore({ ok: true })
}
