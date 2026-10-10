import { jsonError, noStore, zodFields } from '@/lib/api'
import { signUpSchema } from '@/lib/account/schemas'
import { saveProfile } from '@/lib/account/store'
import { sendVerificationEmail } from '@/lib/auth/links'
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { CONSENT_TEXT_VERSION } from '@/lib/subscribers'
import { t } from '@/lib/i18n'

/**
 * Creates the account on the server (so we control the emails), the profile with its marketing consent record,
 * and sends our branded verification email. The client then signs in with the same credentials.
 */
export async function POST(request: Request) {
  if (!firebaseConfigured()) return jsonError('accounts_unavailable', t('auth.unavailable'), 503)
  const rl = limiters.auth.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const body = await request.json().catch(() => null)
  if (body && typeof body.company === 'string' && body.company.length > 0)
    return noStore({ ok: true }) // honeypot
  const parsed = signUpSchema.safeParse(body)
  if (!parsed.success)
    return jsonError('invalid', t('forms.genericError'), 400, { fields: zodFields(parsed.error) })
  const { email, password, firstName, lastName, marketingOptIn } = parsed.data
  const address = email.trim().toLowerCase()

  let uid: string
  try {
    const user = await adminAuth().createUser({
      email: address,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
      emailVerified: false,
    })
    uid = user.uid
  } catch (err) {
    if ((err as { code?: string }).code === 'auth/email-already-exists')
      return jsonError('email_exists', t('auth.emailExists'), 409, {
        fields: { email: t('auth.emailExists') },
      })
    console.error('[auth] signup failed', err)
    return jsonError('failed', t('forms.genericError'), 500)
  }
  const now = new Date().toISOString()
  await saveProfile(uid, {
    firstName,
    lastName,
    phone: '',
    email: address,
    marketingOptIn,
    ...(marketingOptIn
      ? {
          marketingConsentAt: now,
          marketingConsentVersion: CONSENT_TEXT_VERSION,
          marketingConsentSource: 'account-signup',
        }
      : {}),
    createdAt: now,
  })
  await sendVerificationEmail(address).catch((err) =>
    console.error('[auth] could not send verification email', err),
  )
  return noStore({ ok: true })
}
