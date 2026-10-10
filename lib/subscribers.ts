import 'server-only'
import { env } from '@/lib/env'
import {
  CONSENT_TEXT_VERSION,
  CONTACT_PROPERTY_KEYS,
  consentProperties,
  type ConsentRecord,
} from '@/lib/newsletter-config'

export { CONSENT_TEXT_VERSION }
export type { ConsentRecord }

/**
 * Newsletter contacts live only in Resend (PRD 9.7, 9.8), never in Sanity. A confirmed contact gets the CASL
 * consent properties, an opt-in subscription to the Newsletter topic and membership of the Newsletter
 * subscribers segment. Without RESEND_API_KEY the action is logged to the console; with a key but no topic
 * or segment IDs, the contact is still saved and the missing pieces are skipped with a warning
 * (run `npm run setup:resend` to create them).
 */
async function resendClient() {
  const { Resend } = await import('resend')
  return new Resend(env.RESEND_API_KEY)
}
type ResendClient = Awaited<ReturnType<typeof resendClient>>

let propertiesReady: Promise<void> | null = null
/** Creates the consent properties if `setup:resend` has not run; "already exists" errors are ignored. */
function ensureProperties(resend: ResendClient) {
  propertiesReady ??= Promise.all(
    CONTACT_PROPERTY_KEYS.map((key) =>
      resend.contactProperties.create({ key, type: 'string' }).catch(() => null),
    ),
  ).then(() => undefined)
  return propertiesReady
}

function warnIfMissing() {
  if (!env.RESEND_NEWSLETTER_TOPIC_ID)
    console.warn('[newsletter] RESEND_NEWSLETTER_TOPIC_ID is not set: run `npm run setup:resend`')
  if (!env.RESEND_NEWSLETTER_SEGMENT_ID)
    console.warn('[newsletter] RESEND_NEWSLETTER_SEGMENT_ID is not set (optional)')
}

/** Double opt-in confirmed: write the consent record, subscribe to the topic and add to the segment. */
export async function confirmSubscriber(
  email: string,
  consent: ConsentRecord,
): Promise<'confirmed' | 'logged'> {
  const properties = consentProperties(consent)
  if (!env.RESEND_API_KEY) {
    console.info(`[newsletter] (no Resend) confirmed ${email}`, properties)
    return 'logged'
  }
  const resend = await resendClient()
  await ensureProperties(resend)
  warnIfMissing()
  const topicId = env.RESEND_NEWSLETTER_TOPIC_ID
  const segmentId = env.RESEND_NEWSLETTER_SEGMENT_ID

  const created = await resend.contacts.create({
    email,
    unsubscribed: false,
    properties,
    ...(topicId ? { topics: [{ id: topicId, subscription: 'opt_in' as const }] } : {}),
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  })
  if (!created.error) return 'confirmed'

  // The contact already exists (for example a returning subscriber): update, resubscribe and re-add.
  const updated = await resend.contacts.update({ email, unsubscribed: false, properties })
  if (updated.error) console.error('[newsletter] could not update Resend contact', updated.error)
  if (topicId) {
    const t = await resend.contacts.topics.update({
      email,
      topics: [{ id: topicId, subscription: 'opt_in' }],
    })
    if (t.error) console.error('[newsletter] could not subscribe to topic', t.error)
  }
  if (segmentId) {
    const s = await resend.contacts.segments.add({ email, segmentId })
    if (s.error) console.error('[newsletter] could not add to segment', s.error)
  }
  return 'confirmed'
}

/** Unsubscribe from the Newsletter topic; with no topic ID configured, fall back to a global unsubscribe. */
export async function unsubscribe(email: string) {
  if (!env.RESEND_API_KEY) {
    console.info(`[newsletter] (no Resend) unsubscribed ${email}`)
    return
  }
  const resend = await resendClient()
  const topicId = env.RESEND_NEWSLETTER_TOPIC_ID
  const res = topicId
    ? await resend.contacts.topics.update({
        email,
        topics: [{ id: topicId, subscription: 'opt_out' }],
      })
    : await resend.contacts.update({ email, unsubscribed: true })
  if (res.error) console.error('[newsletter] could not unsubscribe', res.error)
}

/** Removes the Resend contact entirely (account deletion, PIPEDA). */
export async function deleteContact(email: string) {
  if (!env.RESEND_API_KEY) {
    console.info(`[newsletter] (no Resend) deleted contact ${email}`)
    return
  }
  const resend = await resendClient()
  const res = await resend.contacts.remove({ email })
  if (res.error && res.error.statusCode !== 404)
    console.error('[newsletter] could not delete contact', res.error)
}
