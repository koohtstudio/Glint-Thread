import { describe, expect, it } from 'vitest'
import { parseEnv } from './env.core'

describe('parseEnv', () => {
  it('works with no variables at all (local mode, everything off)', () => {
    const env = parseEnv({})
    expect(env.dataSource).toBe('local')
    expect(env.TAX_MODE).toBe('none')
    expect(env.DEV_DEFAULT_STOCK).toBe(10)
    expect(env.features).toEqual({
      sanity: false,
      sanityWrite: false,
      stripe: false,
      stripeWebhook: false,
      email: false,
    })
  })
  it('treats empty strings as unset', () => {
    const env = parseEnv({
      STRIPE_SECRET_KEY: '',
      NEXT_PUBLIC_SANITY_PROJECT_ID: '',
      DATA_SOURCE: '',
    })
    expect(env.features.stripe).toBe(false)
    expect(env.dataSource).toBe('local')
  })
  it('switches to sanity only when a project ID exists', () => {
    expect(parseEnv({ DATA_SOURCE: 'sanity' }).dataSource).toBe('local')
    expect(parseEnv({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abc123' }).dataSource).toBe('sanity')
    expect(
      parseEnv({ NEXT_PUBLIC_SANITY_PROJECT_ID: 'abc123', DATA_SOURCE: 'local' }).dataSource,
    ).toBe('local')
  })
  it('enables features from keys', () => {
    const env = parseEnv({
      STRIPE_SECRET_KEY: 'sk_test_x',
      STRIPE_WEBHOOK_SECRET: 'whsec_x',
      RESEND_API_KEY: 're_x',
    })
    expect(env.features).toMatchObject({ stripe: true, stripeWebhook: true, email: true })
  })
  it('rejects invalid values with a readable error', () => {
    expect(() => parseEnv({ TAX_MODE: 'table' })).toThrow(/TAX_MODE/)
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: 'not a url' })).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})
