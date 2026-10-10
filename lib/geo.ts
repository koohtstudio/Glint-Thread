/** Canadian provinces and territories, and postal code handling (PRD 6.4). Pure: safe on client and server. */
export interface Province {
  code: string
  name: string
}

export const PROVINCES: Province[] = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
]

export const PROVINCE_CODES = PROVINCES.map((p) => p.code)

export function provinceName(code: string | null | undefined): string {
  return PROVINCES.find((p) => p.code === code?.toUpperCase())?.name ?? code ?? ''
}

/** Provinces each postal code first letter can belong to (Canada Post forward sortation areas). */
const FIRST_LETTER: Record<string, string[]> = {
  A: ['NL'],
  B: ['NS'],
  C: ['PE'],
  E: ['NB'],
  G: ['QC'],
  H: ['QC'],
  J: ['QC'],
  K: ['ON'],
  L: ['ON'],
  M: ['ON'],
  N: ['ON'],
  P: ['ON'],
  R: ['MB'],
  S: ['SK'],
  T: ['AB'],
  V: ['BC'],
  X: ['NT', 'NU'],
  Y: ['YT'],
}

/** "k1a0b1", "K1A-0B1" and " K1A  0B1 " all become "K1A 0B1"; null when it is not a valid Canadian postal code. */
export function normalisePostalCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[\s-]+/g, '')
  // Letters D, F, I, O, Q and U are never used; W and Z are never used as the first letter.
  if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact)) return null
  return `${compact.slice(0, 3)} ${compact.slice(3)}`
}

/** True when the postal code's first letter is consistent with the province. */
export function postalCodeMatchesProvince(postalCode: string, province: string): boolean {
  const first = postalCode.trim().toUpperCase()[0]
  return Boolean(FIRST_LETTER[first]?.includes(province.toUpperCase()))
}

/** Digits only, 10 digits with an optional leading 1, formatted "(416) 555-0199". Null when invalid. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (local.length !== 10) return null
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`
}
