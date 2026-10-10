import { z } from 'zod'
import { jsonError, noStore } from '@/lib/api'
import { apiUser } from '@/lib/account/api'
import { getCart, putCart } from '@/lib/account/store'
import { t } from '@/lib/i18n'

const imageSchema = z
  .object({
    src: z.string().max(500),
    alt: z.string().max(300),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    blurDataURL: z.string().max(2000).optional(),
  })
  .nullable()

const cartSchema = z.object({
  lines: z
    .array(
      z.object({
        sku: z.string().trim().min(1).max(64),
        qty: z.number().int().min(1).max(10),
        addedAt: z.number().int().nonnegative(),
        productSlug: z.string().max(120),
        title: z.string().max(200),
        variantTitle: z.string().max(200),
        unitPriceCents: z.number().int().nonnegative(),
        image: imageSchema,
      }),
    )
    .max(50),
  promoCode: z.string().trim().max(32).nullable().default(null),
})

/** The signed-in customer's bag (PRD 9.9): Firestore `users/{uid}/cart/current`, merged with the local bag on sign-in. */
export async function GET(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  const cart = await getCart(guard.user.uid)
  return noStore({ cart: cart ?? { lines: [], promoCode: null, updatedAt: null } })
}

export async function PUT(request: Request) {
  const guard = await apiUser(request)
  if ('response' in guard) return guard.response
  const parsed = cartSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError('invalid', t('forms.genericError'), 400)
  await putCart(guard.user.uid, parsed.data)
  return noStore({ ok: true })
}
