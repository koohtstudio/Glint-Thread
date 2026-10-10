import { z } from 'zod'
import { jsonError, noStore, zodFields } from '@/lib/api'
import { apiUser } from '@/lib/account/api'
import { addressInputSchema } from '@/lib/account/schemas'
import { listAddresses, saveAddress } from '@/lib/account/store'
import { t } from '@/lib/i18n'

export async function GET(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  return noStore({ addresses: await listAddresses(guard.user.uid) })
}

export async function POST(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  const body = await request.json().catch(() => null)
  const parsed = addressInputSchema.safeParse(body)
  if (!parsed.success)
    return jsonError('invalid', t('forms.genericError'), 400, { fields: zodFields(parsed.error) })
  const makeDefault =
    z.object({ isDefault: z.boolean().optional() }).safeParse(body).data?.isDefault === true
  const { label, name, line1, line2, city, province, postalCode, phone } = parsed.data
  const address = await saveAddress(
    guard.user.uid,
    null,
    { label, name, line1, line2, city, province, postalCode, phone },
    makeDefault,
  )
  return noStore({ ok: true, address, addresses: await listAddresses(guard.user.uid) }, 201)
}
