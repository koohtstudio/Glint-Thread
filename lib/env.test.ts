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
      accountsUi: false,
      firebaseAdmin: false,
      accounts: false,
      google: false,
      emulators: false,
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
    expect(() => parseEnv({ TAX_MODE: 'stripe' })).toThrow(/TAX_MODE/)
    expect(parseEnv({ TAX_MODE: 'table' }).TAX_MODE).toBe('table')
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: 'not a url' })).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})

describe('firebase config', () => {
  const pub = {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'k',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'x.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'x',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:1:web:1',
  }
  it('needs both the public config and the Admin SDK for accounts', () => {
    expect(parseEnv(pub).features).toMatchObject({
      accountsUi: true,
      firebaseAdmin: false,
      accounts: false,
    })
    const full = parseEnv({
      ...pub,
      FIREBASE_ADMIN_PROJECT_ID: 'x',
      FIREBASE_ADMIN_CLIENT_EMAIL: 'a@x.iam.gserviceaccount.com',
      FIREBASE_ADMIN_PRIVATE_KEY: 'k',
    })
    expect(full.features).toMatchObject({ accountsUi: true, firebaseAdmin: true, accounts: true })
  })
  it('unescapes the private key', () => {
    const env = parseEnv({
      FIREBASE_ADMIN_PRIVATE_KEY: '"-----BEGIN KEY-----\\nabc\\n-----END KEY-----\\n"',
    })
    expect(env.FIREBASE_ADMIN_PRIVATE_KEY).toBe('-----BEGIN KEY-----\nabc\n-----END KEY-----\n')
  })
  it('works with the emulators and no credentials', () => {
    const env = parseEnv({
      ...pub,
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    })
    expect(env.features).toMatchObject({ firebaseAdmin: true, accounts: true, emulators: true })
  })
  it('turns Google sign-in on with the flag', () => {
    expect(parseEnv({ NEXT_PUBLIC_AUTH_GOOGLE: '1' }).features.google).toBe(true)
    expect(parseEnv({}).features.google).toBe(false)
  })
})
