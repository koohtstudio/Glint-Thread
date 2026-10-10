/**
 * Public (browser-safe) configuration. Each variable is referenced literally so Next inlines it.
 */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  sanityProjectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  sanityDataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    authEmulatorHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || '',
    googleEnabled: process.env.NEXT_PUBLIC_AUTH_GOOGLE === '1',
  },
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  sanityApiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-01',
}

export function absoluteUrl(path = '/'): string {
  return `${publicEnv.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/** True when the public Firebase config is present, so account UI can show (the server also needs the Admin SDK). */
export const accountsConfigured = Boolean(
  publicEnv.firebase.apiKey &&
  publicEnv.firebase.authDomain &&
  publicEnv.firebase.projectId &&
  publicEnv.firebase.appId,
)
