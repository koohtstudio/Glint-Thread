const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

/** Formats integer cents as Canadian dollars, e.g. 1199 -> "$11.99". */
export function formatMoney(cents: number): string {
  if (!Number.isFinite(cents))
    throw new TypeError(`formatMoney expects a number of cents, got ${cents}`)
  if (!Number.isInteger(cents))
    throw new TypeError(`formatMoney expects integer cents, got ${cents}`)
  return cad.format(cents / 100)
}

/** Formats a discount as a negative amount with a true minus sign, e.g. 419 -> "−$4.19". */
export function formatDiscount(cents: number): string {
  return `−${formatMoney(Math.abs(cents))}`
}

/** Converts a dollar string or number to integer cents without float drift: "11.99" -> 1199. */
export function toCents(dollars: string | number): number {
  const s = typeof dollars === 'number' ? dollars.toFixed(2) : dollars.trim().replace(/[$,\s]/g, '')
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new TypeError(`Not a dollar amount: ${dollars}`)
  const negative = s.startsWith('-')
  const [whole, frac = ''] = s.replace('-', '').split('.')
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'))
  return negative ? -cents : cents
}

/** "1 item" / "3 items" style pluralisation for English. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

const dateFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
export function formatDate(iso: string | Date): string {
  return dateFmt.format(typeof iso === 'string' ? new Date(iso) : iso)
}
