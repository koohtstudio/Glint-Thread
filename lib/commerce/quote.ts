import 'server-only'
import { getPromoCodes, getPromotions, getSiteSettings, getVariantsBySku } from '@/lib/data'
import { env } from '@/lib/env'
import { buildQuote } from '@/lib/pricing/engine'
import type { Quote } from '@/lib/pricing/types'
import { findCodeRedemptions } from '@/lib/orders'
import type { QuoteRequest } from './schemas'

/**
 * Re-prices a bag from canonical data (never client prices): promotions, codes, shipping, and tax for the
 * province (TAX_MODE=table). Shared by /api/quote and the checkout session endpoint.
 */
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
  const base = {
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
    province: input.province ?? null,
    taxMode: env.TAX_MODE,
    taxTable: settings.taxTable,
  }
  const quote = buildQuote({ ...base, shippingMethodId: input.shippingMethodId })
  // Checkout always needs a shipping method: fall back to standard, then to the first one offered.
  if (
    !quote.shipping &&
    quote.lines.length &&
    quote.shippingOptions.length &&
    input.shippingMethodId === undefined
  ) {
    const fallback =
      quote.shippingOptions.find((o) => o.id === 'standard') ?? quote.shippingOptions[0]
    return buildQuote({ ...base, shippingMethodId: fallback.id })
  }
  return quote
}
