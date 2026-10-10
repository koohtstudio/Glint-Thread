import { randomInt } from 'node:crypto'

// Crockford-style base32 without I, L, O, U so numbers read cleanly over the phone.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Order number: "GT-" + 6 base32 characters (PRD 9.2), about one billion combinations. */
export function generateOrderNumber(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return `GT-${out}`
}

export function isOrderNumber(s: string): boolean {
  return /^GT-[0-9A-HJKMNP-TV-Z]{6}$/.test(s.trim().toUpperCase())
}

/** Sanity-safe array keys derived from SKUs. */
export function skuKey(sku: string): string {
  return sku.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
}
