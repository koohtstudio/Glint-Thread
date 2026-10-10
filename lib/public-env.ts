/**
 * Public (browser-safe) configuration. Each variable is referenced literally so Next inlines it.
 */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  sanityProjectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  sanityDataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  sanityApiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-01',
}

export function absoluteUrl(path = '/'): string {
  return `${publicEnv.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}
