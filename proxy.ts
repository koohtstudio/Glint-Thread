import { NextResponse, type NextRequest } from 'next/server'
import { isKnownPath, type RouteIndex } from '@/lib/route-index'

/**
 * Returns a real 404 status for unknown product, collection, shop and content-page slugs.
 * With Cache Components, unknown params would otherwise stream a 200 with the not-found UI
 * (Next 16 docs: "A request-time check can run in Proxy before the page renders").
 */
let cached: { at: number; index: RouteIndex } | null = null
const TTL_MS = 60_000

async function routeIndex(origin: string): Promise<RouteIndex | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.index
  try {
    const res = await fetch(`${origin}/api/route-index`, { headers: { 'x-from-proxy': '1' } })
    if (!res.ok) return cached?.index ?? null
    cached = { at: Date.now(), index: (await res.json()) as RouteIndex }
    return cached.index
  } catch {
    return cached?.index ?? null
  }
}

export async function proxy(request: NextRequest) {
  const index = await routeIndex(request.nextUrl.origin)
  if (!index || isKnownPath(request.nextUrl.pathname, index)) return NextResponse.next()
  // A two-segment path no route matches renders the branded root not-found with a 404 status.
  return NextResponse.rewrite(new URL('/__not-found/page', request.url), { status: 404 })
}

export const config = {
  matcher: [
    '/products/:path*',
    '/collections/:path*',
    '/shop/:path*',
    // Single-segment content pages, excluding app routes, assets and metadata files.
    '/((?!api|_next|studio|catalog|dev|shop|products|collections|search|bag|checkout|order-status|newsletter|icon|apple-icon|opengraph-image|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|favicon\\.ico)[^/.]+)',
  ],
}
