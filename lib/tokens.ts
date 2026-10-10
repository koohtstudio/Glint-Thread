import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { emailSalt } from '@/lib/email-hash'

/**
 * Signed, stateless tokens for newsletter confirm and unsubscribe links (CASL, PRD 9.7).
 * The key is derived from EMAIL_HASH_SALT with a separate purpose label, so no extra secret is needed.
 */
function key(): Buffer {
  return createHash('sha256').update(`newsletter-token-key:${emailSalt()}`).digest()
}

/** `payload` binds extra signed fields (for example the consent timestamp and source) to the token. */
export function signToken(purpose: 'confirm' | 'unsubscribe', email: string, payload = ''): string {
  return createHmac('sha256', key())
    .update(`${purpose}:${email.trim().toLowerCase()}:${payload}`)
    .digest('base64url')
    .slice(0, 32)
}

export function verifyToken(
  purpose: 'confirm' | 'unsubscribe',
  email: string,
  token: string,
  payload = '',
): boolean {
  const expected = Buffer.from(signToken(purpose, email, payload))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
