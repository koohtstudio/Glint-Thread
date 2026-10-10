import { getCategories, getCollections, getPages, getProducts } from '@/lib/data'

/**
 * Valid slugs for proxy.ts, so unknown URLs get a real 404 status before streaming starts
 * (Next 16 streams a 200 for unknown params otherwise). Static, refreshed with the data tags.
 */
export async function GET() {
  const [products, collections, categories, pages] = await Promise.all([
    getProducts(),
    getCollections(),
    getCategories(),
    getPages(),
  ])
  const shop: Record<string, string[]> = {}
  for (const c of categories) (shop[c.departmentSlug] ??= []).push(c.slug)
  return Response.json({
    products: products.map((p) => p.slug),
    collections: collections.map((c) => c.slug),
    shop,
    pages: pages.map((p) => p.slug),
  })
}
