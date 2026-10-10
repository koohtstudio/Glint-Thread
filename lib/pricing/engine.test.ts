import { describe, expect, it } from 'vitest'
import { allocate, buildQuote, normaliseCode, percentOf } from './engine'
import type { PricingVariant, Promotion, PromoCode, QuoteInput, ShippingSettings } from './types'

// ---------- Fixtures mirroring catalog/products.json ----------

const variant = (
  sku: string,
  priceCents: number,
  categorySlug: string,
  extra: Partial<PricingVariant> = {},
): PricingVariant => ({
  sku,
  productSlug: extra.productSlug ?? sku.toLowerCase(),
  productTitle: extra.productTitle ?? `Product ${sku}`,
  variantTitle: 'Default',
  priceCents,
  stock: null,
  categorySlug,
  departmentSlug: 'x',
  excludedFromPromotions: false,
  active: true,
  image: null,
  ...extra,
})

const variants: Record<string, PricingVariant> = Object.fromEntries(
  [
    variant('SOCK-699', 699, 'crew-socks'),
    variant('SOCK-599', 599, 'ankle-socks'),
    variant('SOCK-799', 799, 'crew-socks'),
    variant('EAR-999', 999, 'earrings'),
    variant('EAR-999B', 999, 'earrings'),
    variant('EAR-1299', 1299, 'earrings'),
    variant('EAR-1499', 1499, 'earrings'),
    variant('TRIO', 1999, 'earrings', {
      productSlug: 'mystery-earring-trio',
      excludedFromPromotions: true,
    }),
    variant('TRIO-SLUG', 1999, 'earrings', { productSlug: 'mystery-earring-trio' }),
    variant('BAG-3500', 3500, 'mini-bags'),
    variant('BAG-2999', 2999, 'mini-bags'),
    variant('BAG-1000', 1000, 'mini-bags'),
    variant('PJ-4499', 4499, 'pyjamas', {
      variantTitle: 'Holiday Tartan / L',
      productTitle: 'Suede-Touch Pyjama Set',
    }),
    variant('LOW-STOCK', 1299, 'hats', {
      stock: 2,
      productTitle: 'Classic Beret',
      variantTitle: 'Mustard',
    }),
    variant('NO-STOCK', 1299, 'hats', { stock: 0, productTitle: 'Bucket Hat' }),
    variant('INACTIVE', 1299, 'hats', { active: false, productTitle: 'Old Hat' }),
    variant('FREEBIE', 0, 'crew-socks'),
  ].map((v) => [v.sku, v]),
)

const promotions: Promotion[] = [
  {
    id: 'socks-mix-match',
    title: 'Mix & Match Socks',
    type: 'tiered_percent_category',
    appliesTo: { categories: ['ankle-socks', 'crew-socks'] },
    tiers: [
      { minQty: 3, percentOff: 20 },
      { minQty: 6, percentOff: 30 },
    ],
    badge: '3+ pairs save 20%',
    active: true,
  },
  {
    id: 'earrings-b2g1',
    title: 'Earrings: Buy 2, Get 1 Free',
    type: 'buy_x_get_y_cheapest_free',
    appliesTo: { categories: ['earrings'], excludeSlugs: ['mystery-earring-trio'] },
    buyQty: 2,
    getQty: 1,
    badge: 'Buy 2, get 1 free',
    active: true,
  },
]

const promoCodes: PromoCode[] = [
  {
    code: 'WELCOME10',
    type: 'percent_off_order',
    percentOff: 10,
    firstOrderOnly: true,
    active: true,
  },
  {
    code: 'OPEN15',
    type: 'percent_off_order',
    percentOff: 15,
    firstOrderOnly: false,
    active: true,
  },
  {
    code: 'OLD',
    type: 'percent_off_order',
    percentOff: 10,
    firstOrderOnly: false,
    active: true,
    expiresAt: '2026-01-01T00:00:00Z',
  },
  { code: 'OFF', type: 'percent_off_order', percentOff: 10, firstOrderOnly: false, active: false },
  {
    code: 'LATER',
    type: 'percent_off_order',
    percentOff: 10,
    firstOrderOnly: false,
    active: true,
    expiresAt: '2030-01-01T00:00:00Z',
  },
]

