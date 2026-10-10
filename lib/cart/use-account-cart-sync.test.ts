import { describe, expect, it } from 'vitest'
import { mergeCarts } from './use-account-cart-sync'
import type { CartLine } from './store'

const line = (sku: string, qty: number, addedAt: number): CartLine => ({
  sku,
  qty,
  addedAt,
  productSlug: sku.toLowerCase(),
  title: sku,
  variantTitle: 'Default',
  unitPriceCents: 1000,
  image: null,
})

describe('mergeCarts (signed-in bag follows the customer)', () => {
  it('keeps every SKU from both bags, oldest first', () => {
    const merged = mergeCarts(
      { lines: [line('B', 1, 20)], promoCode: null },
      { lines: [line('A', 2, 10)], promoCode: null },
    )
    expect(merged.lines.map((l) => l.sku)).toEqual(['A', 'B'])
  })

  it('takes the larger quantity for the same SKU, capped at the bag maximum', () => {
    const merged = mergeCarts(
      { lines: [line('A', 3, 5)], promoCode: null },
      { lines: [line('A', 8, 1)], promoCode: null },
    )
    expect(merged.lines).toHaveLength(1)
    expect(merged.lines[0].qty).toBe(8)
    const capped = mergeCarts(
      { lines: [line('A', 10, 5)], promoCode: null },
      { lines: [line('A', 10, 1)], promoCode: null },
    )
    expect(capped.lines[0].qty).toBe(10)
  })

  it('prefers the local promo code, else the saved one', () => {
    expect(
      mergeCarts({ lines: [], promoCode: 'WELCOME10' }, { lines: [], promoCode: 'OLD' }).promoCode,
    ).toBe('WELCOME10')
    expect(
      mergeCarts({ lines: [], promoCode: null }, { lines: [], promoCode: 'WELCOME10' }).promoCode,
    ).toBe('WELCOME10')
    expect(
      mergeCarts({ lines: [], promoCode: null }, { lines: [], promoCode: null }).promoCode,
    ).toBe(null)
  })

  it('returns the saved bag unchanged when the local bag is empty', () => {
    const remote = { lines: [line('A', 2, 1), line('B', 1, 2)], promoCode: null }
    expect(mergeCarts({ lines: [], promoCode: null }, remote).lines).toEqual(remote.lines)
  })
})
