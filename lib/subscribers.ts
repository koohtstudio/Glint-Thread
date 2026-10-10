import 'server-only'
import { env } from '@/lib/env'

/**
 * Newsletter contacts live only in Resend (PRD 9.7, 9.8): never in Sanity. The CASL consent record
 * (consent text version, timestamp, source) is stored as properties on the Resend contact.
 * Without RESEND_API_KEY the contact is logged to the console instead.
 */
export const CONSENT_VERSION = 'newsletter-consent-v1'

export interface ConsentRecord {
  consentVersion: string
  consentAt: string
  source: string
}

const PROPERTIES = ['consent_version', 'consent_at', 'consent_source', 'confirmed_at'] as const

async function resendClient() {
  const { Resend } = await import('resend')
  return new Resend(env.RESEND_API_KEY)
}

let propertiesReady: Promise<void> | null = null
/** Creates the custom contact properties once per process; "already exists" errors are ignored. */
function ensureProperties(resend: Awaited<ReturnType<typeof resendClient>>) {
  propertiesReady ??= Promise.all(
    PROPERTIES.map((key) =>
      resend.contactProperties.create({ key, type: 'string' }).catch(() => null),
    ),
  ).then(() => undefined)
  return propertiesReady
}

/** Called from the double opt-in confirm link: adds or updates the contact with its consent record. */
export async function confirmSubscriber(
  email: string,
  consent: ConsentRecord,
): Promise<'confirmed' | 'logged'> {
  const properties = {
    consent_version: consent.consentVersion,
    consent_at: consent.consentAt,
    consent_source: consent.source,
    confirmed_at: new Date().toISOString(),
  }
  if (!env.RESEND_API_KEY) {
    console.info(`[newsletter] (no Resend) confirmed ${email}`, properties)
    return 'logged'
  }
  const resend = await resendClient()
  await ensureProperties(resend)
  const created = await resend.contacts.create({
    email,
    unsubscribed: false,
    properties,
    ...(env.RESEND_AUDIENCE_ID ? { segments: [{ id: env.RESEND_AUDIENCE_ID }] } : {}),
  })
  if (created.error) {
    // Existing contact: update consent and resubscribe.
    const updated = await resend.contacts.update({ email, unsubscribed: false, properties })
    if (updated.error) console.error('[newsletter] could not save Resend contact', updated.error)
  }
  return 'confirmed'
}

export async function unsubscribe(email: string) {
  if (!env.RESEND_API_KEY) {
    console.info(`[newsletter] (no Resend) unsubscribed ${email}`)
    return
  }
  const resend = await resendClient()
  const res = await resend.contacts.update({ email, unsubscribed: true })
  if (res.error) console.error('[newsletter] could not unsubscribe Resend contact', res.error)
}