const shipping: ShippingSettings = {
  freeShippingThresholdCents: 6000,
  methods: [
    {
      id: 'standard',
      label: 'Standard (Canada Post, tracked)',
      priceCents: 899,
      freeOverThreshold: true,
      eta: '3 to 7 business days',
    },
    {
      id: 'expedited',
      label: 'Expedited (Canada Post, tracked)',
      priceCents: 1599,
      freeOverThreshold: false,
      eta: '2 to 4 business days',
    },
    {
      id: 'pickup',
      label: 'Local pickup',
      priceCents: 0,
      freeOverThreshold: false,
      eta: 'Ready in 1 to 2 business days',
      enabled: false,
    },
  ],
}

const NOW = new Date('2026-10-10T12:00:00Z')
const quote = (lines: QuoteInput['lines'], extra: Partial<QuoteInput> = {}) =>
  buildQuote({ lines, variants, promotions, promoCodes, shipping, now: NOW, ...extra })
const standard = (q: ReturnType<typeof quote>) =>
  q.shippingOptions.find((o) => o.id === 'standard')!

// ---------- PRD 9.1 required cases ----------

describe('PRD 9.1 required cases', () => {
  it('3 x sock $6.99: subtotal 2097, discount 419, discounted 1678', () => {
    const q = quote([{ sku: 'SOCK-699', qty: 3 }])
    expect(q.merchandiseSubtotalCents).toBe(2097)
    expect(q.automaticDiscountCents).toBe(419)
    expect(q.discountedSubtotalCents).toBe(1678)
    expect(q.lines[0].promotionIds).toEqual(['socks-mix-match'])
  })

  it('3 x $5.99 + 3 x $7.99 socks: subtotal 4194, discount 1258 (30%), discounted 2936', () => {
    const q = quote([
      { sku: 'SOCK-599', qty: 3 },
      { sku: 'SOCK-799', qty: 3 },
    ])
    expect(q.merchandiseSubtotalCents).toBe(4194)
    expect(q.automaticDiscountCents).toBe(1258)
    expect(q.discountedSubtotalCents).toBe(2936)
    // Allocated proportionally; the last line absorbs rounding.
    expect(q.lines[0].discountCents + q.lines[1].discountCents).toBe(1258)
    expect(q.lines[0].discountCents).toBe(Math.round((1258 * 1797) / 4194))
  })

  it('2 x sock $6.99: no discount', () => {
    const q = quote([{ sku: 'SOCK-699', qty: 2 }])
    expect(q.automaticDiscountCents).toBe(0)
    expect(q.promotions).toEqual([])
    expect(q.lines[0].promotionIds).toEqual([])
  })

  it('earrings $9.99, $12.99, $14.99: discount 999 (cheapest free), discounted 2798', () => {
    const q = quote([
      { sku: 'EAR-1499', qty: 1 },
      { sku: 'EAR-999', qty: 1 },
      { sku: 'EAR-1299', qty: 1 },
    ])
    expect(q.automaticDiscountCents).toBe(999)
    expect(q.discountedSubtotalCents).toBe(2798)
    expect(q.lines.find((l) => l.sku === 'EAR-999')!.discountCents).toBe(999)
    expect(q.lines.every((l) => l.promotionIds.includes('earrings-b2g1'))).toBe(true)
  })

  it('4 earrings at $9.99: 1 free, discount 999', () => {
    const q = quote([{ sku: 'EAR-999', qty: 4 }])
    expect(q.automaticDiscountCents).toBe(999)
  })

  it('6 earrings: the 2 cheapest are free', () => {
    const q = quote([
      { sku: 'EAR-1499', qty: 2 },
      { sku: 'EAR-1299', qty: 2 },
      { sku: 'EAR-999', qty: 2 },
    ])
    expect(q.automaticDiscountCents).toBe(999 * 2)
    expect(q.lines.find((l) => l.sku === 'EAR-999')!.discountCents).toBe(1998)
  })

  it('Mystery Trio + 2 earrings: the Trio is not counted, no free unit', () => {
    const q = quote([
      { sku: 'TRIO', qty: 1 },
      { sku: 'EAR-999', qty: 1 },
      { sku: 'EAR-1299', qty: 1 },
    ])
    expect(q.automaticDiscountCents).toBe(0)
    expect(q.lines.find((l) => l.sku === 'TRIO')!.promotionIds).toEqual([])
  })

  it('$70 cart + WELCOME10: 10% of the post-automatic subtotal', () => {
    const q = quote([{ sku: 'BAG-3500', qty: 2 }], {
      promoCode: 'welcome10',
      email: 'Ana@Example.ca',
    })
    expect(q.merchandiseSubtotalCents).toBe(7000)
    expect(q.codeDiscountCents).toBe(700)
    expect(q.discountedSubtotalCents).toBe(6300)
    expect(q.promoCode).toEqual({
      code: 'WELCOME10',
      applied: true,
      percentOff: 10,
      requiresEmail: true,
    })
  })

  it('discounted subtotal $59.99: standard shipping 899, 1 cent remaining', () => {
    const q2 = buildQuote({
      lines: [{ sku: 'X', qty: 1 }],
      variants: { X: variant('X', 5999, 'mini-bags') },
      promotions,
      promoCodes,
      shipping,
      now: NOW,
    })
    expect(q2.discountedSubtotalCents).toBe(5999)
    expect(standard(q2)).toMatchObject({ amountCents: 899, isFree: false })
    expect(q2.freeShipping).toEqual({ thresholdCents: 6000, remainingCents: 1, unlocked: false })
  })

  it('discounted subtotal $60.00: standard shipping free, unlocked', () => {
    const q = buildQuote({
      lines: [{ sku: 'X', qty: 1 }],
      variants: { X: variant('X', 6000, 'mini-bags') },
      promotions,
      promoCodes,
      shipping,
      now: NOW,
    })
    expect(standard(q)).toMatchObject({ amountCents: 0, isFree: true })
    expect(q.freeShipping).toEqual({ thresholdCents: 6000, remainingCents: 0, unlocked: true })
    expect(q.shippingOptions.find((o) => o.id === 'expedited')).toMatchObject({
      amountCents: 1599,
      isFree: false,
    })
  })

  it('requested qty 5 with stock 2: clamped to 2 with a warning', () => {
    const q = quote([{ sku: 'LOW-STOCK', qty: 5 }])
    expect(q.lines[0].qty).toBe(2)
    expect(q.lines[0].available).toBe(2)
    expect(q.messages).toContainEqual(
      expect.objectContaining({
        type: 'warning',
        code: 'stock_clamped',
        sku: 'LOW-STOCK',
        text: expect.stringContaining('Only 2 of Classic Beret (Mustard)'),
      }),
    )
  })
})

