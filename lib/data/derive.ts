/**
 * Pure derivation helpers shared by both data adapters and by client-side listing filters.
 * No Node or Next imports: this module is safe in client components.
 */
import type {
  ColourFamily,
  ColourSwatch,
  CollectionRule,
  Finish,
  ListingFilters,
  PriceBucket,
  Product,
  ProductCard,
  SortKey,
} from './types'
import type { Promotion } from '@/lib/pricing/types'

// ---------- Finishes (PRD 6.2: derived from tags) ----------

const FINISH_TAGS: Record<string, Finish> = {
  'gold-tone': 'gold-tone',
  'silver-tone': 'silver-tone',
  'two-tone': 'two-tone',
  'stainless-steel': 'stainless-steel',
}

export function deriveFinishes(tags: string[], variantTitles: string[] = []): Finish[] {
  const found = new Set<Finish>()
  for (const tag of tags) if (FINISH_TAGS[tag]) found.add(FINISH_TAGS[tag])
  for (const title of variantTitles) {
    const s = title.toLowerCase()
    if (/\bgold-tone\b/.test(s)) found.add('gold-tone')
    if (/\bsilver-tone\b/.test(s)) found.add('silver-tone')
    if (/\btwo-tone\b/.test(s)) found.add('two-tone')
  }
  return (['gold-tone', 'silver-tone', 'two-tone', 'stainless-steel'] as Finish[]).filter((f) =>
    found.has(f),
  )
}

// ---------- Colours (PRD 6.2: derived from variant names) ----------

type ColourEntry = [pattern: string, family: ColourFamily, hex: string | null]

/** Ordered: finishes first, then multi-word names, then single words. First match wins. */
const COLOUR_VOCAB: ColourEntry[] = [
  ['gold-tone', 'gold', '#C9A96E'],
  ['silver-tone', 'silver', '#BFC1C2'],
  ['pastel mix', 'multi', null],
  ['neon rainbow', 'multi', null],
  ['rainbow', 'multi', null],
  ['assorted', 'multi', null],
  ['pearl pastel', 'white', '#EDE6DA'],
  ['sunset ombré', 'orange', '#E08A5C'],
  ['holiday tartan', 'red', '#8E2430'],
  ['oatmeal plaid', 'neutral', '#CDBFA6'],
  ['pink houndstooth', 'pink', '#E3A9B5'],
  ['black & white check', 'black', '#151413'],
  ['charcoal red plaid', 'red', '#6B2A2E'],
  ['lime textured weave', 'green', '#B8C94A'],
  ['pink star teddy', 'pink', '#E7B7C4'],
  ['navy pin dot', 'blue', '#1F2A44'],
  ['teddy check', 'brown', '#8A6A4F'],
  ['gold sequin', 'gold', '#C9A96E'],
  ['pink glitter', 'pink', '#E7A6C0'],
  ['amber tortoise', 'brown', '#9A5B2B'],
  ['dove grey', 'grey', '#B9B6B0'],
  ['sky blue', 'blue', '#8FB8DE'],
  ['royal blue', 'blue', '#2E4FA8'],
  ['denim blue', 'blue', '#4A6A8A'],
  ['mint green', 'green', '#A8D5BA'],
  ['blush pink', 'pink', '#E8B4B8'],
  ['blush taupe', 'neutral', '#B49C8C'],
  ['cherry red', 'red', '#A3182B'],
  ['snow white', 'white', '#F4F1EA'],
  ['jet black', 'black', '#151413'],
  ['black', 'black', '#151413'],
  ['white', 'white', '#F4F1EA'],
  ['ivory', 'white', '#EFE8D8'],
  ['cream', 'white', '#EFE6D2'],
  ['grey', 'grey', '#8E8C88'],
  ['gray', 'grey', '#8E8C88'],
  ['charcoal', 'grey', '#3D3C3A'],
  ['graphite', 'grey', '#4A4946'],
  ['beige', 'neutral', '#D8C7A8'],
  ['taupe', 'neutral', '#8B7D6B'],
  ['latte', 'neutral', '#C8AD8D'],
  ['oatmeal', 'neutral', '#CDBFA6'],
  ['champagne', 'neutral', '#D9C4A0'],
  ['linen', 'neutral', '#D9CDB4'],
  ['camel', 'brown', '#B08A5A'],
  ['toffee', 'brown', '#8A5A3A'],
  ['mocha', 'brown', '#6F4E37'],
  ['bronze', 'brown', '#8C6A3F'],
  ['tortoiseshell', 'brown', '#7A4A26'],
  ['rust', 'orange', '#A4492A'],
  ['blush', 'pink', '#E8B4B8'],
  ['fuchsia', 'pink', '#C2185B'],
  ['pink', 'pink', '#E8A6B8'],
  ['coral', 'orange', '#EE7F6D'],
  ['burgundy', 'red', '#6D1F2B'],
  ['ruby', 'red', '#9B111E'],
  ['cherry', 'red', '#A3182B'],
  ['strawberry', 'red', '#C8243A'],
  ['watermelon', 'pink', '#E05A6A'],
  ['red', 'red', '#B3202C'],
  ['orange', 'orange', '#E8833A'],
  ['mustard', 'yellow', '#C99A2E'],
  ['yellow', 'yellow', '#E8C547'],
  ['banana', 'yellow', '#F0D46A'],
  ['emerald', 'green', '#1F6B4A'],
  ['olive', 'green', '#6B6B3A'],
  ['mint', 'green', '#A8D5BA'],
  ['lime', 'green', '#B8C94A'],
  ['avocado', 'green', '#6E8B3D'],
  ['green', 'green', '#3F7D4E'],
  ['navy', 'blue', '#1F2A44'],
  ['aqua', 'blue', '#6CC5C9'],
  ['turquoise', 'blue', '#3FB8AF'],
  ['blue', 'blue', '#3A5BA0'],
  ['lilac', 'purple', '#C8A2C8'],
  ['purple', 'purple', '#6B4E8A'],
  ['silver', 'silver', '#BFC1C2'],
  ['gold', 'gold', '#C9A96E'],
]

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const COLOUR_PATTERNS = COLOUR_VOCAB.map(
  ([word, family, hex]) =>
    [new RegExp(`(^|[^a-z])${escapeRe(word)}([^a-z]|$)`), family, hex] as const,
)

