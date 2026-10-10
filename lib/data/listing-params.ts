/**
 * Listing URL search params (PRD 6.2): filters are shareable and back-button safe.
 * ?category=earrings,necklaces&finish=gold-tone&colour=black&price=under-10&stock=1&sort=price-asc&page=2
 */
import { COLOUR_FAMILY_ORDER, PRICE_BUCKET_ORDER, SORT_KEYS } from './derive'
import {
  FINISHES,
  type ColourFamily,
  type Finish,
  type ListingFilters,
  type PriceBucket,
  type SortKey,
} from './types'

export const PAGE_SIZE = 24

export interface ListingState extends ListingFilters {
  page: number
}

const list = (v: string | null) =>
  v
    ? v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

export function parseListingParams(params: URLSearchParams): ListingState {
  const sort = params.get('sort') as SortKey | null
  const page = Number.parseInt(params.get('page') ?? '1', 10)
  return {
    category: list(params.get('category')),
    finish: list(params.get('finish')).filter((f): f is Finish => FINISHES.includes(f as Finish)),
    colour: list(params.get('colour')).filter((c): c is ColourFamily =>
      COLOUR_FAMILY_ORDER.includes(c as ColourFamily),
    ),
    price: list(params.get('price')).filter((p): p is PriceBucket =>
      PRICE_BUCKET_ORDER.includes(p as PriceBucket),
    ),
    inStock: params.get('stock') === '1',
    sort: sort && SORT_KEYS.includes(sort) ? sort : 'featured',
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 50) : 1,
  }
}

/** Serialises state, keeping unrelated params (such as `q` on search) intact. */
export function serializeListingParams(state: ListingState, base?: URLSearchParams): string {
  const p = new URLSearchParams(base)
  const setList = (key: string, values?: string[]) =>
    values?.length ? p.set(key, values.join(',')) : p.delete(key)
  setList('category', state.category)
  setList('finish', state.finish)
  setList('colour', state.colour)
  setList('price', state.price)
  if (state.inStock) p.set('stock', '1')
  else p.delete('stock')
  if (state.sort && state.sort !== 'featured') p.set('sort', state.sort)
  else p.delete('sort')
  if (state.page > 1) p.set('page', String(state.page))
  else p.delete('page')
  const s = p.toString()
  return s ? `?${s}` : ''
}

export function activeFilterCount(state: ListingFilters): number {
  return (
    (state.category?.length ?? 0) +
    (state.finish?.length ?? 0) +
    (state.colour?.length ?? 0) +
    (state.price?.length ?? 0) +
    (state.inStock ? 1 : 0)
  )
}
