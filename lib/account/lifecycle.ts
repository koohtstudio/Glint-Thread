import 'server-only'
import { confirmSubscriber } from '@/lib/subscribers'
import { linkGuestOrders } from './customer-orders'
import { ensureProfile, saveProfile } from './store'
import type { SessionUser } from '@/lib/auth/session'

/**
 * Run after every successful sign-in (PRD 9.9): make sure a profile exists, then, only for a verified email,
 * link past guest orders and send any pending marketing opt-in to Resend (so sign-up opt-in acts as double opt-in).
 */
export async function afterSignIn(user: SessionUser): Promise<{ linkedOrders: number }> {
  if (!user.email) return { linkedOrders: 0 }
  const profile = await ensureProfile(user.uid, user.email.toLowerCase())
  if (!user.emailVerified) return { linkedOrders: 0 }
  const linkedOrders = await linkGuestOrders(user.uid, user.email)
  if (profile.marketingOptIn && !profile.marketingSyncedAt && profile.marketingConsentAt) {
    await confirmSubscriber(user.email.toLowerCase(), {
      consentTextVersion: profile.marketingConsentVersion ?? 'unknown',
      consentAt: profile.marketingConsentAt,
      signupSource: profile.marketingConsentSource ?? 'account',
    })
    await saveProfile(user.uid, { marketingSyncedAt: new Date().toISOString() })
  }
  return { linkedOrders }
}
