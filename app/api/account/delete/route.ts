import { z } from 'zod'
import { jsonError, noStore } from '@/lib/api'
import { apiUser } from '@/lib/account/api'
import { anonymiseOrdersForUser } from '@/lib/account/customer-orders'
import { deleteUserData } from '@/lib/account/store'
import { clearSessionCookies, isFreshLogin } from '@/lib/auth/session'
import { sendAccountDeletedEmail } from '@/lib/auth/links'
import { adminAuth } from '@/lib/firebase/admin'
import { clearOrderEmailHashes } from '@/lib/orders'
import { deleteContact } from '@/lib/subscribers'
import { t } from '@/lib/i18n'

const schema = z.object({ confirm: z.literal('DELETE') })

/**
 * Delete my account (PIPEDA, PRD 9.8). Removes the auth user, profile, addresses and cart and the Resend contact,
 * anonymises the customer's orders (keeping what tax law requires) and clears emailHash on the matching Sanity orders.
 */
export async function POST(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  if (!isFreshLogin(guard.user))
    return jsonError('reauth_required', t('account.reauthRequired'), 403)
  if (!schema.safeParse(await request.json().catch(() => null)).success)
    return jsonError('invalid', t('account.deleteConfirmError'), 400)
  const { uid, email } = guard.user

  const sanityIds = await anonymiseOrdersForUser(uid)
  await clearOrderEmailHashes(sanityIds).catch((err) =>
    console.error('[account] could not clear emailHash on orders', err),
  )
  await deleteUserData(uid)
  if (email) await deleteContact(email.toLowerCase())
  await adminAuth().deleteUser(uid)
  await clearSessionCookies()
  if (email) await sendAccountDeletedEmail(email).catch(() => null)
  return noStore({ ok: true })
}
