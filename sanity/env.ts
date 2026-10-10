/** Studio configuration from public env vars (the Studio runs in the browser). */
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  'not-configured'
export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production'
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-01'
export const isConfigured = projectId !== 'not-configured'
