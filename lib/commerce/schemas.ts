import { z } from 'zod'

/** API input schemas (PRD 13: Zod on every input). Prices are never accepted from the client. */
export const cartLinesSchema = z
  .array(z.object({ sku: z.string().trim().min(1).max(64), qty: z.number().int().min(1).max(99) }))
  .max(50)

export const quoteRequestSchema = z.object({
  lines: cartLinesSchema,
  promoCode: z.string().trim().max(32).optional().nullable(),
  email: z.email().max(254).optional().nullable().or(z.literal('')),
})

export const checkoutRequestSchema = quoteRequestSchema.extend({
  lines: cartLinesSchema.min(1),
})

export type QuoteRequest = z.infer<typeof quoteRequestSchema>
