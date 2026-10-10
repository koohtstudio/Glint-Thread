import 'server-only'
import { createHash } from 'node:crypto'
import { env } from '@/lib/env'

/**
 * Salted SHA-256 of the lowercased email (PRD 9.8). Orders in Sanity store only this hash, used to match
 * order-status lookups and first-order code checks without keeping the email itself.
 */
const DEV_SALT = 'glint-and-thread-dev-only-salt'

export function emailSalt(): string {
  if (env.EMAIL_HASH_SALT) return env.EMAIL_HASH_SALT
  if (env.NODE_ENV === 'production')
    console.warn('[privacy] EMAIL_HASH_SALT is not set; using the development salt')
  return DEV_SALT
}

export function hashEmail(email: string, salt = emailSalt()): string {
  return createHash('sha256').update(`${salt}:${email.trim().toLowerCase()}`).digest('hex')
}
