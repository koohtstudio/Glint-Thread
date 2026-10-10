import { describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/firebase/admin', () => ({ adminAuth: vi.fn(), firebaseConfigured: () => true }))

describe('session helpers', () => {
  it('allows only same-site relative redirect targets', async () => {
    const { safeNext } = await import('./next')
    expect(safeNext('/account/orders')).toBe('/account/orders')
    expect(safeNext('/checkout?x=1')).toBe('/checkout?x=1')
    for (const bad of [
      'https://evil.example',
      '//evil.example',
      'javascript:alert(1)',
      '/\\evil',
      '',
      null,
      undefined,
    ])
      expect(safeNext(bad as string), String(bad)).toBe('/account')
    expect(safeNext('nope', '/')).toBe('/')
  })
  it('treats a sign-in within ten minutes as fresh', async () => {
    const { isFreshLogin } = await import('./session')
    const user = { uid: 'u', email: 'a@b.ca', emailVerified: true, authTime: 1_000_000 }
    expect(isFreshLogin(user, 1_000_000 + 599)).toBe(true)
    expect(isFreshLogin(user, 1_000_000 + 601)).toBe(false)
  })
})