// ---------- Edge cases ----------

describe('line handling', () => {
  it('drops unknown, inactive and sold-out SKUs with messages', () => {
    const q = quote([
      { sku: 'NOPE', qty: 1 },
      { sku: 'INACTIVE', qty: 1 },
      { sku: 'NO-STOCK', qty: 1 },
      { sku: 'BAG-1000', qty: 1 },
    ])
    expect(q.lines.map((l) => l.sku)).toEqual(['BAG-1000'])
    expect(q.messages.map((m) => m.code)).toEqual(['unknown_sku', 'inactive_sku', 'sold_out'])
    expect(q.messages[1].text).toBe('Old Hat is no longer available and was removed.')
  })

  it('clamps quantities to 1..10 and merges duplicate SKUs', () => {
    const q = quote([
      { sku: 'BAG-1000', qty: 7 },
      { sku: 'BAG-1000', qty: 6 },
      { sku: 'BAG-2999', qty: 0 },
      { sku: 'PJ-4499', qty: Number.NaN },
      { sku: 'SOCK-599', qty: 2.7 },
    ])
    expect(q.lines.map((l) => [l.sku, l.qty])).toEqual([
      ['BAG-1000', 10],
      ['BAG-2999', 1],
      ['PJ-4499', 1],
      ['SOCK-599', 2],
    ])
    expect(q.messages).toContainEqual(
      expect.objectContaining({ code: 'qty_clamped', sku: 'BAG-1000' }),
    )
    expect(q.itemCount).toBe(14)
  })

  it('honours a custom max per line', () => {
    expect(quote([{ sku: 'BAG-1000', qty: 3 }], { maxQtyPerLine: 2 }).lines[0].qty).toBe(2)
  })

  it('returns an empty quote for an empty bag', () => {
    const q = quote([])
    expect(q.lines).toEqual([])
    expect(q.merchandiseSubtotalCents).toBe(0)
    expect(q.freeShipping).toEqual({ thresholdCents: 6000, remainingCents: 6000, unlocked: false })
    expect(standard(q).amountCents).toBe(899)
  })

  it('uses the current time when none is given', () => {
    const q = buildQuote({
      lines: [{ sku: 'SOCK-699', qty: 3 }],
      variants,
      promotions,
      promoCodes,
      shipping,
    })
    expect(q.automaticDiscountCents).toBe(419)
  })

  it('treats untracked stock (null) as unlimited up to the line cap', () => {
    const q = quote([{ sku: 'BAG-1000', qty: 9 }])
    expect(q.lines[0]).toMatchObject({ qty: 9, available: null })
  })
})

