import { z } from 'zod'
import { jsonError, noStore } from '@/lib/api'
import { emailSchema } from '@/lib/account/schemas'
import { sendPasswordResetEmail } from '@/lib/auth/links'
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { t } from '@/lib/i18n'

const schema = z.object({
  email: emailSchema,
  company: z.string().max(0).optional().or(z.literal('')),
})

/** Sends a branded reset link. Same answer whether or not the address has an account. */
export async function POST(request: Request) {
  if (!firebaseConfigured()) return jsonError('accounts_unavailable', t('auth.unavailable'), 503)
  const rl = limiters.authEmail.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const body = await request.json().catch(() => null)
  if (body && typeof body.company === 'string' && body.company.length > 0)
    return noStore({ ok: true })
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return jsonError('invalid_email', t('forms.invalidEmail'), 400, {
      fields: { email: t('forms.invalidEmail') },
    })
  const email = parsed.data.email.toLowerCase()
  try {
    await adminAuth().getUserByEmail(email)
    await sendPasswordResetEmail(email)
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/user-not-found')
      console.error('[auth] reset failed', err)
  }
  return noStore({ ok: true })
}
