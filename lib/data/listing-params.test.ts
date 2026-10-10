import { describe, expect, it } from 'vitest'
import { activeFilterCount, parseListingParams, serializeListingParams } from './listing-params'

describe('listing params', () => {
  it('parses and validates', () => {
    const s = parseListingParams(
      new URLSearchParams(
        'category=earrings,necklaces&finish=gold-tone,bogus&colour=black&price=under-10&stock=1&sort=price-asc&page=2',
      ),
    )
    expect(s).toEqual({
      category: ['earrings', 'necklaces'],
      finish: ['gold-tone'],
      colour: ['black'],
      price: ['under-10'],
      inStock: true,
      sort: 'price-asc',
      page: 2,
    })
    expect(parseListingParams(new URLSearchParams('sort=nope&page=-3')).sort).toBe('featured')
    expect(parseListingParams(new URLSearchParams('page=abc')).page).toBe(1)
  })
  it('round-trips and keeps other params', () => {
    const base = new URLSearchParams('q=hoops')
    const state = parseListingParams(new URLSearchParams('finish=gold-tone&sort=newest'))
    const out = serializeListingParams(state, base)
    expect(out).toBe('?q=hoops&finish=gold-tone&sort=newest')
    expect(serializeListingParams({ ...state, finish: [], sort: 'featured', page: 1 }, base)).toBe(
      '?q=hoops',
    )
    expect(serializeListingParams({ page: 1 })).toBe('')
  })
  it('counts active filters', () => {
    expect(activeFilterCount({ category: ['a'], finish: ['gold-tone'], inStock: true })).toBe(3)
    expect(activeFilterCount({})).toBe(0)
  })
})