describe('automatic promotions', () => {
  it('uses the 30% tier at 6+ pairs across sock categories', () => {
    const q = quote([
      { sku: 'SOCK-599', qty: 2 },
      { sku: 'SOCK-699', qty: 2 },
      { sku: 'SOCK-799', qty: 2 },
    ])
    const base = 599 * 2 + 699 * 2 + 799 * 2
    expect(q.automaticDiscountCents).toBe(Math.round((base * 30) / 100))
    expect(q.promotions).toEqual([
      {
        id: 'socks-mix-match',
        title: 'Mix & Match Socks',
        discountCents: q.automaticDiscountCents,
      },
    ])
  })

  it('applies socks and earrings promotions in one bag', () => {
    const q = quote([
      { sku: 'SOCK-699', qty: 3 },
      { sku: 'EAR-999', qty: 3 },
    ])
    expect(q.automaticDiscountCents).toBe(419 + 999)
    expect(q.promotions.map((p) => p.id)).toEqual(['socks-mix-match', 'earrings-b2g1'])
  })

  it('excludes products by excludeSlugs even when not flagged excluded', () => {
    const q = quote([
      { sku: 'TRIO-SLUG', qty: 1 },
      { sku: 'EAR-999', qty: 2 },
    ])
    expect(q.automaticDiscountCents).toBe(0)
  })

  it('gives each unit at most one promotion when promotions overlap', () => {
    const overlapping: Promotion[] = [
      promotions[0],
      { ...promotions[0], id: 'socks-again', tiers: [{ minQty: 1, percentOff: 50 }] },
    ]
    const q = quote([{ sku: 'SOCK-699', qty: 3 }], { promotions: overlapping })
    expect(q.automaticDiscountCents).toBe(419)
    expect(q.lines[0].promotionIds).toEqual(['socks-mix-match'])
  })

  it('marks paying units as promoted so a second buy-x promotion cannot reuse them', () => {
    const twice: Promotion[] = [promotions[1], { ...promotions[1], id: 'earrings-again' }]
    const q = quote([{ sku: 'EAR-999', qty: 4 }], { promotions: twice })
    // 4 units: first promo uses 3 (1 free), leaving 1 unit, not enough for another group.
    expect(q.automaticDiscountCents).toBe(999)
  })

  it('skips inactive and out-of-window promotions', () => {
    const windowed: Promotion[] = [
      { ...promotions[0], active: false },
      { ...promotions[1], startsAt: '2027-01-01T00:00:00Z' },
    ]
    expect(
      quote(
        [
          { sku: 'SOCK-699', qty: 3 },
          { sku: 'EAR-999', qty: 3 },
        ],
        { promotions: windowed },
      ).automaticDiscountCents,
    ).toBe(0)
    const ended: Promotion[] = [{ ...promotions[0], endsAt: '2026-10-01T00:00:00Z' }]
    expect(quote([{ sku: 'SOCK-699', qty: 3 }], { promotions: ended }).automaticDiscountCents).toBe(
      0,
    )
    const live: Promotion[] = [
      { ...promotions[0], startsAt: '2026-01-01T00:00:00Z', endsAt: '2027-01-01T00:00:00Z' },
    ]
    expect(quote([{ sku: 'SOCK-699', qty: 3 }], { promotions: live }).automaticDiscountCents).toBe(
      419,
    )
  })

  it('handles zero-priced eligible units without dividing by zero', () => {
    const q = quote([{ sku: 'FREEBIE', qty: 3 }])
    expect(q.automaticDiscountCents).toBe(0)
    expect(q.lines[0].discountCents).toBe(0)
  })
})

