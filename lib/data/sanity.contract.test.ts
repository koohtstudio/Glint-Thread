/**
 * Runs the shared adapter contract against a real, seeded Sanity dataset.
 * Skipped unless SANITY_CONTRACT=1 and Sanity env vars are present (no network in CI by default).
 */
import { createClient } from '@sanity/client'
import { describe, it } from 'vitest'
import { runAdapterContract } from './contract'
import { createSanityAdapter } from './sanity'

const enabled =
  process.env.SANITY_CONTRACT === '1' && Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)

if (enabled) {
  runAdapterContract('sanity', () =>
    createSanityAdapter(
      createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-10-01',
        token: process.env.SANITY_API_READ_TOKEN,
        useCdn: false,
      }),
    ),
  )
} else {
  describe('sanity adapter contract', () => {
    it.skip('set SANITY_CONTRACT=1 with Sanity env vars to run against a seeded dataset', () => {})
  })
}
