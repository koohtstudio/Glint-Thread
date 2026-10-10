import { z } from 'zod'
import { jsonError, noStore } from '@/lib/api'
import { apiUser } from '@/lib/account/api'
import { getProfile, saveProfile } from '@/lib/account/store'
import { CONSENT_TEXT_VERSION, confirmSubscriber, unsubscribe } from '@/lib/subscribers'
import { t } from '@/lib/i18n'

const schema = z.object({ marketingOptIn: z.boolean() })

/**
 * Marketing preferences (CASL), synced to the Resend Newsletter topic. Opting in is express consent (the box is
 * unchecked by default) and is recorded with its wording version, time and source. An unverified email waits for
 * verification before anything is sent (it is then synced at sign-in), so it behaves as double opt-in.
 */
export async function POST(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || !guard.user.email)
    return jsonError('invalid', t('forms.genericError'), 400)
  const { uid, email, emailVerified } = guard.user
  const now = new Date().toISOString()

  if (!parsed.data.marketingOptIn) {
    await unsubscribe(email.toLowerCase())
    await saveProfile(uid, { marketingOptIn: false })
    return noStore({ ok: true, marketingOptIn: false, pending: false })
  }

  const profile = await getProfile(uid)
  const consent = {
    consentTextVersion: CONSENT_TEXT_VERSION,
    consentAt: now,
    signupSource: 'account-preferences',
  }
  await saveProfile(uid, {
    marketingOptIn: true,
    marketingConsentAt: now,
    marketingConsentVersion: consent.consentTextVersion,
    marketingConsentSource: consent.signupSource,
    ...(profile?.marketingSyncedAt ? {} : {}),
  })
  if (!emailVerified) return noStore({ ok: true, marketingOptIn: true, pending: true })
  await confirmSubscriber(email.toLowerCase(), consent)
  await saveProfile(uid, { marketingSyncedAt: now })
  return noStore({ ok: true, marketingOptIn: true, pending: false })
}
