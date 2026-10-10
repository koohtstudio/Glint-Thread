import { describe, expect, it } from 'vitest'
import { hashEmail } from './email-hash'

describe('hashEmail', () => {
  it('is stable, case and whitespace insensitive, and salted', () => {
    const a = hashEmail(' Ana@Example.ca ', 'salt-1')
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(hashEmail('ana@example.ca', 'salt-1')).toBe(a)
    expect(hashEmail('ana@example.ca', 'salt-2')).not.toBe(a)
    expect(a).not.toContain('ana')
  })
})
