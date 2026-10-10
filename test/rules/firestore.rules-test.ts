/**
 * Firestore security rules (PRD 9.8, 10.1), tested against the emulator with `npm run test:rules`.
 * Customers read and write only their own users tree; customerOrders are owner-readable and never client-writable.
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

let env: RulesTestEnvironment

const ORDER = {
  uid: 'alice',
  sanityOrderId: 'orders.abc',
  orderNumber: 'GT-ABC123',
  email: 'alice@example.ca',
  name: 'Alice Tremblay',
  status: 'paid',
  totals: { totalCents: 2409 },
  createdAt: '2026-10-10T12:00:00.000Z',
}
const GUEST_ORDER = { ...ORDER, uid: null, orderNumber: 'GT-GUEST1', email: 'guest@example.ca' }
const ADDRESS = {
  name: 'Alice Tremblay',
  line1: '42 Wellington St W',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5V 1E3',
  isDefault: true,
}

beforeAll(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')
  env = await initializeTestEnvironment({
    projectId: 'demo-glint-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host, port: Number(port) },
  })
})
afterAll(async () => env?.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  // Seed with rules disabled, the way the Admin SDK writes.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users/alice'), {
      firstName: 'Alice',
      lastName: 'T',
      email: 'alice@example.ca',
    })
    await setDoc(doc(db, 'users/alice/addresses/home'), ADDRESS)
    await setDoc(doc(db, 'users/alice/cart/current'), {
      lines: [],
      updatedAt: '2026-10-10T12:00:00.000Z',
    })
    await setDoc(doc(db, 'users/bob'), { firstName: 'Bob' })
    await setDoc(doc(db, 'customerOrders/o1'), ORDER)
    await setDoc(doc(db, 'customerOrders/o2'), { ...ORDER, uid: 'bob', orderNumber: 'GT-BOB001' })
    await setDoc(doc(db, 'customerOrders/o3'), GUEST_ORDER)
  })
})

const as = (uid: string | null) =>
  uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore()

describe('users/{uid}', () => {
  it('lets a customer read and write their own profile', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice')))
    await assertSucceeds(
      updateDoc(doc(as('alice'), 'users/alice'), { firstName: 'Alicia', marketingOptIn: true }),
    )
    await assertSucceeds(
      setDoc(doc(as('carol'), 'users/carol'), {
        firstName: 'Carol',
        createdAt: '2026-10-10T12:00:00.000Z',
      }),
    )
    await assertSucceeds(deleteDoc(doc(as('alice'), 'users/alice')))
  })
  it('blocks other customers and signed-out visitors', async () => {
    await assertFails(getDoc(doc(as('bob'), 'users/alice')))
    await assertFails(getDoc(doc(as(null), 'users/alice')))
    await assertFails(updateDoc(doc(as('bob'), 'users/alice'), { firstName: 'Mallory' }))
    await assertFails(setDoc(doc(as(null), 'users/alice'), { firstName: 'Mallory' }))
    await assertFails(deleteDoc(doc(as('bob'), 'users/alice')))
  })
  it('rejects unknown fields, wrong types and oversized strings', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { isAdmin: true }))
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { marketingOptIn: 'yes' }))
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { firstName: 'x'.repeat(81) }))
    await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { firstName: 42 }))
  })
})

describe('users/{uid}/addresses', () => {
  it('lets the owner manage addresses', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice/addresses/home')))
    await assertSucceeds(
      setDoc(doc(as('alice'), 'users/alice/addresses/work'), {
        ...ADDRESS,
        label: 'Work',
        isDefault: false,
      }),
    )
    await assertSucceeds(
      updateDoc(doc(as('alice'), 'users/alice/addresses/home'), { line2: 'Unit 7' }),
    )
    await assertSucceeds(deleteDoc(doc(as('alice'), 'users/alice/addresses/home')))
    await assertSucceeds(getDocs(collection(as('alice'), 'users/alice/addresses')))
  })
  it('blocks everyone else', async () => {
    await assertFails(getDoc(doc(as('bob'), 'users/alice/addresses/home')))
    await assertFails(getDocs(collection(as(null), 'users/alice/addresses')))
    await assertFails(setDoc(doc(as('bob'), 'users/alice/addresses/evil'), ADDRESS))
    await assertFails(deleteDoc(doc(as('bob'), 'users/alice/addresses/home')))
  })
  it('validates required fields, province length and postal code length', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'users/alice/addresses/bad1'), {
        name: 'A',
        line1: 'x',
        city: 'y',
        province: 'ON',
      }),
    )
    await assertFails(
      setDoc(doc(as('alice'), 'users/alice/addresses/bad2'), { ...ADDRESS, province: 'Ontario' }),
    )
    await assertFails(
      setDoc(doc(as('alice'), 'users/alice/addresses/bad3'), {
        ...ADDRESS,
        postalCode: 'M5V 1E3 extra',
      }),
    )
    await assertFails(
      setDoc(doc(as('alice'), 'users/alice/addresses/bad4'), { ...ADDRESS, secret: 'x' }),
    )
  })
})

describe('users/{uid}/cart', () => {
  it('lets the owner read and write the cart, with a size limit', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice/cart/current')))
    await assertSucceeds(
      setDoc(doc(as('alice'), 'users/alice/cart/current'), {
        lines: [{ sku: 'GT-EAR-001', qty: 2 }],
        promoCode: 'WELCOME10',
        updatedAt: 'now',
      }),
    )
    await assertFails(
      setDoc(doc(as('alice'), 'users/alice/cart/current'), {
        lines: Array.from({ length: 51 }, (_, i) => ({ sku: String(i), qty: 1 })),
      }),
    )
    await assertFails(setDoc(doc(as('alice'), 'users/alice/cart/current'), { lines: 'nope' }))
    await assertFails(getDoc(doc(as('bob'), 'users/alice/cart/current')))
  })
})

describe('customerOrders', () => {
  it('is readable only by the owning uid', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'customerOrders/o1')))
    await assertFails(getDoc(doc(as('bob'), 'customerOrders/o1')))
    await assertFails(getDoc(doc(as(null), 'customerOrders/o1')))
  })
  it('keeps guest orders (uid null) unreadable by any client', async () => {
    await assertFails(getDoc(doc(as('alice'), 'customerOrders/o3')))
    await assertFails(getDoc(doc(as(null), 'customerOrders/o3')))
  })
  it('allows the owner to list their own orders, not everyone elses', async () => {
    const mine = await assertSucceeds(
      getDocs(query(collection(as('alice'), 'customerOrders'), where('uid', '==', 'alice'))),
    )
    expect(mine.docs.map((d) => d.id)).toEqual(['o1'])
    await assertFails(getDocs(collection(as('alice'), 'customerOrders')))
    await assertFails(
      getDocs(query(collection(as('alice'), 'customerOrders'), where('uid', '==', 'bob'))),
    )
    await assertFails(
      getDocs(
        query(collection(as('alice'), 'customerOrders'), where('email', '==', 'guest@example.ca')),
      ),
    )
  })
  it('is never writable from a client, even by the owner', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'customerOrders/new'), { ...ORDER, orderNumber: 'GT-NEW001' }),
    )
    await assertFails(updateDoc(doc(as('alice'), 'customerOrders/o1'), { status: 'refunded' }))
    await assertFails(updateDoc(doc(as('alice'), 'customerOrders/o1'), { uid: 'bob' }))
    await assertFails(deleteDoc(doc(as('alice'), 'customerOrders/o1')))
    await assertFails(setDoc(doc(as(null), 'customerOrders/anon'), ORDER))
    await assertFails(updateDoc(doc(as('alice'), 'customerOrders/o3'), { uid: 'alice' })) // claiming a guest order
  })
})

describe('everything else is denied', () => {
  it('denies unknown collections for everyone', async () => {
    await assertFails(getDoc(doc(as('alice'), 'secrets/x')))
    await assertFails(setDoc(doc(as('alice'), 'admins/alice'), { role: 'admin' }))
    await assertFails(getDoc(doc(as(null), 'config/site')))
  })
})
