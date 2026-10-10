import { describe, expect, it } from 'vitest'
import catalog from '@/catalog/products.json'
import { buildQuote } from './engine'
import { buildTaxTable, type TaxTable } from './tax'
import type { PricingVariant, Promotion, PromoCode, QuoteInput, ShippingSettings } from './types'

// Same fixtures as the engine tests, trimmed to what tax needs.
const v = (
  sku: string,
  priceCents: number,
  categorySlug: string,
  extra: Partial<PricingVariant> = {},
): PricingVariant => ({
  sku,
  productSlug: sku.toLowerCase(),
  productTitle: `Product ${sku}`,
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
const variants = Object.fromEntries(
  [
    v('SOCK', 699, 'crew-socks'),
    v('EAR-A', 999, 'earrings'),
    v('EAR-B', 1299, 'earrings'),
    v('EAR-C', 1499, 'earrings'),
    v('BAG', 3500, 'mini-bags'),
  ].map((x) => [x.sku, x]),
)
const promotions: Promotion[] = [
  {
    id: 'socks',
    title: 'Socks',
    type: 'tiered_percent_category',
    appliesTo: { categories: ['crew-socks'] },
    tiers: [{ minQty: 3, percentOff: 20 }],
    badge: '',
    active: true,
  },
  {
    id: 'b2g1',
    title: 'Earrings',
    type: 'buy_x_get_y_cheapest_free',
    appliesTo: { categories: ['earrings'] },
    buyQty: 2,
    getQty: 1,
    badge: '',
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
]
const shipping: ShippingSettings = {
  freeShippingThresholdCents: 6000,
  methods: [
    {
      id: 'standard',
      label: 'Standard',
      priceCents: 899,
      freeOverThreshold: true,
      eta: '3 to 7 business days',
    },
    {
      id: 'expedited',
      label: 'Expedited',
      priceCents: 1599,
      freeOverThreshold: false,
      eta: '2 to 4 business days',
    },
  ],
}
const table = buildTaxTable(catalog.tax.provinces)
const noShippingTax: TaxTable = Object.fromEntries(
  Object.entries(table).map(([p, comps]) => [
    p,
    comps.map((c) => ({ ...c, appliesToShipping: false })),
  ]),
)

const quote = (extra: Partial<QuoteInput> & Pick<QuoteInput, 'lines'>) =>
  buildQuote({
    variants,
    promotions,
    promoCodes,
    shipping,
    taxMode: 'table',
    taxTable: table,
    shippingMethodId: 'standard',
    now: new Date('2026-10-10T12:00:00Z'),
    ...extra,
  })

const socks = [{ sku: 'SOCK', qty: 3 }] // 2097 - 419 = 1678 discounted, standard shipping 899

/**
 * Expected cents are worked by hand. With shipping taxed the base is 1678 + 899 = 2577; without it, 1678.
 * province: [lines with shipping taxed, tax total, lines without shipping tax, tax total]
 */
const CASES: Record<string, [number[], number, number[], number]> = {
  AB: [[129], 129, [84], 84], // 5% of 2577 = 128.85, of 1678 = 83.9
  BC: [[129, 180], 309, [84, 117], 201], // PST 7%: 180.39, 117.46
  MB: [[129, 180], 309, [84, 117], 201], // RST 7%
  NB: [[387], 387, [252], 252], // 15%: 386.55, 251.7
  NL: [[387], 387, [252], 252],
  NS: [[361], 361, [235], 235], // 14%: 360.78, 234.92
  NT: [[129], 129, [84], 84],
  NU: [[129], 129, [84], 84],
  ON: [[335], 335, [218], 218], // 13%: 335.01, 218.14
  PE: [[387], 387, [252], 252],
  QC: [[129, 257], 386, [84, 167], 251], // QST 9.975%: 257.05575, 167.3805
  SK: [[129, 155], 284, [84, 101], 185], // PST 6%: 154.62, 100.68
  YT: [[129], 129, [84], 84],
}

describe('tax by province (3 socks, standard shipping $8.99)', () => {
  it('has a case for every province and territory', () => {
    expect(Object.keys(CASES).sort()).toEqual(Object.keys(table).sort())
  })
  for (const [province, [withShip, withShipTotal, without, withoutTotal]] of Object.entries(
    CASES,
  )) {
    it(`${province}: shipping taxed ${withShipTotal}, not taxed ${withoutTotal}`, () => {
      const a = quote({ lines: socks, province })
      expect(a.discountedSubtotalCents).toBe(1678)
      expect(a.shipping).toMatchObject({ id: 'standard', amountCents: 899 })
      expect(a.taxLines.map((l) => l.amountCents)).toEqual(withShip)
      expect(a.taxCents).toBe(withShipTotal)
      expect(a.totalCents).toBe(1678 + 899 + withShipTotal)

      const b = quote({ lines: socks, province, taxTable: noShippingTax })
      expect(b.taxLines.map((l) => l.amountCents)).toEqual(without)
      expect(b.taxCents).toBe(withoutTotal)
      expect(b.totalCents).toBe(1678 + 899 + withoutTotal)
    })
  }
})

describe('tax with promotions, codes and shipping choices', () => {
  it('labels each line by name', () => {
    expect(quote({ lines: socks, province: 'BC' }).taxLines.map((l) => l.label)).toEqual([
      'GST 5%',
      'PST (BC) 7%',
    ])
    expect(quote({ lines: socks, province: 'ON' }).taxLines.map((l) => l.label)).toEqual([
      'HST (ON) 13%',
    ])
    expect(quote({ lines: socks, province: 'QC' }).taxLines.map((l) => l.label)).toEqual([
      'GST 5%',
      'QST (QC) 9.975%',
    ])
  })

  it('WELCOME10 reduces the tax base: ON, 1678 - 168 = 1510, HST on 1510 + 899', () => {
    const q = quote({
      lines: socks,
      province: 'ON',
      promoCode: 'WELCOME10',
      email: 'ana@example.ca',
    })
    expect(q.codeDiscountCents).toBe(168)
    expect(q.discountedSubtotalCents).toBe(1510)
    expect(q.taxCents).toBe(313) // 2409 * 13% = 313.17
    expect(q.totalCents).toBe(1510 + 899 + 313)
  })

  it('buy 2 get 1 free earrings: ON tax on the discounted subtotal', () => {
    const q = quote({
      lines: [
        { sku: 'EAR-A', qty: 1 },
        { sku: 'EAR-B', qty: 1 },
        { sku: 'EAR-C', qty: 1 },
      ],
      province: 'ON',
    })
    expect(q.automaticDiscountCents).toBe(999)
    expect(q.discountedSubtotalCents).toBe(2798)
    expect(q.taxCents).toBe(481) // 3697 * 13% = 480.61
    expect(q.totalCents).toBe(2798 + 899 + 481)
  })

  it('free standard shipping leaves tax on merchandise only (BC, $70 bag order)', () => {
    const q = quote({ lines: [{ sku: 'BAG', qty: 2 }], province: 'BC' })
    expect(q.shipping).toMatchObject({ id: 'standard', amountCents: 0, isFree: true })
    expect(q.taxLines.map((l) => l.amountCents)).toEqual([350, 490])
    expect(q.totalCents).toBe(7000 + 840)
  })

  it('expedited shipping is taxed where flagged (ON)', () => {
    const q = quote({ lines: socks, province: 'ON', shippingMethodId: 'expedited' })
    expect(q.shipping?.amountCents).toBe(1599)
    expect(q.taxCents).toBe(426) // (1678 + 1599) * 13% = 426.01
    expect(q.totalCents).toBe(1678 + 1599 + 426)
  })

  it('no shipping method yet: tax on merchandise only and no shipping in the total', () => {
    const q = quote({ lines: socks, province: 'ON', shippingMethodId: null })
    expect(q.shipping).toBeNull()
    expect(q.taxCents).toBe(218)
    expect(q.totalCents).toBe(1678 + 218)
    expect(quote({ lines: socks, province: 'ON', shippingMethodId: 'nope' }).shipping).toBeNull()
  })

  it('TAX_MODE none: no tax lines even with a province and a table', () => {
    const q = quote({ lines: socks, province: 'ON', taxMode: 'none' })
    expect(q.taxMode).toBe('none')
    expect(q.taxLines).toEqual([])
    expect(q.totalCents).toBe(1678 + 899)
    expect(buildQuote({ lines: socks, variants, promotions, promoCodes, shipping }).taxMode).toBe(
      'none',
    )
  })

  it('table mode with an unknown or missing province charges nothing yet', () => {
    expect(quote({ lines: socks, province: 'ZZ' }).taxCents).toBe(0)
    expect(quote({ lines: socks, province: null }).taxLines).toEqual([])
    expect(quote({ lines: socks }).totalCents).toBe(1678 + 899)
  })

  it('an empty bag has no shipping, tax or total', () => {
    const q = quote({ lines: [], province: 'ON' })
    expect(q.shipping).toBeNull()
    expect(q.totalCents).toBe(0)
  })
})
