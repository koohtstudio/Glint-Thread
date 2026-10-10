import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'

/**
 * Signed, stateless tokens for newsletter confirm and unsubscribe links (CASL, PRD 9.7).
 * Secret: NEWSLETTER_TOKEN_SECRET, else ADMIN_ACTION_SECRET; a dev-only fallback outside production.
 */
function secret(): string {
  const s = process.env.NEWSLETTER_TOKEN_SECRET || env.ADMIN_ACTION_SECRET
  if (s) return s
  if (env.NODE_ENV === 'production')
    console.warn('[tokens] Set NEWSLETTER_TOKEN_SECRET or ADMIN_ACTION_SECRET in production')
  return 'glint-and-thread-dev-only-secret'
}

export function signToken(purpose: 'confirm' | 'unsubscribe', email: string): string {
  return createHmac('sha256', secret())
    .update(`${purpose}:${email.trim().toLowerCase()}`)
    .digest('base64url')
    .slice(0, 32)
}

export function verifyToken(
  purpose: 'confirm' | 'unsubscribe',
  email: string,
  token: string,
): boolean {
  const expected = Buffer.from(signToken(purpose, email))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** Constant-time comparison for shared secrets (admin actions, revalidation). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
