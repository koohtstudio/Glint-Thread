import 'server-only'
import { getPromoCodes, getPromotions, getSiteSettings, getVariantsBySku } from '@/lib/data'
import { buildQuote } from '@/lib/pricing/engine'
import type { Quote } from '@/lib/pricing/types'
import { findCodeRedemptions } from '@/lib/orders'
import type { QuoteRequest } from './schemas'

/** Re-prices a bag from canonical data (never client prices). Shared by /api/quote and /api/checkout. */
export async function computeQuote(input: QuoteRequest): Promise<Quote> {
  const skus = [...new Set(input.lines.map((l) => l.sku))]
  const email = input.email ? input.email.trim().toLowerCase() : null
  const [variants, promotions, promoCodes, settings, redemptions] = await Promise.all([
    getVariantsBySku(skus),
    getPromotions(),
    getPromoCodes(),
    getSiteSettings(),
    email && input.promoCode ? findCodeRedemptions(email) : Promise.resolve([]),
  ])
  return buildQuote({
    lines: input.lines,
    promoCode: input.promoCode,
    email,
    variants,
    promotions,
    promoCodes,
    shipping: {
      freeShippingThresholdCents: settings.freeShippingThresholdCents,
      methods: settings.shippingMethods,
    },
    redemptions,
  })
}
