import { describe, expect, it } from 'vitest'
import { isKnownPath } from './route-index'

const index = {
  products: ['classic-beret'],
  collections: ['fall-edit'],
  shop: { jewellery: ['earrings'] },
  pages: ['about'],
}

describe('isKnownPath', () => {
  it('accepts known routes', () => {
    for (const p of [
      '/products/classic-beret',
      '/collections/fall-edit',
      '/shop',
      '/shop/jewellery',
      '/shop/jewellery/earrings',
      '/about',
    ])
      expect(isKnownPath(p, index), p).toBe(true)
  })
  it('rejects unknown slugs', () => {
    for (const p of [
      '/products/nope',
      '/products/classic-beret/x',
      '/collections/nope',
      '/shop/nope',
      '/shop/jewellery/nope',
      '/shop/jewellery/earrings/x',
      '/nope',
    ])
      expect(isKnownPath(p, index), p).toBe(false)
  })
})
