import { describe, expect, it } from 'vitest'
import { clientIp, createRateLimiter } from './rate-limit'

describe('rate limiter', () => {
  it('allows up to the limit per window, then blocks until reset', () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 1000 })
    expect(rl.check('a', 0).ok).toBe(true)
    expect(rl.check('a', 10).ok).toBe(true)
    const blocked = rl.check('a', 20)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSeconds).toBe(1)
    expect(rl.check('b', 20).ok).toBe(true)
    expect(rl.check('a', 1001).ok).toBe(true)
  })
  it('reads the first forwarded IP', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
