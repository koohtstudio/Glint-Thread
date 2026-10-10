/**
 * Pricing engine (PRD 9.1). Pure TypeScript: no I/O, no framework, integer cents only.
 * Used by /api/quote (bag), /api/checkout (Stripe session) and the webhook re-check.
 */
import type {
  BuyXGetYPromotion,
  PricingVariant,
  PromoCode,
  Promotion,
  Quote,
  QuoteInput,
  QuoteLine,
  QuoteMessage,
  ShippingOption,
  TieredPercentPromotion,
} from './types'

export const MAX_QTY_PER_LINE = 10

/** PRD 9.1 rule 2: percentages are rounded once, on the base amount. */
export function percentOf(baseCents: number, pct: number): number {
  return Math.round((baseCents * pct) / 100)
}

/** Splits `totalCents` across weights proportionally; the last weighted entry absorbs rounding (rule 3). */
export function allocate(totalCents: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const out = weights.map(() => 0)
  if (sum <= 0 || totalCents === 0) return out
  let lastIndex = -1
  weights.forEach((w, i) => {
    if (w > 0) lastIndex = i
  })
  let assigned = 0
  weights.forEach((w, i) => {
    if (w <= 0 || i === lastIndex) return
    out[i] = Math.round((totalCents * w) / sum)
    assigned += out[i]
  })
  out[lastIndex] = totalCents - assigned
  return out
}

export function normaliseCode(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase()
}

function isWithinWindow(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now: Date,
): boolean {
  if (startsAt && new Date(startsAt).getTime() > now.getTime()) return false
  if (endsAt && new Date(endsAt).getTime() <= now.getTime()) return false
  return true
}

interface WorkingLine extends QuoteLine {
  /** Units of this line already consumed by an automatic promotion (rule 5). */
  promotedUnits: number
  variant: PricingVariant
}

function isEligible(line: WorkingLine, promo: Promotion): boolean {
  if (line.variant.excludedFromPromotions) return false
  if (!promo.appliesTo.categories.includes(line.variant.categorySlug)) return false
  if ((promo.appliesTo.excludeSlugs ?? []).includes(line.productSlug)) return false
  return line.qty - line.promotedUnits > 0
}

function applyTiered(promo: TieredPercentPromotion, lines: WorkingLine[]): number {
  const eligible = lines.filter((l) => isEligible(l, promo))
  const units = eligible.map((l) => l.qty - l.promotedUnits)
  const qty = units.reduce((a, b) => a + b, 0)
  const tier = [...promo.tiers].sort((a, b) => b.minQty - a.minQty).find((t) => qty >= t.minQty)
  if (!tier) return 0
  const bases = eligible.map((l, i) => l.unitPriceCents * units[i])
  const base = bases.reduce((a, b) => a + b, 0)
  const discount = percentOf(base, tier.percentOff)
  const shares = allocate(discount, bases)
  eligible.forEach((l, i) => {
    l.discountCents += shares[i]
    l.promotedUnits += units[i]
    l.promotionIds.push(promo.id)
  })
  return discount
}

function applyBuyXGetY(promo: BuyXGetYPromotion, lines: WorkingLine[]): number {
  const eligible = lines.filter((l) => isEligible(l, promo))
  // Expand to units, cheapest first; ties keep bag order so results are deterministic.
  const units = eligible
    .flatMap((l, lineIdx) =>
      Array.from({ length: l.qty - l.promotedUnits }, () => ({ lineIdx, price: l.unitPriceCents })),
    )
    .map((u, order) => ({ ...u, order }))
    .sort((a, b) => a.price - b.price || a.order - b.order)
  const groupSize = promo.buyQty + promo.getQty
  const groups = Math.floor(units.length / groupSize)
  const freeCount = groups * promo.getQty
  if (freeCount === 0) return 0
  const free = units.slice(0, freeCount)
  // The units that "paid" for the free ones are the most expensive; they also count as promoted.
  const paying = units.slice(units.length - groups * promo.buyQty)
  let discount = 0
  for (const u of free) {
    eligible[u.lineIdx].discountCents += u.price
    eligible[u.lineIdx].promotedUnits += 1
    discount += u.price
  }
  for (const u of paying) eligible[u.lineIdx].promotedUnits += 1
  for (const idx of new Set([...free, ...paying].map((u) => u.lineIdx)))
    eligible[idx].promotionIds.push(promo.id)
  return discount
}

