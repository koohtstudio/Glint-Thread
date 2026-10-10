import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: { fn: string; args: unknown }[] = []
let createError: { message: string } | null = null
const rec = (fn: string, result: unknown = { data: { id: 'x' }, error: null }) =>
  vi.fn(async (args: unknown) => {
    calls.push({ fn, args })
    return result
  })

const envState: Record<string, string | undefined> = {}
vi.mock('@/lib/env', () => ({ env: new Proxy({}, { get: (_t, k: string) => envState[k] }) }))
vi.mock('resend', () => ({
  Resend: class {
    contactProperties = { create: rec('properties.create') }
    contacts = {
      create: vi.fn(async (args: unknown) => {
        calls.push({ fn: 'contacts.create', args })
        return createError
          ? { data: null, error: createError }
          : { data: { id: 'c1' }, error: null }
      }),
      update: rec('contacts.update'),
      topics: { update: rec('topics.update') },
      segments: { add: rec('segments.add') },
    }
  },
}))

beforeEach(() => {
  calls.length = 0
  createError = null
  for (const k of Object.keys(envState)) delete envState[k]
})

const consent = {
  consentTextVersion: 'newsletter-consent-v1',
  consentAt: '2026-10-10T12:00:00.000Z',
  signupSource: 'footer',
}

describe('confirmSubscriber', () => {
  it('logs to the console without a Resend key', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { confirmSubscriber } = await import('./subscribers')
    expect(await confirmSubscriber('ana@example.ca', consent)).toBe('logged')
    expect(calls).toEqual([])
    info.mockRestore()
  })

  it('creates the contact with consent properties, topic opt-in and segment in one call', async () => {
    Object.assign(envState, {
      RESEND_API_KEY: 're_x',
      RESEND_NEWSLETTER_TOPIC_ID: 'top_1',
      RESEND_NEWSLETTER_SEGMENT_ID: 'seg_1',
    })
    const { confirmSubscriber } = await import('./subscribers')
    expect(await confirmSubscriber('ana@example.ca', consent)).toBe('confirmed')
    const create = calls.find((c) => c.fn === 'contacts.create')!.args as Record<string, unknown>
    expect(create).toMatchObject({
      email: 'ana@example.ca',
      unsubscribed: false,
      topics: [{ id: 'top_1', subscription: 'opt_in' }],
      segments: [{ id: 'seg_1' }],
      properties: {
        consent_text_version: 'newsletter-consent-v1',
        consent_at: '2026-10-10T12:00:00.000Z',
        signup_source: 'footer',
      },
    })
    expect((create.properties as Record<string, string>).confirmed_at).toMatch(/^\d{4}-\d\d-\d\dT/)
    expect(calls.filter((c) => c.fn === 'properties.create')).toHaveLength(4)
  })

  it('updates, resubscribes and re-adds when the contact already exists', async () => {
    Object.assign(envState, {
      RESEND_API_KEY: 're_x',
      RESEND_NEWSLETTER_TOPIC_ID: 'top_1',
      RESEND_NEWSLETTER_SEGMENT_ID: 'seg_1',
    })
    createError = { message: 'exists' }
    const { confirmSubscriber } = await import('./subscribers')
    await confirmSubscriber('ana@example.ca', consent)
    expect(calls.map((c) => c.fn).filter((f) => f !== 'properties.create')).toEqual([
      'contacts.create',
      'contacts.update',
      'topics.update',
      'segments.add',
    ])
    expect(calls.find((c) => c.fn === 'topics.update')!.args).toEqual({
      email: 'ana@example.ca',
      topics: [{ id: 'top_1', subscription: 'opt_in' }],
    })
    expect(calls.find((c) => c.fn === 'segments.add')!.args).toEqual({
      email: 'ana@example.ca',
      segmentId: 'seg_1',
    })
  })

  it('still saves the contact when topic and segment IDs are not set', async () => {
    Object.assign(envState, { RESEND_API_KEY: 're_x' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { confirmSubscriber } = await import('./subscribers')
    await confirmSubscriber('ana@example.ca', consent)
    const create = calls.find((c) => c.fn === 'contacts.create')!.args as Record<string, unknown>
    expect(create.topics).toBeUndefined()
    expect(create.segments).toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('unsubscribe', () => {
  it('opts out of the Newsletter topic', async () => {
    Object.assign(envState, { RESEND_API_KEY: 're_x', RESEND_NEWSLETTER_TOPIC_ID: 'top_1' })
    const { unsubscribe } = await import('./subscribers')
    await unsubscribe('ana@example.ca')
    expect(calls).toEqual([
      {
        fn: 'topics.update',
        args: { email: 'ana@example.ca', topics: [{ id: 'top_1', subscription: 'opt_out' }] },
      },
    ])
  })

  it('falls back to a global unsubscribe with no topic ID, and logs with no key', async () => {
    Object.assign(envState, { RESEND_API_KEY: 're_x' })
    const { unsubscribe } = await import('./subscribers')
    await unsubscribe('ana@example.ca')
    expect(calls).toEqual([
      { fn: 'contacts.update', args: { email: 'ana@example.ca', unsubscribed: true } },
    ])
    calls.length = 0
    delete envState.RESEND_API_KEY
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await unsubscribe('ana@example.ca')
    expect(calls).toEqual([])
    info.mockRestore()
  })
})
