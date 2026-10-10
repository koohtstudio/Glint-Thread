import { describe, expect, it } from 'vitest'
import raw from '@/catalog/products.json'
import { runAdapterContract } from './contract'
import { createLocalAdapter, loadCatalog, publicDetails } from './local'

runAdapterContract('local', () => createLocalAdapter({ defaultStock: 10 }))

describe('local adapter specifics', () => {
  it('validates the shipped catalogue: 64 products, 179 variants', () => {
    const catalog = loadCatalog()
    expect(catalog.products).toHaveLength(64)
    expect(catalog.products.flatMap((p) => p.variants)).toHaveLength(179)
  })

  it('rejects an invalid catalogue with a readable message', () => {
    const broken = structuredClone(raw) as { products: { priceCents: unknown }[] }
    broken.products[0].priceCents = 11.99
    expect(() => loadCatalog(broken)).toThrow(/products\.0\.priceCents/)
  })

  it('rejects a product whose category belongs to another department', () => {
    const broken = structuredClone(raw) as { products: { category: string }[] }
    broken.products[0].category = 'socks-nope'
    expect(() => loadCatalog(broken)).toThrow(/category/)
  })

  it('applies DEV_DEFAULT_STOCK to null stock', async () => {
    const a = createLocalAdapter({ defaultStock: 4 })
    const p = await a.getProductBySlug('golden-hour-textured-hoops')
    expect(p?.variants[0].stock).toBe(4)
    const zero = createLocalAdapter({ defaultStock: 0 })
    const sold = await zero.getProductBySlug('golden-hour-textured-hoops')
    expect(sold?.soldOut).toBe(true)
    expect(sold?.variants[0].available).toBe(false)
  })

  it('marks small crops as low resolution', async () => {
    const p = await createLocalAdapter().getProductBySlug('oversized-open-heart-earrings')
    expect(p?.images[0].lowRes).toBe(true)
    expect(p?.images[1].lowRes).toBe(false)
    expect(p?.images[0].blurDataURL).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('derives promotions, final sale and child warnings', async () => {
    const a = createLocalAdapter()
    expect((await a.getProductBySlug('strawberry-ankle-socks'))?.promotion?.id).toBe(
      'socks-mix-match',
    )
    expect((await a.getProductBySlug('golden-hour-textured-hoops'))?.promotion?.id).toBe(
      'earrings-b2g1',
    )
    expect((await a.getProductBySlug('mystery-earring-trio'))?.promotion).toBeNull()
    expect((await a.getProductBySlug('golden-hour-textured-hoops'))?.finalSale).toBe(true)
    expect((await a.getProductBySlug('classic-beret'))?.finalSale).toBe(false)
    expect((await a.getProductBySlug('pop-up-ear-bunny-hat'))?.childWarning).toBe(true)
  })

  it('resolves the collection rules from products.json', async () => {
    const a = createLocalAdapter()
    const products = await a.getProducts()
    const under15 = await a.getCollection('under-15')
    expect(under15?.productSlugs.length).toBeGreaterThan(0)
    for (const slug of under15!.productSlugs)
      expect(products.find((p) => p.slug === slug)!.minPriceCents).toBeLessThanOrEqual(1500)
    const fall = await a.getCollection('fall-edit')
    expect(fall?.productSlugs).toContain('corduroy-baker-boy-cap')
    const talismans = await a.getCollection('talismans')
    expect(talismans?.productSlugs.sort()).toEqual([
      'evil-eye-charm-bracelet',
      'stainless-steel-talisman-pendant',
    ])
    const newIn = await a.getCollection('new-in')
    expect(newIn?.productSlugs).toHaveLength(products.length)
  })

  it('strips internal verify notes from details', () => {
    expect(
      publicDetails(['One pair', 'Fibre content: see verify', 'Approx. 8 cm diameter (verify)']),
    ).toEqual(['One pair'])
  })
})
