/**
 * Resend newsletter objects (Resend replaced Audiences with global Contacts, Segments, Topics and Properties).
 * Shared by the app (lib/subscribers.ts) and `npm run setup:resend`; no server-only imports here.
 */
export const NEWSLETTER_TOPIC_NAME = 'Newsletter'
export const NEWSLETTER_TOPIC_DESCRIPTION =
  'New small-batch drops and offers from Glint & Thread. Subscribers opted in with express consent (CASL).'
export const NEWSLETTER_SEGMENT_NAME = 'Newsletter subscribers'

/** Version label of the consent checkbox wording (messages/en-CA.json `newsletter.consent`). Bump when the wording changes. */
export const CONSENT_TEXT_VERSION = 'newsletter-consent-v1'

/** CASL consent record, stored as custom properties on the Resend contact (never in Sanity, PRD 9.8). */
export const CONTACT_PROPERTY_KEYS = [
  'consent_text_version',
  'consent_at',
  'signup_source',
  'confirmed_at',
] as const
export type ContactPropertyKey = (typeof CONTACT_PROPERTY_KEYS)[number]

export interface ConsentRecord {
  consentTextVersion: string
  consentAt: string
  signupSource: string
}

export function consentProperties(
  consent: ConsentRecord,
  confirmedAt = new Date().toISOString(),
): Record<ContactPropertyKey, string> {
  return {
    consent_text_version: consent.consentTextVersion,
    consent_at: consent.consentAt,
    signup_source: consent.signupSource,
    confirmed_at: confirmedAt,
  }
}
