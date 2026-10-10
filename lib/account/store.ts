import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import type { Address, AddressInput, CartDoc, Profile } from './types'

/** Firestore access for the signed-in customer's private data (server only, Admin SDK, PRD 10.1). */
const user = (uid: string) => adminDb().collection('users').doc(uid)

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await user(uid).get()
  return snap.exists ? (snap.data() as Profile) : null
}

export async function saveProfile(uid: string, patch: Partial<Profile>): Promise<void> {
  await user(uid).set(patch, { merge: true })
}

/** Creates the profile on first sign-in; never overwrites an existing one. */
export async function ensureProfile(
  uid: string,
  email: string,
  defaults: Partial<Profile> = {},
): Promise<Profile> {
  const existing = await getProfile(uid)
  if (existing) return existing
  const profile: Profile = {
    firstName: '',
    lastName: '',
    phone: '',
    marketingOptIn: false,
    ...defaults,
    email,
    createdAt: new Date().toISOString(),
  }
  await user(uid).set(profile)
  return profile
}

export async function listAddresses(uid: string): Promise<Address[]> {
  const snap = await user(uid).collection('addresses').get()
  const all = snap.docs.map((d) => ({
    ...(d.data() as Omit<Address, 'id'>),
    id: d.id,
    isDefault: d.data().isDefault === true,
  }))
  return all.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name),
  )
}

/** Create (id null) or update an address. The first address is always the default; making one default clears the rest. */
export async function saveAddress(
  uid: string,
  id: string | null,
  input: AddressInput,
  makeDefault: boolean,
): Promise<Address> {
  const col = user(uid).collection('addresses')
  const existing = await listAddresses(uid)
  const current = id ? existing.find((a) => a.id === id) : undefined
  if (id && !current) throw new Error('not_found')
  const ref = id ? col.doc(id) : col.doc()
  // An address that is already the default stays the default until another one is chosen.
  const isDefault = makeDefault || existing.length === 0 || Boolean(current?.isDefault)
  const batch = adminDb().batch()
  if (isDefault)
    for (const other of existing)
      if (other.id !== ref.id && other.isDefault)
        batch.update(col.doc(other.id), { isDefault: false })
  const now = new Date().toISOString()
  batch.set(
    ref,
    { ...input, isDefault, updatedAt: now, ...(id ? {} : { createdAt: now }) },
    { merge: true },
  )
  await batch.commit()
  return { id: ref.id, ...input, isDefault }
}

export async function deleteAddress(uid: string, id: string): Promise<void> {
  const col = user(uid).collection('addresses')
  const existing = await listAddresses(uid)
  const target = existing.find((a) => a.id === id)
  if (!target) throw new Error('not_found')
  const batch = adminDb().batch()
  batch.delete(col.doc(id))
  // Deleting the default promotes another address so there is always one default.
  if (target.isDefault) {
    const next = existing.find((a) => a.id !== id)
    if (next) batch.update(col.doc(next.id), { isDefault: true })
  }
  await batch.commit()
}

export async function getCart(uid: string): Promise<CartDoc | null> {
  const snap = await user(uid).collection('cart').doc('current').get()
  return snap.exists ? (snap.data() as CartDoc) : null
}

export async function putCart(uid: string, cart: Omit<CartDoc, 'updatedAt'>): Promise<void> {
  await user(uid)
    .collection('cart')
    .doc('current')
    .set({ ...cart, updatedAt: new Date().toISOString() })
}

/** Deletes the profile and everything under it (addresses, cart). */
export async function deleteUserData(uid: string): Promise<void> {
  await adminDb().recursiveDelete(user(uid))
}
