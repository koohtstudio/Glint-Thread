import { describe, expect, it } from 'vitest'
import { createLocalAdapter } from './local'
import {
  colourFromLabel,
  deriveColours,
  deriveFinishes,
  filterProducts,
  inPriceBucket,
  parseCollectionRule,
  searchList,
  searchScore,
  sortProducts,
  tokenise,
} from './derive'

describe('finishes', () => {
  it('reads tags and variant names', () => {
    expect(deriveFinishes(['gold-tone', 'hoops'])).toEqual(['gold-tone'])
    expect(
      deriveFinishes(['stainless-steel'], ['Sunburst / Silver-Tone', 'North Star / Gold-Tone']),
    ).toEqual(['gold-tone', 'silver-tone', 'stainless-steel'])
    expect(deriveFinishes([])).toEqual([])
  })
})

describe('colours', () => {
  it('maps variant labels to families, finish words first', () => {
    expect(colourFromLabel('Eagle / Gold-Tone')?.family).toBe('gold')
    expect(colourFromLabel('Turquoise Shell / Silver-Tone')?.family).toBe('silver')
    expect(colourFromLabel('Dove Grey')).toMatchObject({ family: 'grey', hex: '#B9B6B0' })
    expect(colourFromLabel('Mustard')?.family).toBe('yellow')
    expect(colourFromLabel('Neon Rainbow')).toMatchObject({ family: 'multi', hex: null })
    expect(colourFromLabel('Smiley Letters')).toBeNull()
    expect(colourFromLabel('Golden Hour')).toBeNull()
  })
  it('falls back to the title for single-variant products and dedupes', () => {
    expect(deriveColours('Emerald Slouch Sling', ['Default']).map((c) => c.family)).toEqual([
      'green',
    ])
    expect(deriveColours('Socks', ['Black', 'Jet Black', 'White']).map((c) => c.label)).toEqual([
      'Black',
      'White',
    ])
  })
})

describe('collection rules', () => {
  it('parses the catalogue rule strings', () => {
    expect(parseCollectionRule('all products, newest first')).toEqual({
      tags: [],
      maxPriceCents: null,
      departments: [],
      sort: 'newest',
    })
    expect(parseCollectionRule('price <= 1500').maxPriceCents).toBe(1500)
    expect(parseCollectionRule('tag fall-edit or winter').tags).toEqual(['fall-edit', 'winter'])
    expect(parseCollectionRule('tag gold-tone department jewellery or hair').departments).toEqual([
      'jewellery',
      'hair',
    ])
  })
})

describe('filters, sort and search over the real catalogue', async () => {
  const products = await createLocalAdapter().getProducts()

  it('filters by category, finish, colour, price and stock', () => {
    expect(
      filterProducts(products, { category: ['earrings'] }).every(
        (p) => p.categorySlug === 'earrings',
      ),
    ).toBe(true)
    expect(filterProducts(products, { finish: ['stainless-steel'] }).map((p) => p.slug)).toEqual([
      'stainless-steel-talisman-pendant',
    ])
    expect(
      filterProducts(products, { colour: ['green'] }).some(
        (p) => p.slug === 'emerald-slouch-sling',
      ),
    ).toBe(true)
    const cheap = filterProducts(products, { price: ['under-10'] })
    expect(cheap.length).toBeGreaterThan(0)
    expect(cheap.every((p) => p.variants.some((v) => v.priceCents < 1000))).toBe(true)
    expect(filterProducts(products, { inStock: true })).toHaveLength(products.length)
    expect(filterProducts(products, {})).toHaveLength(products.length)
  })

  it('buckets prices with inclusive lower bounds', () => {
    expect(inPriceBucket(999, 'under-10')).toBe(true)
    expect(inPriceBucket(1000, '10-20')).toBe(true)
    expect(inPriceBucket(1999, '10-20')).toBe(true)
    expect(inPriceBucket(4499, '40-plus')).toBe(true)
  })

  it('sorts by featured, newest and price, sinking sold-out items', () => {
    const featured = sortProducts(products, 'featured')
    expect(featured[0].featured).toBe(true)
    const asc = sortProducts(products, 'price-asc')
    expect(asc[0].minPriceCents).toBeLessThanOrEqual(asc[asc.length - 1].minPriceCents)
    const desc = sortProducts(products, 'price-desc')
    expect(desc[0].minPriceCents).toBe(4499)
    const newest = sortProducts(products, 'newest')
    expect(newest[0].newness).toBeGreaterThan(newest[newest.length - 1].newness)
    const withSoldOut = [{ ...products[0], soldOut: true }, ...products.slice(1, 4)]
    expect(sortProducts(withSoldOut, 'featured').at(-1)?.slug).toBe(products[0].slug)
  })

  it('searches with stemming, prefixes and all-terms matching', () => {
    expect(tokenise('Hoops & Huggies')).toEqual(['hoop', 'and', 'huggie'])
    expect(searchList(products, 'hoop').length).toBeGreaterThan(2)
    expect(searchList(products, 'bere')[0].slug).toBe('classic-beret')
    expect(searchList(products, 'gold hoops').every((p) => searchScore(p, 'gold hoops') > 0)).toBe(
      true,
    )
    expect(searchList(products, 'socks', 3)).toHaveLength(3)
    expect(searchList(products, '   ')).toEqual([])
    expect(searchList(products, 'beret xyzzy')).toEqual([])
  })
})
