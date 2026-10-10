import 'server-only'
import { env, features } from '@/lib/env'

/**
 * Newsletter subscribers (PRD 9.7). Stored in Sanity as `subscriber` documents with the exact consent
 * wording and time (CASL). Contacts are added to a Resend segment after confirmation.
 */
export interface SubscriberInput {
  email: string
  consentText: string
  source: string
}

const idFor = (email: string) =>
  `subscriber.${Buffer.from(email.toLowerCase()).toString('base64url')}`

async function client() {
  const { sanityWriteClient } = await import('@/sanity/lib/server-client')
  return sanityWriteClient()
}

export async function upsertPendingSubscriber(input: SubscriberInput) {
  if (!features.sanityWrite) {
    console.info(`[newsletter] (no Sanity) pending subscriber ${input.email} from ${input.source}`)
    return
  }
  const now = new Date().toISOString()
  await (
    await client()
  )
    .transaction()
    .createIfNotExists({
      _id: idFor(input.email),
      _type: 'subscriber',
      email: input.email.toLowerCase(),
      status: 'pending',
    })
    .patch(idFor(input.email), (p) =>
      p
        .set({ consentText: input.consentText, consentAt: now, source: input.source })
        .setIfMissing({ status: 'pending' }),
    )
    .commit()
}

export async function confirmSubscriber(email: string): Promise<'confirmed' | 'already'> {
  let state: 'confirmed' | 'already' = 'confirmed'
  if (features.sanityWrite) {
    const sanity = await client()
    const doc = await sanity.getDocument<{ status: string }>(idFor(email))
    if (doc?.status === 'confirmed') state = 'already'
    await sanity
      .transaction()
      .createIfNotExists({
        _id: idFor(email),
        _type: 'subscriber',
        email: email.toLowerCase(),
        status: 'pending',
      })
      .patch(idFor(email), (p) =>
        p.set({ status: 'confirmed', confirmedAt: new Date().toISOString() }),
      )
      .commit()
  }
  if (env.RESEND_API_KEY && state === 'confirmed') {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(env.RESEND_API_KEY)
      await resend.contacts.create({
        email,
        unsubscribed: false,
        ...(env.RESEND_AUDIENCE_ID ? { segments: [{ id: env.RESEND_AUDIENCE_ID }] } : {}),
      })
    } catch (err) {
      console.error('[newsletter] could not add Resend contact', err)
    }
  }
  return state
}

export async function unsubscribe(email: string) {
  if (features.sanityWrite) {
    await (
      await client()
    )
      .patch(idFor(email))
      .set({ status: 'unsubscribed', unsubscribedAt: new Date().toISOString() })
      .commit()
      .catch(() => null)
  }
  if (env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      await new Resend(env.RESEND_API_KEY).contacts.update({ email, unsubscribed: true })
    } catch (err) {
      console.error('[newsletter] could not unsubscribe Resend contact', err)
    }
  }
}
