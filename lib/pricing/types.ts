/**
 * Pricing engine types (PRD 9.1). All amounts are integer cents.
 * These are framework-free so the engine can run in route handlers, scripts and tests.
 */

export interface PricingImage {
  src: string
  alt: string
  width: number
  height: number
}

/** Canonical data for one purchasable variant, keyed by SKU. */
export interface PricingVariant {
  sku: string
  productSlug: string
  productTitle: string
  variantTitle: string
  priceCents: number
  /** null means untracked (development only). */
  stock: number | null
  categorySlug: string
  departmentSlug: string
  excludedFromPromotions: boolean
  active: boolean
  image: PricingImage | null
}

interface PromotionBase {
  id: string
  title: string
  active: boolean
  badge: string
  appliesTo: { categories: string[]; excludeSlugs?: string[] }
  startsAt?: string | null
  endsAt?: string | null
}

export interface TieredPercentPromotion extends PromotionBase {
  type: 'tiered_percent_category'
  tiers: { minQty: number; percentOff: number }[]
}

export interface BuyXGetYPromotion extends PromotionBase {
  type: 'buy_x_get_y_cheapest_free'
  buyQty: number
  getQty: number
}

export type Promotion = TieredPercentPromotion | BuyXGetYPromotion

export interface PromoCode {
  code: string
  type: 'percent_off_order'
  percentOff: number
  firstOrderOnly: boolean
  active: boolean
  expiresAt?: string | null
}

export interface ShippingMethod {
  id: string
  label: string
  priceCents: number
  freeOverThreshold: boolean
  eta: string
  enabled?: boolean
}

export interface ShippingSettings {
  freeShippingThresholdCents: number
  methods: ShippingMethod[]
}

import type { TaxLine, TaxTable } from './tax'
export type { TaxCode, TaxComponent, TaxLine, TaxTable } from './tax'

export interface QuoteLineInput {
  sku: string
  qty: number
}

export interface QuoteInput {
  lines: QuoteLineInput[]
  promoCode?: string | null
  email?: string | null
  /** Canonical variants keyed by SKU. Lines with SKUs missing here are dropped. */
  variants: Record<string, PricingVariant>
  promotions: Promotion[]
  promoCodes: PromoCode[]
  shipping: ShippingSettings
  /** Paid redemptions, used for first-order-only codes. Compared case-insensitively. */
  redemptions?: { code: string; email: string }[]
  /** Evaluation time for promotion and code windows. Defaults to now. */
  now?: Date
  /** Maximum quantity per line (PRD 9.1 rule 1). */
  maxQtyPerLine?: number
  /** Two-letter province code from the shipping address; drives tax (rule 8). */
  province?: string | null
  /** The selected shipping method; null or unknown means none chosen yet. */
  shippingMethodId?: string | null
  /** `none` (small supplier) charges no tax; `table` uses `taxTable`. Defaults to `none`. */
  taxMode?: 'none' | 'table'
  taxTable?: TaxTable
}

export type QuoteMessageCode =
  | 'unknown_sku'
  | 'inactive_sku'
  | 'sold_out'
  | 'stock_clamped'
  | 'qty_clamped'
  | 'code_invalid'
  | 'code_inactive'
  | 'code_expired'
  | 'code_used'
  | 'code_needs_email'
  | 'code_no_eligible'
  | 'code_applied'

export interface QuoteMessage {
  type: 'info' | 'warning' | 'error'
  code: QuoteMessageCode
  /** Plain-English text, safe to show as is. */
  text: string
  sku?: string
}

export interface QuoteLine {
  sku: string
  productSlug: string
  title: string
  variantTitle: string
  qty: number
  unitPriceCents: number
  lineSubtotalCents: number
  /** Automatic promotion discount on this line. */
  discountCents: number
  promotionIds: string[]
  available: number | null
  image: PricingImage | null
}

export interface ShippingOption {
  id: string
  label: string
  amountCents: number
  eta: string
  isFree: boolean
}

export interface Quote {
  lines: QuoteLine[]
  itemCount: number
  merchandiseSubtotalCents: number
  automaticDiscountCents: number
  codeDiscountCents: number
  discountedSubtotalCents: number
  /** Savings per promotion, for display ("Mix & match -$4.19"). */
  promotions: { id: string; title: string; discountCents: number }[]
  promoCode: { code: string; applied: boolean; percentOff: number; requiresEmail: boolean } | null
  shippingOptions: ShippingOption[]
  /** The selected shipping method, or null until one is chosen. */
  shipping: ShippingOption | null
  taxMode: 'none' | 'table'
  taxLines: TaxLine[]
  taxCents: number
  /** Discounted subtotal + shipping + tax. */
  totalCents: number
  freeShipping: { thresholdCents: number; remainingCents: number; unlocked: boolean }
  messages: QuoteMessage[]
}
