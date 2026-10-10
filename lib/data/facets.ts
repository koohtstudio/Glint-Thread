import { COLOUR_FAMILY_ORDER, PRICE_BUCKET_ORDER, inPriceBucket } from './derive'
import {
  FINISHES,
  type ColourFamily,
  type Finish,
  type PriceBucket,
  type ProductCard,
} from './types'

export interface Facets {
  categories: { slug: string; title: string }[]
  finishes: Finish[]
  colours: ColourFamily[]
  prices: PriceBucket[]
}

/** Filter options built from the products actually in a listing, so empty options never show. */
export function computeFacets(
  products: ProductCard[],
  categories: { slug: string; title: string }[] = [],
): Facets {
  const cats = new Set(products.map((p) => p.categorySlug))
  const fin = new Set(products.flatMap((p) => p.finishes))
  const col = new Set(products.flatMap((p) => p.colours.map((c) => c.family)))
  return {
    categories: categories.filter((c) => cats.has(c.slug)),
    finishes: FINISHES.filter((f) => fin.has(f)),
    colours: COLOUR_FAMILY_ORDER.filter((c) => col.has(c)),
    prices: PRICE_BUCKET_ORDER.filter((b) =>
      products.some((p) => p.variants.some((v) => inPriceBucket(v.priceCents, b))),
    ),
  }
}
