import { z } from 'zod'
import {
  PROVINCE_CODES,
  normalisePhone,
  normalisePostalCode,
  postalCodeMatchesProvince,
  provinceName,
} from '@/lib/geo'
import { t } from '@/lib/i18n'

/** Shared Zod schemas (client forms and server routes): the same rules run on both sides. */
const text = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max, t('forms.tooLong', { max }))

export const emailSchema = z.email(t('forms.invalidEmail')).max(254, t('forms.invalidEmail'))
export const passwordSchema = z
  .string()
  .min(10, t('validation.password'))
  .max(128, t('validation.password'))

const addressBase = z.object({
  label: z.string().trim().max(40).default(''),
  name: text(100, t('validation.name')),
  line1: text(120, t('validation.street')),
  line2: z.string().trim().max(120).default(''),
  city: text(80, t('validation.city')),
  province: z
    .string()
    .refine((c) => PROVINCE_CODES.includes(c.toUpperCase()), t('validation.province')),
  postalCode: z.string().trim(),
  phone: z.string().trim().default(''),
})

function refineAddress(
  a: z.infer<typeof addressBase>,
  ctx: z.RefinementCtx,
  phoneRequired: boolean,
) {
  const postal = normalisePostalCode(a.postalCode)
  if (!postal)
    ctx.addIssue({ code: 'custom', path: ['postalCode'], message: t('validation.postalCode') })
  else if (
    PROVINCE_CODES.includes(a.province.toUpperCase()) &&
    !postalCodeMatchesProvince(postal, a.province)
  )
    ctx.addIssue({
      code: 'custom',
      path: ['postalCode'],
      message: t('validation.postalProvince', { province: provinceName(a.province) }),
    })
  if ((phoneRequired || a.phone) && !normalisePhone(a.phone))
    ctx.addIssue({ code: 'custom', path: ['phone'], message: t('validation.phone') })
}

function normaliseAddress(a: z.infer<typeof addressBase>) {
  return {
    ...a,
    province: a.province.toUpperCase(),
    postalCode: normalisePostalCode(a.postalCode) ?? a.postalCode,
    phone: normalisePhone(a.phone) ?? '',
  }
}

/** A saved address: phone optional. Output is normalised (postal code "A1A 1A1", phone "(416) 555-0199"). */
export const addressInputSchema = addressBase
  .superRefine((a, ctx) => refineAddress(a, ctx, false))
  .transform(normaliseAddress)

/** The checkout shipping address: phone required for the carrier. */
export const checkoutAddressSchema = addressBase
  .superRefine((a, ctx) => refineAddress(a, ctx, true))
  .transform(normaliseAddress)

export const profileInputSchema = z.object({
  firstName: text(80, t('validation.firstName')),
  lastName: text(80, t('validation.lastName')),
  phone: z
    .string()
    .trim()
    .default('')
    .refine((p) => !p || normalisePhone(p), t('validation.phone'))
    .transform((p) => (p ? (normalisePhone(p) ?? '') : '')),
})

export const signUpSchema = profileInputSchema.omit({ phone: true }).extend({
  email: emailSchema,
  password: passwordSchema,
  marketingOptIn: z.boolean().default(false),
  company: z.string().max(0).optional().or(z.literal('')), // honeypot
})

export type AddressInputParsed = z.output<typeof addressInputSchema>
export type CheckoutAddress = z.output<typeof checkoutAddressSchema>
