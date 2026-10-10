/**
 * PRD 9.8 privacy guarantee: no order document written by checkout or the Stripe webhook contains the
 * customer's email, name, phone or address. A recording fake Sanity client captures every write; a fake
 * Firestore (customerOrders) shows where the personal data goes instead.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import type { Quote } from '@/lib/pricing/types'

const writes: unknown[] = []
const store = new Map<string, Record<string, unknown>>()

function patchBuilder(id: string) {
  const ops: Record<string, unknown> = { id }
  const b = {
    set(v: unknown) {
      ops.set = { ...(ops.set as object), ...(v as object) }
      return b
    },
    setIfMissing(v: unknown) {
      ops.setIfMissing = v
      return b
    },
    append(path: string, v: unknown) {
      ops.append = { path, v }
      return b
    },
    ifRevisionId(rev: string) {
      ops.rev = rev
      return b
    },
    dec(v: unknown) {
      ops.dec = v
      return b
    },
    async commit() {
      writes.push({ patch: ops })
      apply(ops)
      return {}
    },
    ops,
  }
  return b
}

function apply(ops: Record<string, unknown>) {
  const doc = store.get(ops.id as string)
  if (!doc) return
  for (const [k, v] of Object.entries((ops.set as Record<string, unknown>) ?? {})) {
    if (k.includes('.')) {
      const [a, c] = k.split('.')
      doc[a] = { ...(doc[a] as object), [c]: v }
    } else doc[k] = v
  }
  if (ops.append) {
    const { path, v } = ops.append as { path: string; v: unknown[] }
    doc[path] = [...((doc[path] as unknown[]) ?? []), ...v]
  }
}

const fakeClient = {
  async create(doc: Record<string, unknown>) {
    writes.push({ create: doc })
    store.set(doc._id as string, { ...doc, _rev: 'r1' })
    return doc
  },
  async getDocument(id: string) {
    return store.get(id) ?? null
  },
  async fetch(query: string) {
    if (query.startsWith('*[_id in $ids]'))
      return [
        { _id: 'product-critter-crew-socks', variants: [{ _key: 'gt-sok-004-bun', stock: 10 }] },
      ]
    if (query.startsWith('count(')) return 0
    return []
  },
  patch(id: string) {
    return patchBuilder(id)
  },
  transaction() {
    const queued: { ops: Record<string, unknown> }[] = []
    const tx = {
      patch(
        p: string | ReturnType<typeof patchBuilder>,
        fn?: (b: ReturnType<typeof patchBuilder>) => unknown,
      ) {
        if (typeof p === 'string') {
          const b = patchBuilder(p)
          fn?.(b)
          queued.push(b)
        } else queued.push(p)
        return tx
      },
      async commit() {
        for (const q of queued) {
          writes.push({ patch: q.ops })
          apply(q.ops)
        }
        return {}
      },
    }
    return tx
  },
}

vi.mock('@/lib/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    EMAIL_HASH_SALT: 'test-salt',
    OWNER_EMAIL: 'owner@example.ca',
    EMAIL_FROM: 'Glint & Thread <orders@example.ca>',
  },
  features: {
    sanity: true,
    sanityWrite: true,
    stripe: false,
    stripeWebhook: false,
    email: false,
    firebaseAdmin: false,
    accounts: false,
  },
}))
vi.mock('@/sanity/lib/server-client', () => ({
  sanityWriteClient: () => fakeClient,
  sanityReadClient: () => fakeClient,
}))
const sent: { to: string | string[]; subject: string }[] = []
vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn(async (args: { to: string | string[]; subject: string }) => {
    sent.push(args)
    return { ok: true }
  }),
  emailShell: async () => ({
    siteUrl: 'http://localhost:3000',
    legalName: 'Test Co',
    businessAddress: '1 Test St',
  }),
}))
vi.mock('@/lib/data', () => ({
  getPromoCodes: async () => [
    {
      code: 'WELCOME10',
      type: 'percent_off_order',
      percentOff: 10,
      firstOrderOnly: true,
      active: true,
    },
  ],
}))
vi.mock('@/lib/stripe', () => ({ getStripe: () => null }))

const firestore = new Map<string, Record<string, unknown>>()
vi.mock('@/lib/account/customer-orders', () => ({
  customerOrderIdFor: (id: string) => id.replace(/^orders\./, ''),
  createCustomerOrder: async (id: string, doc: Record<string, unknown>) => {
    firestore.set(id, { ...doc })
  },
  updateCustomerOrder: async (id: string, patch: Record<string, unknown>) => {
    firestore.set(id, { ...(firestore.get(id) ?? {}), ...patch })
  },
  getCustomerOrder: async (id: string) => firestore.get(id) ?? null,
  findCustomerOrderBySanityId: async (sanityId: string) =>
    [...firestore.values()].find((d) => d.sanityOrderId === sanityId) ?? null,
  findCustomerOrderByPaymentIntent: async () => null,
}))
vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: () => ({
    getUserByEmail: async () => {
      throw new Error('auth/user-not-found')
    },
  }),
  adminDb: () => ({}),
  firebaseConfigured: () => true,
}))
vi.mock('@/lib/account/store', () => ({ ensureProfile: async () => undefined }))
vi.mock('@/lib/auth/links', () => ({ sendAccountSetupEmail: async () => undefined }))

const PII = {
  email: 'ana.tremblay@example.ca',
  name: 'Ana Tremblay',
  phone: '+14165550199',
  line1: '42 Wellington Street West',
  line2: 'Unit 7',
  city: 'Toronto',
  postal: 'M5V 1E3',
}

const quote: Quote = {
  lines: [
    {
      sku: 'GT-SOK-004-BUN',
      productSlug: 'critter-crew-socks',
      title: 'Critter Crew Socks',
      variantTitle: 'Pink Bunny',
      qty: 3,
      unitPriceCents: 699,
      lineSubtotalCents: 2097,
      discountCents: 419,
      promotionIds: ['socks-mix-match'],
      available: 10,
      image: {
        src: '/catalog/images/critter-crew-socks-01.jpg',
        alt: 'Socks',
        width: 1086,
        height: 1449,
      },
    },
  ],
  itemCount: 3,
  merchandiseSubtotalCents: 2097,
  automaticDiscountCents: 419,
  codeDiscountCents: 168,
  discountedSubtotalCents: 1510,
  promotions: [{ id: 'socks-mix-match', title: 'Mix & Match Socks', discountCents: 419 }],
  promoCode: { code: 'WELCOME10', applied: true, percentOff: 10, requiresEmail: true },
  shippingOptions: [],
  shipping: {
    id: 'standard',
    label: 'Standard (Canada Post, tracked)',
    amountCents: 899,
    eta: '3 to 7 business days',
    isFree: false,
  },
  taxMode: 'table',
  taxLines: [{ code: 'HST', label: 'HST (ON) 13%', ratePercent: 13, amountCents: 314 }],
  taxCents: 314,
  totalCents: 2723,
  freeShipping: { thresholdCents: 6000, remainingCents: 4490, unlocked: false },
  messages: [],
}

function paymentIntent(orderId: string): Stripe.PaymentIntent {
  return {
    id: 'pi_test_456',
    object: 'payment_intent',
    status: 'succeeded',
    amount: 2723,
    amount_received: 2723,
    currency: 'cad',
    metadata: { orderId, orderNumber: 'GT-ABC123' },
    receipt_email: PII.email,
    shipping: {
      name: PII.name,
      phone: PII.phone,
      address: {
        line1: PII.line1,
        line2: PII.line2,
        city: PII.city,
        state: 'ON',
        postal_code: PII.postal,
        country: 'CA',
      },
    },
    livemode: false,
  } as unknown as Stripe.PaymentIntent
}

const customer = {
  email: PII.email,
  name: PII.name,
  phone: PII.phone,
  address: {
    name: PII.name,
    line1: PII.line1,
    line2: PII.line2,
    city: PII.city,
    province: 'ON',
    postalCode: PII.postal,
    phone: PII.phone,
  },
}

describe('orders keep customer PII out of Sanity (PRD 9.8)', () => {
  beforeEach(async () => {
    writes.length = 0
    sent.length = 0
    store.clear()
    firestore.clear()
    const { features } = await import('@/lib/env')
    ;(features as { firebaseAdmin: boolean }).firebaseAdmin = false
  })

  function expectNoPii(recorded: unknown) {
    const serialized = JSON.stringify(recorded).toLowerCase()
    for (const value of Object.values(PII)) expect(serialized).not.toContain(value.toLowerCase())
    for (const key of [
      '"customer"',
      '"shippingaddress"',
      '"email"',
      '"phone"',
      '"name"',
      '"line1"',
      '"postalcode"',
      '"city"',
    ])
      expect(serialized).not.toContain(key)
  }

  it('writes no email, name, phone or address on checkout or on the paid webhook', async () => {
    const { createPendingOrder, markOrderPaid } = await import('./orders')
    const { hashEmail } = await import('./email-hash')

    const pending = await createPendingOrder({ quote, customer, uid: null, createAccount: false })
    expect(pending.stores.sanity).toBe(true)
    const result = await markOrderPaid(paymentIntent(pending.id), 'evt_1')
    expect(result).toBe('processed')

    expectNoPii(writes)

    // What is stored instead: the salted hash, the province, tax lines and non-personal facts.
    const stored = [...store.values()][0]
    expect(stored.emailHash).toBe(hashEmail(PII.email))
    expect(stored.emailHash).toMatch(/^[0-9a-f]{64}$/)
    expect(stored.shippingProvince).toBe('ON')
    expect(stored.status).toBe('paid')
    expect(stored.stockDecremented).toBe(true)
    expect((stored.taxLines as { label: string }[])[0].label).toBe('HST (ON) 13%')
    expect((stored.amounts as { totalCents: number }).totalCents).toBe(2723)

    // The confirmation still reaches the customer: the address came from the PaymentIntent at send time.
    expect(sent.some((m) => m.to === PII.email && /confirmed/.test(m.subject))).toBe(true)
  })

  it('keeps the personal data in Firestore only, and the Sanity writes clean', async () => {
    const { features } = await import('@/lib/env')
    ;(features as { firebaseAdmin: boolean }).firebaseAdmin = true
    const { createPendingOrder, markOrderPaid } = await import('./orders')

    const pending = await createPendingOrder({ quote, customer, uid: null, createAccount: false })
    expect(pending.stores).toEqual({ sanity: true, firestore: true })
    await markOrderPaid(paymentIntent(pending.id), 'evt_1')

    expectNoPii(writes)
    const fs = [...firestore.values()][0]
    expect(fs.email).toBe(PII.email)
    expect(fs.name).toBe(PII.name)
    expect(fs.status).toBe('paid')
    expect((fs.shippingAddress as { line1: string }).line1).toBe(PII.line1)
    expect((fs.totals as { totalCents: number }).totalCents).toBe(2723)
  })

  it('stays idempotent on a replayed event', async () => {
    const { createPendingOrder, markOrderPaid } = await import('./orders')
    const pending = await createPendingOrder({ quote, customer, uid: null, createAccount: false })
    await markOrderPaid(paymentIntent(pending.id), 'evt_1')
    const before = writes.length
    expect(await markOrderPaid(paymentIntent(pending.id), 'evt_1')).toBe('duplicate')
    expect(writes.length).toBe(before)
  })
})

describe('Sanity schema has no personal fields (PRD 9.8, 10)', () => {
  it('order has emailHash and shippingProvince, no customer or address, and there is no subscriber type', async () => {
    const extract = (await import('../sanity/extract.json', { with: { type: 'json' } }).catch(
      () => null,
    )) as null | {
      default: { name: string; attributes?: Record<string, unknown> }[]
    }
    const { readFileSync } = await import('node:fs')
    const src =
      readFileSync('sanity/schemaTypes/commerce.ts', 'utf8') +
      readFileSync('sanity/schemaTypes/index.ts', 'utf8')
    expect(src).toContain("name: 'emailHash'")
    expect(src).toContain("name: 'shippingProvince'")
    expect(src).not.toMatch(/name: 'customer'|name: 'shippingAddress'|subscriber/)
    if (extract) expect(extract.default.some((t) => t.name === 'subscriber')).toBe(false)
  })
})
