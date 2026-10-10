import { z } from 'zod'
import { checkoutAddressSchema } from '@/lib/account/schemas'
import { PROVINCE_CODES } from '@/lib/geo'

/** API input schemas (PRD 13: Zod on every input). Prices and totals are never accepted from the client. */
export const cartLinesSchema = z
  .array(z.object({ sku: z.string().trim().min(1).max(64), qty: z.number().int().min(1).max(99) }))
  .max(50)

const province = z
  .string()
  .trim()
  .toUpperCase()
  .refine((p) => PROVINCE_CODES.includes(p))
  .optional()
  .nullable()

export const quoteRequestSchema = z.object({
  lines: cartLinesSchema,
  promoCode: z.string().trim().max(32).optional().nullable(),
  email: z.email().max(254).optional().nullable().or(z.literal('')),
  province,
  shippingMethodId: z.string().trim().max(40).optional().nullable(),
})

export type QuoteRequest = z.infer<typeof quoteRequestSchema>

/** `POST /api/checkout/session` (PRD 9.2): first call creates the order and PaymentIntent, later calls update them. */
export const checkoutSessionSchema = z.object({
  lines: cartLinesSchema.min(1),
  promoCode: z.string().trim().max(32).optional().nullable(),
  email: z.email().max(254).optional().nullable().or(z.literal('')),
  createAccount: z.boolean().optional().default(false),
  address: checkoutAddressSchema.optional().nullable(),
  shippingMethodId: z.string().trim().max(40).optional().nullable(),
  /** Present on updates: proves the caller created the checkout. */
  session: z
    .object({
      orderId: z.string().min(1).max(80),
      paymentIntentId: z.string().regex(/^pi_[A-Za-z0-9]+$/),
      token: z.string().min(10).max(80),
    })
    .optional()
    .nullable(),
})

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>
