import { getProducts } from '@/lib/data'
import { toSearchItem } from '@/lib/data/derive'

/** Compact product index for the instant-search overlay (PRD 6.5). Static; revalidated with product tags. */
export async function GET() {
  const products = await getProducts()
  return Response.json(products.map(toSearchItem), {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' },
  })
}
