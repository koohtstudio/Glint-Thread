/**
 * Adapter contract (PRD 8.2). The same assertions run against every adapter: today the local one
 * in CI, and the Sanity one when SANITY_CONTRACT=1 with a seeded dataset (see sanity.contract.test.ts).
 */
import { describe, expect, it } from 'vitest'
import type { DataAdapter } from './types'

export function runAdapterContract(
  name: string,
  factory: () => DataAdapter | Promise<DataAdapter>,
) {
  describe(`${name} adapter contract`, () => {
    let adapter: DataAdapter
    const get = async () => (adapter ??= await factory())

    it('returns active products with integer cent prices and at least one variant and image', async () => {
      const products = await (await get()).getProducts()
      expect(products.length).toBeGreaterThan(0)
      for (const p of products) {
        expect(Number.isInteger(p.priceCents)).toBe(true)
        expect(p.variants.length).toBeGreaterThan(0)
        expect(p.images.length).toBeGreaterThan(0)
        for (const v of p.variants) expect(Number.isInteger(v.priceCents)).toBe(true)
        for (const img of p.images) {
          expect(img.alt.length).toBeGreaterThan(0)
          expect(img.width).toBeGreaterThan(0)
          expect(img.src).toMatch(/^(\/|https:\/\/)/)
        }
        expect(p.minPriceCents).toBeLessThanOrEqual(p.maxPriceCents)
        expect(p.departmentTitle.length).toBeGreaterThan(0)
        expect(p.categoryTitle.length).toBeGreaterThan(0)
      }
    })

    it('never leaks Studio-only fields to the storefront', async () => {
      const products = await (await get()).getProducts()
      for (const p of products) {
        const record = p as unknown as Record<string, unknown>
        expect(record.photoNote).toBeUndefined()
        expect(record.verify).toBeUndefined()
        expect(record.unitCost).toBeUndefined()
        expect(record.unitCostCents).toBeUndefined()
        for (const d of p.details) expect(d).not.toMatch(/verify/i)
      }
    })

    it('finds a product by slug and returns null for an unknown slug', async () => {
      const a = await get()
      const [first] = await a.getProducts()
      expect((await a.getProductBySlug(first.slug))?.slug).toBe(first.slug)
      expect(await a.getProductBySlug('does-not-exist')).toBeNull()
    })

    it('has departments whose product counts add up and categories that belong to them', async () => {
      const a = await get()
      const [products, departments, categories] = await Promise.all([
        a.getProducts(),
        a.getDepartments(),
        a.getCategories(),
      ])
      expect(departments.reduce((n, d) => n + d.productCount, 0)).toBe(products.length)
      const deptSlugs = new Set(departments.map((d) => d.slug))
      for (const c of categories) expect(deptSlugs.has(c.departmentSlug)).toBe(true)
      expect(await a.getCategory('jewellery', 'earrings')).toMatchObject({
        slug: 'earrings',
        departmentSlug: 'jewellery',
      })
      expect(await a.getCategory('hair', 'earrings')).toBeNull()
    })

    it('resolves collections to existing product slugs', async () => {
      const a = await get()
      const slugs = new Set((await a.getProducts()).map((p) => p.slug))
      const collections = await a.getCollections()
      expect(collections.length).toBeGreaterThan(0)
      for (const c of collections) for (const s of c.productSlugs) expect(slugs.has(s)).toBe(true)
      expect(await a.getCollection('nope')).toBeNull()
    })

    it('searches title, tags, category, department and variant names', async () => {
      const a = await get()
      expect((await a.searchProducts('hoops')).length).toBeGreaterThan(0)
      expect((await a.searchProducts('beret')).some((p) => p.slug === 'classic-beret')).toBe(true)
      expect((await a.searchProducts('mustard')).some((p) => p.slug === 'classic-beret')).toBe(true)
      expect(
        (await a.searchProducts('socks')).every(
          (p) => p.departmentSlug === 'socks' || p.tags.includes('socks'),
        ),
      ).toBe(true)
      expect(await a.searchProducts('zzzzqqq')).toEqual([])
    })

    it('returns pricing variants for known SKUs only', async () => {
      const a = await get()
      const [p] = await a.getProducts()
      const map = await a.getVariantsBySku([p.variants[0].sku, 'NOPE'])
      expect(Object.keys(map)).toEqual([p.variants[0].sku])
      expect(map[p.variants[0].sku]).toMatchObject({
        productSlug: p.slug,
        priceCents: p.variants[0].priceCents,
      })
    })

    it('provides settings, home page, pages, care guides, promotions and codes', async () => {
      const a = await get()
      const settings = await a.getSiteSettings()
      expect(settings.freeShippingThresholdCents).toBe(6000)
      expect(settings.shippingMethods.find((m) => m.id === 'standard')?.priceCents).toBe(899)
      const home = await a.getHomePage()
      expect(home.hero.headline).toBe('All the glint.')
      expect(home.edit.productSlugs.length).toBeGreaterThan(0)
      for (const slug of [
        'about',
        'shipping-returns',
        'faq',
        'contact',
        'care',
        'size-guide',
        'privacy',
        'terms',
        'accessibility',
      ])
        expect(await a.getPage(slug)).not.toBeNull()
      expect((await a.getCareGuides()).map((g) => g.slug).sort()).toEqual([
        'bag-care',
        'jewellery-care',
        'textile-care',
        'tool-care',
      ])
      expect((await a.getPromotions()).map((p) => p.id).sort()).toEqual([
        'earrings-b2g1',
        'socks-mix-match',
      ])
      expect((await a.getPromoCodes()).map((c) => c.code)).toContain('WELCOME10')
    })
  })
}
