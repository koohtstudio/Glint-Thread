import { describe, expect, it } from 'vitest'
import { formatDiscount, formatMoney, plural, toCents } from './format'

describe('formatMoney', () => {
  it('formats integer cents as en-CA CAD', () => {
    expect(formatMoney(1199)).toBe('$11.99')
    expect(formatMoney(0)).toBe('$0.00')
    expect(formatMoney(6000)).toBe('$60.00')
    expect(formatMoney(123456)).toBe('$1,234.56')
  })
  it('rejects floats and non-numbers', () => {
    expect(() => formatMoney(11.99)).toThrow(TypeError)
    expect(() => formatMoney(Number.NaN)).toThrow(TypeError)
  })
  it('formats discounts with a true minus sign', () => {
    expect(formatDiscount(419)).toBe('−$4.19')
  })
})

describe('toCents', () => {
  it('converts dollars without float drift', () => {
    expect(toCents('11.99')).toBe(1199)
    expect(toCents('$1,234.5')).toBe(123450)
    expect(toCents(0.1 + 0.2)).toBe(30)
    expect(toCents('7')).toBe(700)
    expect(toCents('-4.19')).toBe(-419)
  })
  it('rejects junk', () => {
    expect(() => toCents('abc')).toThrow(TypeError)
    expect(() => toCents('1.999')).toThrow(TypeError)
  })
})

describe('plural', () => {
  it('pluralises', () => {
    expect(plural(1, 'item', 'items')).toBe('1 item')
    expect(plural(3, 'item', 'items')).toBe('3 items')
  })
})
