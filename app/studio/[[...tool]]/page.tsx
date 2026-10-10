import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity/sanity.config'
import { isConfigured } from '@/sanity/env'

export { metadata, viewport } from 'next-sanity/studio'

/** Embedded Sanity Studio (PRD 5.3), noindex. Shows setup steps until Sanity env vars exist. */
export default function StudioPage() {
  if (!isConfigured) {
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 560 }}>
          <p className="eyebrow">Studio</p>
          <h1 className="t-h1" style={{ marginTop: 16 }}>
            Connect Sanity to open the Studio.
          </h1>
          <p style={{ marginTop: 24, color: 'var(--color-bone-300)' }}>
            Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN
            in .env.local, run <code>npm run seed</code>, then reload this page. The storefront
            keeps working from the local catalogue meanwhile.
          </p>
        </div>
      </main>
    )
  }
  return <NextStudio config={config} />
}
