import { jsonError, noStore, zodFields } from '@/lib/api'
import { apiUser } from '@/lib/account/api'
import { profileInputSchema } from '@/lib/account/schemas'
import { getProfile, saveProfile } from '@/lib/account/store'
import { adminAuth } from '@/lib/firebase/admin'
import { t } from '@/lib/i18n'

export async function GET(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  return noStore({
    profile: await getProfile(guard.user.uid),
    user: { email: guard.user.email, emailVerified: guard.user.emailVerified },
  })
}

/** Update name and phone. The email address is the sign-in identity and is not editable here. */
export async function PATCH(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  const parsed = profileInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return jsonError('invalid', t('forms.genericError'), 400, { fields: zodFields(parsed.error) })
  await saveProfile(guard.user.uid, parsed.data)
  await adminAuth().updateUser(guard.user.uid, {
    displayName: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
  })
  return noStore({ ok: true, profile: await getProfile(guard.user.uid) })
}
