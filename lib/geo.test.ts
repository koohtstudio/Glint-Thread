import { describe, expect, it } from 'vitest'
import {
  PROVINCES,
  normalisePhone,
  normalisePostalCode,
  postalCodeMatchesProvince,
  provinceCodeFrom,
  provinceName,
} from './geo'

describe('provinces', () => {
  it('lists all 13', () => {
    expect(PROVINCES).toHaveLength(13)
    expect(provinceName('qc')).toBe('Quebec')
    expect(provinceName('ZZ')).toBe('ZZ')
    expect(provinceName(null)).toBe('')
  })

  it('resolves a code or a name, with or without accents, to the code (wallet sheets send either)', () => {
    expect(provinceCodeFrom('on')).toBe('ON')
    expect(provinceCodeFrom('Québec')).toBe('QC')
    expect(provinceCodeFrom(' british columbia ')).toBe('BC')
    expect(provinceCodeFrom('Ontario')).toBe('ON')
    expect(provinceCodeFrom('Texas')).toBeNull()
    expect(provinceCodeFrom('')).toBeNull()
    expect(provinceCodeFrom(undefined)).toBeNull()
  })
})

describe('postal codes', () => {
  it('normalises case, spacing and hyphens to "A1A 1A1"', () => {
    expect(normalisePostalCode('k1a0b1')).toBe('K1A 0B1')
    expect(normalisePostalCode(' K1A-0B1 ')).toBe('K1A 0B1')
    expect(normalisePostalCode('M5V   1E3')).toBe('M5V 1E3')
  })
  it('rejects invalid shapes and unused letters', () => {
    for (const bad of [
      '',
      '12345',
      'K1A 0B',
      'D1A 0B1',
      'K1A 0D1',
      'W1A 1A1',
      'Z1A 1A1',
      'K1A 0B1 2',
      'KKA 0B1',
    ])
      expect(normalisePostalCode(bad), bad).toBeNull()
  })
  it('checks the first letter against the province', () => {
    expect(postalCodeMatchesProvince('M5V 1E3', 'ON')).toBe(true)
    expect(postalCodeMatchesProvince('V6B 1A1', 'BC')).toBe(true)
    expect(postalCodeMatchesProvince('H2X 1Y4', 'QC')).toBe(true)
    expect(postalCodeMatchesProvince('X1A 2B3', 'NU')).toBe(true)
    expect(postalCodeMatchesProvince('X1A 2B3', 'NT')).toBe(true)
    expect(postalCodeMatchesProvince('M5V 1E3', 'BC')).toBe(false)
    expect(postalCodeMatchesProvince('', 'ON')).toBe(false)
  })
})

describe('phone', () => {
  it('formats 10 digits and drops a leading 1', () => {
    expect(normalisePhone('4165550199')).toBe('(416) 555-0199')
    expect(normalisePhone('+1 (416) 555-0199')).toBe('(416) 555-0199')
    expect(normalisePhone('416-555-019')).toBeNull()
    expect(normalisePhone('')).toBeNull()
  })
})