export function buildQuote(input: QuoteInput): Quote {
  const now = input.now ?? new Date()
  const maxQty = input.maxQtyPerLine ?? MAX_QTY_PER_LINE
  const messages: QuoteMessage[] = []

  // Rule 1: merge duplicates, drop unknown or inactive SKUs, clamp quantities to 1..max and to stock.
  const merged = new Map<string, number>()
  for (const line of input.lines) {
    const qty = Number.isFinite(line.qty) ? Math.floor(line.qty) : 0
    merged.set(line.sku, (merged.get(line.sku) ?? 0) + qty)
  }

  const lines: WorkingLine[] = []
  for (const [sku, requested] of merged) {
    const variant = input.variants[sku]
    if (!variant) {
      messages.push({
        type: 'warning',
        code: 'unknown_sku',
        text: 'One item is no longer available and was removed.',
        sku,
      })
      continue
    }
    const name =
      variant.variantTitle === 'Default'
        ? variant.productTitle
        : `${variant.productTitle} (${variant.variantTitle})`
    if (!variant.active) {
      messages.push({
        type: 'warning',
        code: 'inactive_sku',
        text: `${name} is no longer available and was removed.`,
        sku,
      })
      continue
    }
    if (variant.stock !== null && variant.stock <= 0) {
      messages.push({
        type: 'error',
        code: 'sold_out',
        text: `${name} just sold out and was removed.`,
        sku,
      })
      continue
    }
    let qty = Math.max(1, requested)
    if (qty > maxQty) {
      qty = maxQty
      messages.push({
        type: 'info',
        code: 'qty_clamped',
        text: `The limit is ${maxQty} per item.`,
        sku,
      })
    }
    if (variant.stock !== null && qty > variant.stock) {
      qty = variant.stock
      messages.push({
        type: 'warning',
        code: 'stock_clamped',
        text: `Only ${variant.stock} of ${name} left, so we adjusted the quantity.`,
        sku,
      })
    }
    lines.push({
      sku,
      productSlug: variant.productSlug,
      title: variant.productTitle,
      variantTitle: variant.variantTitle,
      qty,
      unitPriceCents: variant.priceCents,
      lineSubtotalCents: variant.priceCents * qty,
      discountCents: 0,
      promotionIds: [],
      available: variant.stock,
      image: variant.image,
      promotedUnits: 0,
      variant,
    })
  }

  const merchandiseSubtotalCents = lines.reduce((sum, l) => sum + l.lineSubtotalCents, 0)

  // Rules 3 to 5: automatic promotions, each unit at most once, excluded products never.
  const promotions: Quote['promotions'] = []
  for (const promo of input.promotions) {
    if (!promo.active || !isWithinWindow(promo.startsAt, promo.endsAt, now)) continue
    const discount =
      promo.type === 'tiered_percent_category'
        ? applyTiered(promo, lines)
        : applyBuyXGetY(promo, lines)
    if (discount > 0) promotions.push({ id: promo.id, title: promo.title, discountCents: discount })
  }
  const automaticDiscountCents = promotions.reduce((sum, p) => sum + p.discountCents, 0)

  // Rule 6: promo code on (merchandise - automatic) of non-excluded lines.
  let codeDiscountCents = 0
  let promoCode: Quote['promoCode'] = null
  const code = normaliseCode(input.promoCode)
  if (code) {
    const found: PromoCode | undefined = input.promoCodes.find(
      (c) => normaliseCode(c.code) === code,
    )
    const email = (input.email ?? '').trim().toLowerCase()
    if (!found) {
      messages.push({ type: 'error', code: 'code_invalid', text: "That code isn't valid." })
    } else {
      promoCode = {
        code,
        applied: false,
        percentOff: found.percentOff,
        requiresEmail: found.firstOrderOnly,
      }
      const expired = Boolean(
        found.expiresAt && new Date(found.expiresAt).getTime() <= now.getTime(),
      )
      const used =
        found.firstOrderOnly &&
        Boolean(email) &&
        (input.redemptions ?? []).some(
          (r) => normaliseCode(r.code) === code && r.email.trim().toLowerCase() === email,
        )
      const base = lines
        .filter((l) => !l.variant.excludedFromPromotions)
        .reduce((sum, l) => sum + l.lineSubtotalCents - l.discountCents, 0)
      if (!found.active) {
        messages.push({
          type: 'error',
          code: 'code_inactive',
          text: "That code isn't active right now.",
        })
      } else if (expired) {
        messages.push({ type: 'error', code: 'code_expired', text: 'That code has expired.' })
      } else if (found.firstOrderOnly && !email) {
        messages.push({
          type: 'info',
          code: 'code_needs_email',
          text: `Add your email to use ${code}.`,
        })
      } else if (used) {
        messages.push({
          type: 'error',
          code: 'code_used',
          text: `${code} has already been used with this email.`,
        })
      } else if (base <= 0) {
        messages.push({
          type: 'info',
          code: 'code_no_eligible',
          text: `${code} doesn't apply to the items in your bag.`,
        })
      } else {
        codeDiscountCents = percentOf(base, found.percentOff)
        promoCode.applied = true
        messages.push({
          type: 'info',
          code: 'code_applied',
          text: `${code} applied: ${found.percentOff}% off.`,
        })
      }
    }
  }

  const discountedSubtotalCents =
    merchandiseSubtotalCents - automaticDiscountCents - codeDiscountCents

  // Rule 7: free shipping compares the discounted subtotal with the threshold.
  const threshold = input.shipping.freeShippingThresholdCents
  const unlocked = lines.length > 0 && discountedSubtotalCents >= threshold
  const shippingOptions: ShippingOption[] = input.shipping.methods
    .filter((m) => m.enabled !== false)
    .map((m) => {
      const isFree = m.priceCents === 0 || (m.freeOverThreshold && unlocked)
      return {
        id: m.id,
        label: m.label,
        amountCents: isFree ? 0 : m.priceCents,
        eta: m.eta,
        isFree,
      }
    })

  return {
    lines: lines.map(({ promotedUnits: _p, variant: _v, ...line }) => line),
    itemCount: lines.reduce((sum, l) => sum + l.qty, 0),
    merchandiseSubtotalCents,
    automaticDiscountCents,
    codeDiscountCents,
    discountedSubtotalCents,
    promotions,
    promoCode,
    shippingOptions,
    freeShipping: {
      thresholdCents: threshold,
      remainingCents: Math.max(0, threshold - discountedSubtotalCents),
      unlocked,
    },
    messages,
  }
}
