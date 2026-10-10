import 'server-only'
import Stripe from 'stripe'
import { env } from '@/lib/env'

let client: Stripe | null = null

/** Stripe client, or null when STRIPE_SECRET_KEY is missing (checkout then shows "Checkout opens soon"). */
export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    appInfo: { name: 'Glint & Thread storefront' },
    maxNetworkRetries: 2,
  })
  return client
}

/** "3 to 7 business days" -> { min: 3, max: 7 } for Stripe delivery estimates. */
export function parseEta(eta: string): { min: number; max: number } | null {
  const nums = eta.match(/\d+/g)?.map(Number) ?? []
  if (!nums.length) return null
  return { min: nums[0], max: nums[1] ?? nums[0] }
}