describe('promo codes', () => {
  it('rejects unknown, inactive and expired codes', () => {
    const lines = [{ sku: 'BAG-3500', qty: 1 }]
    expect(quote(lines, { promoCode: 'NOPE' }).messages[0]).toMatchObject({
      code: 'code_invalid',
      type: 'error',
    })
    expect(quote(lines, { promoCode: 'NOPE' }).promoCode).toBeNull()
    expect(quote(lines, { promoCode: 'OFF' }).messages[0].code).toBe('code_inactive')
    const expired = quote(lines, { promoCode: 'OLD' })
    expect(expired.messages[0].code).toBe('code_expired')
    expect(expired.codeDiscountCents).toBe(0)
    expect(expired.promoCode?.applied).toBe(false)
  })

  it('applies codes before their expiry', () => {
    expect(quote([{ sku: 'BAG-1000', qty: 1 }], { promoCode: 'LATER' }).codeDiscountCents).toBe(100)
  })

  it('asks for an email for first-order-only codes', () => {
    const q = quote([{ sku: 'BAG-3500', qty: 1 }], { promoCode: 'WELCOME10' })
    expect(q.codeDiscountCents).toBe(0)
    expect(q.promoCode).toMatchObject({ applied: false, requiresEmail: true })
    expect(q.messages[0]).toMatchObject({ code: 'code_needs_email', type: 'info' })
  })

  it('blocks a first-order-only code already redeemed by that email (case-insensitive)', () => {
    const q = quote([{ sku: 'BAG-3500', qty: 1 }], {
      promoCode: 'WELCOME10',
      email: 'ana@example.ca ',
      redemptions: [{ code: 'welcome10', email: 'ANA@example.ca' }],
    })
    expect(q.codeDiscountCents).toBe(0)
    expect(q.messages[0].code).toBe('code_used')
  })

  it('allows a first-order-only code when other emails redeemed it', () => {
    const q = quote([{ sku: 'BAG-3500', qty: 1 }], {
      promoCode: 'WELCOME10',
      email: 'new@example.ca',
      redemptions: [{ code: 'WELCOME10', email: 'ana@example.ca' }],
    })
    expect(q.codeDiscountCents).toBe(350)
  })

  it('applies non-first-order codes without an email', () => {
    expect(quote([{ sku: 'BAG-1000', qty: 1 }], { promoCode: ' open15 ' }).codeDiscountCents).toBe(
      150,
    )
  })

  it('applies after automatic promotions and skips excluded lines', () => {
    const q = quote(
      [
        { sku: 'SOCK-699', qty: 3 },
        { sku: 'TRIO', qty: 1 },
      ],
      { promoCode: 'OPEN15' },
    )
    expect(q.automaticDiscountCents).toBe(419)
    expect(q.codeDiscountCents).toBe(Math.round(((2097 - 419) * 15) / 100))
    expect(q.discountedSubtotalCents).toBe(2097 + 1999 - 419 - q.codeDiscountCents)
  })

  it('reports when nothing in the bag is eligible for the code', () => {
    const q = quote([{ sku: 'TRIO', qty: 1 }], { promoCode: 'OPEN15' })
    expect(q.codeDiscountCents).toBe(0)
    expect(q.messages[0].code).toBe('code_no_eligible')
  })

  it('ignores a blank code', () => {
    expect(quote([{ sku: 'BAG-1000', qty: 1 }], { promoCode: '   ' }).promoCode).toBeNull()
    expect(quote([{ sku: 'BAG-1000', qty: 1 }], { promoCode: null }).promoCode).toBeNull()
  })

  it('counts code savings towards free shipping (rule 7)', () => {
    const q = quote([{ sku: 'BAG-3500', qty: 2 }], { promoCode: 'OPEN15' })
    // 7000 - 1050 = 5950: not free any more.
    expect(q.discountedSubtotalCents).toBe(5950)
    expect(q.freeShipping.unlocked).toBe(false)
  })
})

describe('shipping options', () => {
  it('lists enabled methods only, and a zero-price method is free', () => {
    const withPickup: ShippingSettings = {
      ...shipping,
      methods: shipping.methods.map((m) => ({ ...m, enabled: true })),
    }
    const q = quote([{ sku: 'BAG-1000', qty: 1 }], { shipping: withPickup })
    expect(q.shippingOptions.map((o) => o.id)).toEqual(['standard', 'expedited', 'pickup'])
    expect(q.shippingOptions[2]).toMatchObject({ amountCents: 0, isFree: true })
    expect(quote([{ sku: 'BAG-1000', qty: 1 }]).shippingOptions.map((o) => o.id)).toEqual([
      'standard',
      'expedited',
    ])
  })
})

describe('helpers', () => {
  it('percentOf rounds half away from zero on the base', () => {
    expect(percentOf(2097, 20)).toBe(419)
    expect(percentOf(4194, 30)).toBe(1258)
    expect(percentOf(25, 10)).toBe(3)
  })
  it('allocate gives the remainder to the last weighted entry', () => {
    expect(allocate(100, [1, 1, 1])).toEqual([33, 33, 34])
    expect(allocate(100, [1, 0])).toEqual([100, 0])
    expect(allocate(0, [1, 2])).toEqual([0, 0])
    expect(allocate(50, [0, 0])).toEqual([0, 0])
    expect(allocate(10, [0, 3, 0, 1])).toEqual([0, 8, 0, 2])
  })
  it('normaliseCode trims and uppercases', () => {
    expect(normaliseCode('  welcome10 ')).toBe('WELCOME10')
    expect(normaliseCode(undefined)).toBe('')
  })
})
