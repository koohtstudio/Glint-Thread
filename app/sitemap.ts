import type { MetadataRoute } from 'next'
import { getCategories, getCollections, getDepartments, getPages, getProducts } from '@/lib/data'
import { absoluteUrl } from '@/lib/public-env'

/** Sitemap (PRD 13): products, departments, categories, collections and content pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, departments, categories, collections, pages] = await Promise.all([
    getProducts(),
    getDepartments(),
    getCategories(),
    getCollections(),
    getPages(),
  ])
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/shop'), changeFrequency: 'weekly', priority: 0.8 },
    ...departments.map((d) => ({
      url: absoluteUrl(`/shop/${d.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...categories
      .filter((c) => c.productCount > 0)
      .map((c) => ({
        url: absoluteUrl(`/shop/${c.departmentSlug}/${c.slug}`),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ...collections.map((c) => ({
      url: absoluteUrl(`/collections/${c.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      images: p.images.slice(0, 3).map((i) => absoluteUrl(i.src)),
    })),
    ...pages.map((p) => ({
      url: absoluteUrl(`/${p.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
    { url: absoluteUrl('/order-status'), changeFrequency: 'yearly', priority: 0.2 },
  ]
}
