import { describe, expect, it } from 'vitest'
import { generateOrderNumber, isOrderNumber, skuKey } from './order-number'

describe('order numbers', () => {
  it('are GT- plus six unambiguous base32 characters', () => {
    for (let i = 0; i < 200; i++) {
      const n = generateOrderNumber()
      expect(n).toMatch(/^GT-[0-9A-HJKMNP-TV-Z]{6}$/)
      expect(isOrderNumber(n)).toBe(true)
    }
    expect(isOrderNumber('gt-7k2m9q')).toBe(true)
    expect(isOrderNumber('GT-OOOOOO')).toBe(false)
    expect(isOrderNumber('GT-12345')).toBe(false)
  })
  it('makes Sanity-safe keys from SKUs', () => {
    expect(skuKey('GT-LNG-001-HOL-S/M')).toBe('gt-lng-001-hol-s-m')
  })
})
