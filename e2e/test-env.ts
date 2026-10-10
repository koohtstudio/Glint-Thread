import { loadEnvFiles } from '../scripts/load-env'

/**
 * The hermetic environment for QA servers and the Playwright run. Stripe test keys come from `.env.local`
 * (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`); everything else is pinned so a test run never
 * touches the real Sanity dataset, Resend account or Firebase project:
 *  - local catalogue, no Sanity, no Resend (emails are logged to the server console),
 *  - Firebase Auth and Firestore emulators with the demo project `demo-glint` (`npm run emulators`),
 *  - a known webhook secret, so specs can deliver signed `payment_intent.*` events themselves,
 *  - TAX_MODE=table with a placeholder GST/HST number, so tax lines show.
 */
loadEnvFiles()

export const PORT = Number(process.env.E2E_PORT ?? 3100)
export const WEBHOOK_SECRET = 'whsec_e2e_glint_and_thread'
export const EMULATOR_AUTH = '127.0.0.1:9099'
export const EMULATOR_FIRESTORE = '127.0.0.1:8080'

export const testEnv: Record<string, string> = {
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  DATA_SOURCE: 'local',
  NEXT_PUBLIC_SANITY_PROJECT_ID: '',
  SANITY_API_READ_TOKEN: '',
  SANITY_API_WRITE_TOKEN: '',
  SANITY_REVALIDATE_SECRET: '',
  RESEND_API_KEY: '',
  RESEND_NEWSLETTER_TOPIC_ID: '',
  RESEND_NEWSLETTER_SEGMENT_ID: '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  FIREBASE_AUTH_EMULATOR_HOST: EMULATOR_AUTH,
  FIRESTORE_EMULATOR_HOST: EMULATOR_FIRESTORE,
  FIREBASE_ADMIN_PROJECT_ID: 'demo-glint',
  FIREBASE_ADMIN_CLIENT_EMAIL: '',
  FIREBASE_ADMIN_PRIVATE_KEY: '',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-glint.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-glint',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:glintdemo',
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: EMULATOR_AUTH,
  TAX_MODE: 'table',
  GST_HST_NUMBER: '123456789RT0001',
  EMAIL_HASH_SALT: 'e2e-only-salt',
  OWNER_EMAIL: '',
  // Own build output, so a test build never clobbers `npm run dev`.
  NEXT_DIST_DIR: '.next-e2e',
}
