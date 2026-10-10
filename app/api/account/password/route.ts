import { z } from 'zod'
import { jsonError, noStore } from '@/lib/api'
import { apiUser } from '@/lib/account/api'
import { passwordSchema } from '@/lib/account/schemas'
import { isFreshLogin } from '@/lib/auth/session'
import { adminAuth } from '@/lib/firebase/admin'
import { t } from '@/lib/i18n'

const schema = z.object({ password: passwordSchema })

/** Set or change the password (also gives email-link accounts a password). Needs a recent sign-in. */
export async function POST(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  if (!isFreshLogin(guard.user))
    return jsonError('reauth_required', t('account.reauthRequired'), 403)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return jsonError('invalid', t('validation.password'), 400, {
      fields: { password: t('validation.password') },
    })
  await adminAuth().updateUser(guard.user.uid, { password: parsed.data.password })
  return noStore({ ok: true })
}
