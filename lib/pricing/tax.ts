/**
 * Provincial sales tax (PRD 7.6, 9.1 rule 8). Pure, integer maths. Rates are percentages with up to
 * three decimals (QST is 9.975), so they are converted to thousandths and applied with integer rounding.
 */
export type TaxCode = 'GST' | 'HST' | 'PST' | 'RST' | 'QST'
export const TAX_CODES: TaxCode[] = ['GST', 'HST', 'PST', 'RST', 'QST']

export interface TaxComponent {
  code: TaxCode
  ratePercent: number
  appliesToShipping: boolean
}

/** Province or territory code (ON, BC, QC...) to its tax components. */
export type TaxTable = Record<string, TaxComponent[]>

export interface TaxLine {
  code: TaxCode
  label: string
  ratePercent: number
  amountCents: number
}

/** 13 -> "13", 9.975 -> "9.975". */
export function formatRate(ratePercent: number): string {
  return String(Math.round(ratePercent * 1000) / 1000)
}

/** GST has no province in its label ("GST 5%"); the others do ("HST (ON) 13%", "QST (QC) 9.975%"). */
export function taxLabel(code: TaxCode, province: string, ratePercent: number): string {
  return code === 'GST'
    ? `GST ${formatRate(ratePercent)}%`
    : `${code} (${province}) ${formatRate(ratePercent)}%`
}

/** base x rate%, rounded half up to the cent, in integers. */
export function taxOn(baseCents: number, ratePercent: number): number {
  const thousandths = Math.round(ratePercent * 1000)
  return Math.floor((baseCents * thousandths + 50_000) / 100_000)
}

export function calculateTax(
  table: TaxTable | undefined,
  province: string | null | undefined,
  merchandiseCents: number,
  shippingCents: number,
): { lines: TaxLine[]; totalCents: number } {
  const components = table && province ? table[province.toUpperCase()] : undefined
  if (!components) return { lines: [], totalCents: 0 }
  const code = (province as string).toUpperCase()
  const lines = components.map((c) => ({
    code: c.code,
    label: taxLabel(c.code, code, c.ratePercent),
    ratePercent: c.ratePercent,
    amountCents: taxOn(merchandiseCents + (c.appliesToShipping ? shippingCents : 0), c.ratePercent),
  }))
  return { lines, totalCents: lines.reduce((sum, l) => sum + l.amountCents, 0) }
}

/**
 * Builds the table from the catalogue's reference rates (`tax.provinces` in products.json, for example
 * `{ BC: { GST: 5, PST: 7 } }`). Every component applies to shipping by default.
 */
export function buildTaxTable(provinces: Record<string, Record<string, number>>): TaxTable {
  const table: TaxTable = {}
  for (const [province, rates] of Object.entries(provinces)) {
    table[province] = TAX_CODES.filter((code) => typeof rates[code] === 'number').map((code) => ({
      code,
      ratePercent: rates[code],
      appliesToShipping: true,
    }))
  }
  return table
}
