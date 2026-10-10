import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { env } from '@/lib/env'
import { tagsForDocument } from '@/lib/revalidate-tags'

/**
 * Sanity webhook (PRD 8.5): on create, update and delete of product, category, collection, settings,
 * page and homePage. Projection to configure in Sanity: {_type, "slug": slug.current}.
 * Signature checked with SANITY_REVALIDATE_SECRET via next-sanity/webhook.
 */
export async function POST(request: NextRequest) {
  if (!env.SANITY_REVALIDATE_SECRET)
    return Response.json({ error: 'not_configured' }, { status: 503 })
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string; slug?: string | null }>(
      request,
      env.SANITY_REVALIDATE_SECRET,
      true,
    )
    if (!isValidSignature) return Response.json({ error: 'invalid_signature' }, { status: 401 })
    const tags = tagsForDocument(body)
    if (!tags.length) return Response.json({ revalidated: false, reason: 'no matching tags' })
    // Webhooks are outside Server Actions, so expire immediately rather than serve stale (Next 16 docs).
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    return Response.json({ revalidated: true, tags })
  } catch (err) {
    console.error('[revalidate] failed', err)
    return Response.json({ error: 'failed' }, { status: 500 })
  }
}
