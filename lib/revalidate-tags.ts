/** Maps a changed Sanity document to the cache tags it affects (PRD 8.5). Pure, for testing. */
export function tagsForDocument(body: { _type?: string; slug?: string | null } | null): string[] {
  if (!body?._type) return []
  const slug = body.slug ?? null
  switch (body._type) {
    case 'product':
      return [
        'product',
        ...(slug ? [`product:${slug}`] : []),
        'collection',
        'department',
        'category',
        'homePage',
      ]
    case 'department':
      return [
        'department',
        'category',
        'product',
        'homePage',
        ...(slug ? [`department:${slug}`] : []),
      ]
    case 'category':
      return ['category', 'product', ...(slug ? [`category:${slug}`] : [])]
    case 'collection':
      return ['collection', 'homePage', ...(slug ? [`collection:${slug}`] : [])]
    case 'promotion':
    case 'promoCode':
      return ['product']
    case 'siteSettings':
      return ['settings']
    case 'homePage':
      return ['homePage']
    case 'page':
      return ['page', ...(slug ? [`page:${slug}`] : [])]
    case 'careGuide':
      return ['careGuide']
    default:
      return []
  }
}
