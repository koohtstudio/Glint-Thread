import { describe, expect, it } from 'vitest'
import { tagsForDocument } from './revalidate-tags'

describe('tagsForDocument', () => {
  it('maps document types to cache tags', () => {
    expect(tagsForDocument({ _type: 'product', slug: 'classic-beret' })).toContain(
      'product:classic-beret',
    )
    expect(tagsForDocument({ _type: 'siteSettings' })).toEqual(['settings'])
    expect(tagsForDocument({ _type: 'page', slug: 'faq' })).toEqual(['page', 'page:faq'])
    expect(tagsForDocument({ _type: 'order' })).toEqual([])
    expect(tagsForDocument(null)).toEqual([])
  })
})
