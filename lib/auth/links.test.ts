import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firebase/admin', () => ({ adminAuth: vi.fn() }))
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn(), emailShell: vi.fn() }))

describe('toOurActionUrl', () => {
  it('moves a Firebase action link onto our domain, keeping mode, oobCode and apiKey', async () => {
    const { toOurActionUrl } = await import('./links')
    const url = new URL(
      toOurActionUrl(
        'https://glint.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC123&apiKey=AIza-key&continueUrl=https%3A%2F%2Fexample.ca&lang=en',
      ),
    )
    expect(url.origin + url.pathname).toBe('http://localhost:3000/account/action')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      mode: 'resetPassword',
      oobCode: 'ABC123',
      apiKey: 'AIza-key',
      lang: 'en',
    })
  })
  it('works with emulator links and carries extra parameters', async () => {
    const { toOurActionUrl } = await import('./links')
    const url = new URL(
      toOurActionUrl(
        'http://127.0.0.1:9099/emulator/action?mode=signIn&lang=en&oobCode=XYZ&apiKey=fake-api-key',
        { email: 'ana@example.ca', next: '/account/orders' },
      ),
    )
    expect(Object.fromEntries(url.searchParams)).toEqual({
      mode: 'signIn',
      lang: 'en',
      oobCode: 'XYZ',
      apiKey: 'fake-api-key',
      email: 'ana@example.ca',
      next: '/account/orders',
    })
  })
})
