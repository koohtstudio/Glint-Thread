import { z } from 'zod'

/**
 * Environment schema (PRD 8.4). Every variable is optional so the store runs with zero accounts.
 * This module has no `server-only` guard so scripts and tests can import it; app code imports `lib/env.ts`.
 */
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  DATA_SOURCE: z.enum(['local', 'sanity']).optional(),
  NEXT_PUBLIC_SANITY_PROJECT_ID: optional,
  NEXT_PUBLIC_SANITY_DATASET: z.string().default('production'),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().default('2026-10-01'),
  SANITY_API_READ_TOKEN: optional,
  SANITY_API_WRITE_TOKEN: optional,
  SANITY_REVALIDATE_SECRET: optional,
  STRIPE_SECRET_KEY: optional,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,
  TAX_MODE: z.enum(['none', 'table']).default('none'),
  GST_HST_NUMBER: optional,
  NEXT_PUBLIC_FIREBASE_API_KEY: optional,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: optional,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: optional,
  NEXT_PUBLIC_FIREBASE_APP_ID: optional,
  NEXT_PUBLIC_AUTH_GOOGLE: optional,
  FIREBASE_ADMIN_PROJECT_ID: optional,
  FIREBASE_ADMIN_CLIENT_EMAIL: optional,
  FIREBASE_ADMIN_PRIVATE_KEY: optional,
  FIREBASE_AUTH_EMULATOR_HOST: optional,
  FIRESTORE_EMULATOR_HOST: optional,
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: optional,
  RESEND_API_KEY: optional,
  RESEND_NEWSLETTER_TOPIC_ID: optional,
  RESEND_NEWSLETTER_SEGMENT_ID: optional,
  EMAIL_FROM: z.string().default('Glint & Thread <orders@example.ca>'),
  OWNER_EMAIL: optional,
  EMAIL_HASH_SALT: optional,
  DEV_DEFAULT_STOCK: z.coerce.number().int().min(0).default(10),
})

export type Env = z.infer<typeof envSchema> & {
  /** Resolved data source: `sanity` only when requested and a project ID exists. */
  dataSource: 'local' | 'sanity'
  features: {
    sanity: boolean
    sanityWrite: boolean
    stripe: boolean
    stripeWebhook: boolean
    email: boolean
    /** Public Firebase config present: account links and pages are shown. */
    accountsUi: boolean
    /** Admin SDK usable (service account, or emulators): server routes can work. */
    firebaseAdmin: boolean
    /** Accounts fully available: public config and Admin SDK. */
    accounts: boolean
    google: boolean
    emulators: boolean
  }
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  // Treat empty strings as unset so a copied .env.example parses cleanly.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v !== ''),
  )
  const result = envSchema.safeParse(cleaned)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid environment variables: ${issues}`)
  }
  const e = result.data
  const hasSanity = Boolean(e.NEXT_PUBLIC_SANITY_PROJECT_ID)
  const accountsUi = Boolean(
    e.NEXT_PUBLIC_FIREBASE_API_KEY &&
    e.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    e.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    e.NEXT_PUBLIC_FIREBASE_APP_ID,
  )
  const emulators = Boolean(e.FIREBASE_AUTH_EMULATOR_HOST && e.FIRESTORE_EMULATOR_HOST)
  const firebaseAdmin =
    Boolean(
      e.FIREBASE_ADMIN_PROJECT_ID && e.FIREBASE_ADMIN_CLIENT_EMAIL && e.FIREBASE_ADMIN_PRIVATE_KEY,
    ) ||
    (emulators && Boolean(e.FIREBASE_ADMIN_PROJECT_ID || e.NEXT_PUBLIC_FIREBASE_PROJECT_ID))
  const wantsSanity = e.DATA_SOURCE ? e.DATA_SOURCE === 'sanity' : hasSanity
  return {
    ...e,
    // Private keys pasted into hosting dashboards usually carry literal \n sequences and wrapping quotes.
    FIREBASE_ADMIN_PRIVATE_KEY: e.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/^"|"$/g, '').replace(
      /\\n/g,
      '\n',
    ),
    dataSource: wantsSanity && hasSanity ? 'sanity' : 'local',
    features: {
      sanity: hasSanity,
      sanityWrite: hasSanity && Boolean(e.SANITY_API_WRITE_TOKEN),
      stripe: Boolean(e.STRIPE_SECRET_KEY),
      stripeWebhook: Boolean(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET),
      email: Boolean(e.RESEND_API_KEY),
      accountsUi,
      firebaseAdmin,
      accounts: accountsUi && firebaseAdmin,
      google: e.NEXT_PUBLIC_AUTH_GOOGLE === '1',
      emulators,
    },
  }
}
