/**
 * The storefront's only data entry point (PRD 8.2). Picks the adapter from DATA_SOURCE and wraps
 * reads in `use cache` with tags so the Sanity webhook can revalidate them (PRD 8.5).
 * Stock-sensitive reads used by quote and checkout (getVariantsBySku, promo codes) are never cached.
 */
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { env } from '@/lib/env'
import { toCard } from './derive'
import { createLocalAdapter } from './local'
import type { DataAdapter, Product, ProductCard } from './types'

export * from './types'

let adapterInstance: Promise<DataAdapter> | null = null

export function getAdapter(): Promise<DataAdapter> {
  if (!adapterInstance) {
    adapterInstance =
      env.dataSource === 'sanity'
        ? import('./sanity').then((m) => m.createSanityAdapter())
        : Promise.resolve(createLocalAdapter({ defaultStock: env.DEV_DEFAULT_STOCK }))
  }
  return adapterInstance
}

export const dataSource = env.dataSource

export async function getProducts(): Promise<Product[]> {
  'use cache'
  cacheLife('max')
  cacheTag('product')
  return (await getAdapter()).getProducts()
}

export async function getProductCards(): Promise<ProductCard[]> {
  'use cache'
  cacheLife('max')
  cacheTag('product')
  return (await getProducts()).map(toCard)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  'use cache'
  cacheLife('max')
  cacheTag('product', `product:${slug}`)
  return (await getAdapter()).getProductBySlug(slug)
}

export async function getProductCardsBySlugs(slugs: string[]): Promise<ProductCard[]> {
  'use cache'
  cacheLife('max')
  cacheTag('product')
  const bySlug = new Map((await getProductCards()).map((p) => [p.slug, p]))
  return slugs.map((s) => bySlug.get(s)).filter((p): p is ProductCard => Boolean(p))
}

export async function getDepartments() {
  'use cache'
  cacheLife('max')
  cacheTag('department', 'product')
  return (await getAdapter()).getDepartments()
}

export async function getDepartment(slug: string) {
  'use cache'
  cacheLife('max')
  cacheTag('department', `department:${slug}`)
  return (await getAdapter()).getDepartment(slug)
}

export async function getCategories() {
  'use cache'
  cacheLife('max')
  cacheTag('category', 'product')
  return (await getAdapter()).getCategories()
}

export async function getCategory(departmentSlug: string, categorySlug: string) {
  'use cache'
  cacheLife('max')
  cacheTag('category', `category:${categorySlug}`)
  return (await getAdapter()).getCategory(departmentSlug, categorySlug)
}

export async function getCollections() {
  'use cache'
  cacheLife('max')
  cacheTag('collection', 'product')
  return (await getAdapter()).getCollections()
}

export async function getCollection(slug: string) {
  'use cache'
  cacheLife('max')
  cacheTag('collection', `collection:${slug}`, 'product')
  return (await getAdapter()).getCollection(slug)
}

export async function searchProducts(query: string): Promise<ProductCard[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('product')
  return (await (await getAdapter()).searchProducts(query)).map(toCard)
}

export async function getSiteSettings() {
  'use cache'
  cacheLife('max')
  cacheTag('settings')
  return (await getAdapter()).getSiteSettings()
}

export async function getHomePage() {
  'use cache'
  cacheLife('max')
  cacheTag('homePage')
  return (await getAdapter()).getHomePage()
}

export async function getPage(slug: string) {
  'use cache'
  cacheLife('max')
  cacheTag('page', `page:${slug}`)
  return (await getAdapter()).getPage(slug)
}

export async function getPages() {
  'use cache'
  cacheLife('max')
  cacheTag('page')
  return (await getAdapter()).getPages()
}

export async function getCareGuide(slug: string) {
  'use cache'
  cacheLife('max')
  cacheTag('careGuide')
  return (await getAdapter()).getCareGuide(slug)
}

export async function getCareGuides() {
  'use cache'
  cacheLife('max')
  cacheTag('careGuide')
  return (await getAdapter()).getCareGuides()
}

/** Fresh, uncached: used by /api/quote and /api/checkout so prices and stock are never stale. */
export async function getVariantsBySku(skus: string[]) {
  return (await getAdapter()).getVariantsBySku(skus)
}

export async function getPromotions() {
  return (await getAdapter()).getPromotions()
}

export async function getPromoCodes() {
  return (await getAdapter()).getPromoCodes()
}