export function colourFromLabel(label: string): ColourSwatch | null {
  const s = label.toLowerCase()
  for (const [re, family, hex] of COLOUR_PATTERNS) {
    if (re.test(s)) return { family, label, hex }
  }
  return null
}

export const COLOUR_FAMILY_LABELS: Record<ColourFamily, string> = {
  black: 'Black',
  white: 'White & cream',
  grey: 'Grey',
  neutral: 'Neutral',
  brown: 'Brown',
  pink: 'Pink',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  gold: 'Gold-tone',
  silver: 'Silver-tone',
  multi: 'Multicolour',
}

export const COLOUR_FAMILY_ORDER = Object.keys(COLOUR_FAMILY_LABELS) as ColourFamily[]

/**
 * Colours for a product: one swatch per distinct variant colour. Single-variant products fall back
 * to the product title ("Emerald Slouch Sling") so the colour filter still finds them.
 */
export function deriveColours(title: string, variantTitles: string[]): ColourSwatch[] {
  const sources =
    variantTitles.length === 1 && variantTitles[0] === 'Default' ? [title] : variantTitles
  const seen = new Set<string>()
  const out: ColourSwatch[] = []
  for (const label of sources) {
    const swatch = colourFromLabel(label)
    if (!swatch) continue
    const key = `${swatch.family}:${swatch.hex}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(swatch)
  }
  return out
}

// ---------- Collections ----------

/** Parses the human-readable rules in products.json ("tag a or b", "price <= 1500", "all products, newest first"). */
export function parseCollectionRule(rule: string): CollectionRule {
  const s = rule.trim().toLowerCase()
  const parsed: CollectionRule = {
    tags: [],
    maxPriceCents: null,
    departments: [],
    sort: 'featured',
  }
  if (s.includes('newest')) parsed.sort = 'newest'
  const price = s.match(/price\s*<=\s*(\d+)/)
  if (price) parsed.maxPriceCents = Number(price[1])
  const tags = s.match(/^tags?\s+(.+)$/)
  if (tags)
    parsed.tags = tags[1]
      .split(/\s+or\s+|,\s*/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  const dept = s.match(/department\s+([a-z0-9-]+(?:\s+or\s+[a-z0-9-]+)*)/)
  if (dept) parsed.departments = dept[1].split(/\s+or\s+/)
  return parsed
}

export function matchesCollectionRule(
  product: Pick<Product, 'tags' | 'minPriceCents' | 'departmentSlug'>,
  rule: CollectionRule,
): boolean {
  if (rule.tags.length && !rule.tags.some((tag) => product.tags.includes(tag))) return false
  if (rule.maxPriceCents !== null && product.minPriceCents > rule.maxPriceCents) return false
  if (rule.departments.length && !rule.departments.includes(product.departmentSlug)) return false
  return true
}

// ---------- Promotions, final sale, children's items ----------

export function promotionFor(
  product: { slug: string; categorySlug: string; excludedFromPromotions: boolean },
  promotions: Promotion[],
): Promotion | null {
  if (product.excludedFromPromotions) return null
  return (
    promotions.find(
      (p) =>
        p.active &&
        p.appliesTo.categories.includes(product.categorySlug) &&
        !(p.appliesTo.excludeSlugs ?? []).includes(product.slug),
    ) ?? null
  )
}

/** PRD 11.1: earrings and ear cuffs, the Mystery Trio, hair ties, beauty tools, and anything marked final sale. */
const FINAL_SALE_CATEGORIES = ['earrings', 'hair-ties', 'beauty-tools']
export function isFinalSale(product: {
  categorySlug: string
  tags: string[]
  finalSale?: boolean | null
}): boolean {
  if (typeof product.finalSale === 'boolean') return product.finalSale
  return FINAL_SALE_CATEGORIES.includes(product.categorySlug) || product.tags.includes('final-sale')
}

/** PRD 12.8: children's items carry a small-parts warning until verified. */
export function needsChildWarning(tags: string[]): boolean {
  return tags.includes('kids')
}

// ---------- Listing filters and sort (PRD 6.2) ----------

export const PRICE_BUCKETS: Record<PriceBucket, [min: number, maxExclusive: number]> = {
  'under-10': [0, 1000],
  '10-20': [1000, 2000],
  '20-40': [2000, 4000],
  '40-plus': [4000, Number.POSITIVE_INFINITY],
}
export const PRICE_BUCKET_ORDER: PriceBucket[] = ['under-10', '10-20', '20-40', '40-plus']
export const SORT_KEYS: SortKey[] = ['featured', 'newest', 'price-asc', 'price-desc']

type Filterable = Pick<
  ProductCard,
  | 'categorySlug'
  | 'finishes'
  | 'colours'
  | 'variants'
  | 'soldOut'
  | 'featured'
  | 'newness'
  | 'minPriceCents'
  | 'title'
>

export function inPriceBucket(cents: number, bucket: PriceBucket): boolean {
  const [min, max] = PRICE_BUCKETS[bucket]
  return cents >= min && cents < max
}

export function filterProducts<T extends Filterable>(products: T[], filters: ListingFilters): T[] {
  return products.filter((p) => {
    if (filters.category?.length && !filters.category.includes(p.categorySlug)) return false
    if (filters.finish?.length && !filters.finish.some((f) => p.finishes.includes(f))) return false
    if (filters.colour?.length && !p.colours.some((c) => filters.colour!.includes(c.family)))
      return false
    if (
      filters.price?.length &&
      !p.variants.some((v) => filters.price!.some((b) => inPriceBucket(v.priceCents, b)))
    )
      return false
    if (filters.inStock && p.soldOut) return false
    return true
  })
}

/** Sorts a copy. Fully sold-out products always sink to the end (PRD 9.5). */
export function sortProducts<T extends Filterable>(products: T[], sort: SortKey = 'featured'): T[] {
  const indexed = products.map((p, i) => ({ p, i }))
  const cmp = (a: { p: T; i: number }, b: { p: T; i: number }): number => {
    if (a.p.soldOut !== b.p.soldOut) return a.p.soldOut ? 1 : -1
    switch (sort) {
      case 'newest':
        return b.p.newness - a.p.newness || a.i - b.i
      case 'price-asc':
        return a.p.minPriceCents - b.p.minPriceCents || a.p.title.localeCompare(b.p.title)
      case 'price-desc':
        return b.p.minPriceCents - a.p.minPriceCents || a.p.title.localeCompare(b.p.title)
      default:
        return Number(b.p.featured) - Number(a.p.featured) || a.i - b.i
    }
  }
  return indexed.sort(cmp).map(({ p }) => p)
}

// ---------- Search (PRD 6.5) ----------

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const stem = (w: string) =>
  w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w

export function tokenise(s: string): string[] {
  return normalise(s).split(' ').filter(Boolean).map(stem)
}

type Searchable = Pick<
  Product,
  | 'title'
  | 'tags'
  | 'categoryTitle'
  | 'departmentTitle'
  | 'variants'
  | 'categorySlug'
  | 'departmentSlug'
>

/** Scores a product for a query: title 4, category/department 3, tag 2, variant 1. All terms must match. */
export function searchScore(product: Searchable, query: string): number {
  const terms = tokenise(query)
  if (!terms.length) return 0
  const fields: [string[], number][] = [
    [tokenise(product.title), 4],
    [
      tokenise(
        `${product.categoryTitle} ${product.departmentTitle} ${product.categorySlug} ${product.departmentSlug}`,
      ),
      3,
    ],
    [product.tags.flatMap(tokenise), 2],
    [product.variants.flatMap((v) => tokenise(v.title)), 1],
  ]
  let total = 0
  for (const term of terms) {
    let best = 0
    for (const [words, weight] of fields) {
      if (words.some((w) => w === term)) best = Math.max(best, weight)
      else if (term.length >= 2 && words.some((w) => w.startsWith(term)))
        best = Math.max(best, weight * 0.75)
    }
    if (best === 0) return 0
    total += best
  }
  return total
}

export function searchList<T extends Searchable>(
  products: T[],
  query: string,
  limit?: number,
): T[] {
  const scored = products
    .map((p, i) => ({ p, i, s: searchScore(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.p)
  return typeof limit === 'number' ? scored.slice(0, limit) : scored
}

// ---------- Cards ----------

/** Strips long-form fields so client components receive a small payload. */
export function toCard(product: Product): ProductCard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { description, details, careGuideSlug, seo, ...card } = product
  return { ...card, images: card.images.slice(0, 2) }
}
