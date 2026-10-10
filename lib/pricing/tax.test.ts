import { describe, expect, it } from 'vitest'
import { buildTaxTable, calculateTax, formatRate, taxLabel, taxOn, type TaxTable } from './tax'
import catalog from '@/catalog/products.json'

const table = buildTaxTable(catalog.tax.provinces)

describe('rates and labels', () => {
  it('formats rates without trailing zeros', () => {
    expect(formatRate(13)).toBe('13')
    expect(formatRate(9.975)).toBe('9.975')
    expect(formatRate(5)).toBe('5')
  })
  it('labels GST without a province and the rest with one', () => {
    expect(taxLabel('GST', 'BC', 5)).toBe('GST 5%')
    expect(taxLabel('HST', 'ON', 13)).toBe('HST (ON) 13%')
    expect(taxLabel('PST', 'BC', 7)).toBe('PST (BC) 7%')
    expect(taxLabel('QST', 'QC', 9.975)).toBe('QST (QC) 9.975%')
    expect(taxLabel('RST', 'MB', 7)).toBe('RST (MB) 7%')
  })
})

describe('taxOn rounds half up to the cent in integers', () => {
  it('handles exact, half and sub-cent cases', () => {
    expect(taxOn(1000, 13)).toBe(130)
    expect(taxOn(1678, 13)).toBe(218) // 218.14
    expect(taxOn(10, 5)).toBe(1) // 0.5 rounds up
    expect(taxOn(9, 5)).toBe(0) // 0.45
    expect(taxOn(1678, 9.975)).toBe(167) // 167.3805
    expect(taxOn(2000, 9.975)).toBe(200) // 199.5 rounds up
    expect(taxOn(0, 13)).toBe(0)
  })
})

describe('seed table from products.json (2026 rates)', () => {
  it('covers all 13 provinces and territories with the right components', () => {
    expect(Object.keys(table).sort()).toEqual([
      'AB',
      'BC',
      'MB',
      'NB',
      'NL',
      'NS',
      'NT',
      'NU',
      'ON',
      'PE',
      'QC',
      'SK',
      'YT',
    ])
    expect(table.ON).toEqual([{ code: 'HST', ratePercent: 13, appliesToShipping: true }])
    expect(table.BC.map((c) => [c.code, c.ratePercent])).toEqual([
      ['GST', 5],
      ['PST', 7],
    ])
    expect(table.QC.map((c) => [c.code, c.ratePercent])).toEqual([
      ['GST', 5],
      ['QST', 9.975],
    ])
    expect(table.MB.map((c) => c.code)).toEqual(['GST', 'RST'])
    expect(table.SK.map((c) => [c.code, c.ratePercent])).toEqual([
      ['GST', 5],
      ['PST', 6],
    ])
    expect(table.NS[0].ratePercent).toBe(14)
    for (const p of ['NB', 'NL', 'PE'])
      expect(table[p][0]).toMatchObject({ code: 'HST', ratePercent: 15 })
    for (const p of ['NT', 'NU', 'YT', 'AB'])
      expect(table[p]).toEqual([{ code: 'GST', ratePercent: 5, appliesToShipping: true }])
  })
  it('skips unknown or missing components', () => {
    expect(buildTaxTable({ XX: { FOO: 3 } })).toEqual({ XX: [] })
  })
})

describe('calculateTax', () => {
  it('computes each component on merchandise plus shipping where flagged', () => {
    const r = calculateTax(table, 'BC', 1678, 899)
    expect(r.lines.map((l) => [l.label, l.amountCents])).toEqual([
      ['GST 5%', 129], // (1678 + 899) * 5% = 128.85
      ['PST (BC) 7%', 180], // 2577 * 7% = 180.39
    ])
    expect(r.totalCents).toBe(309)
  })
  it('leaves shipping out for components that do not apply to it', () => {
    const custom: TaxTable = {
      SK: [
        { code: 'GST', ratePercent: 5, appliesToShipping: true },
        { code: 'PST', ratePercent: 6, appliesToShipping: false },
      ],
    }
    const r = calculateTax(custom, 'sk', 1000, 1000)
    expect(r.lines.map((l) => l.amountCents)).toEqual([100, 60])
  })
  it('returns no lines for an unknown province, a missing province or a missing table', () => {
    expect(calculateTax(table, 'ZZ', 1000, 0)).toEqual({ lines: [], totalCents: 0 })
    expect(calculateTax(table, null, 1000, 0)).toEqual({ lines: [], totalCents: 0 })
    expect(calculateTax(undefined, 'ON', 1000, 0)).toEqual({ lines: [], totalCents: 0 })
  })
})
