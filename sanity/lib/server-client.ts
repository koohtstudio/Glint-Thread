import 'server-only'
import { createClient, type SanityClient } from '@sanity/client'
import { env } from '@/lib/env'

/** Server-side Sanity clients. Tokens never leave the server (PRD 13). */
let readClient: SanityClient | null = null
let writeClient: SanityClient | null = null

function base() {
  if (!env.NEXT_PUBLIC_SANITY_PROJECT_ID) throw new Error('Sanity is not configured (NEXT_PUBLIC_SANITY_PROJECT_ID is missing)')
  return {
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  }
}

/** Published content; uses the CDN unless a read token is set. */
export function sanityReadClient(): SanityClient {
  readClient ??= createClient({
    ...base(),
    useCdn: !env.SANITY_API_READ_TOKEN,
    token: env.SANITY_API_READ_TOKEN,
    perspective: 'published',
  })
  return readClient
}

/** Orders, stock and subscribers. Requires SANITY_API_WRITE_TOKEN. */
export function sanityWriteClient(): SanityClient {
  if (!env.SANITY_API_WRITE_TOKEN) throw new Error('SANITY_API_WRITE_TOKEN is not set')
  writeClient ??= createClient({ ...base(), useCdn: false, token: env.SANITY_API_WRITE_TOKEN, perspective: 'raw' })
  return writeClient
}
