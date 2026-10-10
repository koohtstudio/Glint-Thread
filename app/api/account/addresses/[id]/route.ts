import { z } from 'zod'
import { jsonError, noStore, zodFields } from '@/lib/api'
import { apiUser } from '@/lib/account/api'
import { addressInputSchema } from '@/lib/account/schemas'
import { deleteAddress, listAddresses, saveAddress } from '@/lib/account/store'
import { t } from '@/lib/i18n'

const idSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[A-Za-z0-9_-]+$/)

export async function PUT(request: Request, ctx: RouteContext<'/api/account/addresses/[id]'>) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  const id = idSchema.safeParse((await ctx.params).id)
  if (!id.success) return jsonError('invalid', t('forms.genericError'), 400)
  const body = await request.json().catch(() => null)
  const parsed = addressInputSchema.safeParse(body)
  if (!parsed.success)
    return jsonError('invalid', t('forms.genericError'), 400, { fields: zodFields(parsed.error) })
  const makeDefault =
    z.object({ isDefault: z.boolean().optional() }).safeParse(body).data?.isDefault === true
  const { label, name, line1, line2, city, province, postalCode, phone } = parsed.data
  try {
    const address = await saveAddress(
      guard.user.uid,
      id.data,
      { label, name, line1, line2, city, province, postalCode, phone },
      makeDefault,
    )
    return noStore({ ok: true, address, addresses: await listAddresses(guard.user.uid) })
  } catch (err) {
    if ((err as Error).message === 'not_found')
      return jsonError('not_found', t('forms.genericError'), 404)
    throw err
  }
}

export async function DELETE(request: Request, ctx: RouteContext<'/api/account/addresses/[id]'>) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  const id = idSchema.safeParse((await ctx.params).id)
  if (!id.success) return jsonError('invalid', t('forms.genericError'), 400)
  try {
    await deleteAddress(guard.user.uid, id.data)
    return noStore({ ok: true, addresses: await listAddresses(guard.user.uid) })
  } catch (err) {
    if ((err as Error).message === 'not_found')
      return jsonError('not_found', t('forms.genericError'), 404)
    throw err
  }
}
