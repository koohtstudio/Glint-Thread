import 'server-only'
import { requireUser, type SessionUser } from '@/lib/auth/session'
import { features } from '@/lib/env'

/**
 * For signed-in account pages: `null` when accounts aren't set up (the page then shows the "opens soon" note),
 * otherwise the signed-in customer, redirecting to sign-in (and back) when there isn't one.
 */
export async function accountUser(next: string): Promise<SessionUser | null> {
  if (!features.accounts) return null
  return requireUser(next)
}
