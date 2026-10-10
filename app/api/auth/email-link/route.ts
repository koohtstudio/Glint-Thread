import { z } from 'zod'
import { jsonError, noStore } from '@/lib/api'
import { emailSchema } from '@/lib/account/schemas'
import { safeNext } from '@/lib/auth/session'
import { sendSignInLinkEmail } from '@/lib/auth/links'
import { firebaseConfigured } from '@/lib/firebase/admin'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { t } from '@/lib/i18n'

const schema = z.object({
  email: emailSchema,
  next: z.string().max(200).optional(),
  company: z.string().max(0).optional().or(z.literal('')),
})

/** Passwordless sign-in: emails a one-time link. Always answers the same, so it never reveals whether an account exists. */
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
  await sendSignInLinkEmail(
    parsed.data.email.toLowerCase(),
    parsed.data.next ? safeNext(parsed.data.next) : undefined,
  ).catch((err) => console.error('[auth] could not send sign-in link', err))
  return noStore({ ok: true })
}
