import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getCategories, getCollection, getCollections, getProductCardsBySlugs } from '@/lib/data'
import { computeFacets } from '@/lib/data/facets'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { ListingHeader } from '@/components/listing/listing-header'
import { ListingStatic, ListingView } from '@/components/listing/listing-view'
import type { EditorialTile } from '@/components/listing/listing-grid'

/** Every param is prerendered by generateStaticParams, so navigation may block on the cached page. */
export const instant = false

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/collections/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const c = await getCollection(slug)
  if (!c) return {}
  return pageMetadata({ title: c.title, description: c.blurb, path: `/collections/${c.slug}` })
}

export default async function CollectionPage({ params }: PageProps<'/collections/[slug]'>) {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) notFound()
  const [products, categories] = await Promise.all([
    getProductCardsBySlugs(collection.productSlugs),
    getCategories(),
  ])
  const facets = computeFacets(
    products,
    categories.map((c) => ({ slug: c.slug, title: c.title })),
  )
  const tiles: EditorialTile[] = collection.image
    ? [{ image: collection.image, line: collection.blurb }]
    : []
  return (
    <>
      <ListingHeader
        eyebrow={t('nav.collections')}
        title={collection.title}
        blurb={collection.blurb}
        count={products.length}
        crumbs={[
          { name: t('nav.home'), href: '/' },
          { name: collection.title, href: `/collections/${collection.slug}` },
        ]}
      />
      <Suspense fallback={<ListingStatic products={products} facets={facets} tiles={tiles} />}>
        <ListingView products={products} facets={facets} tiles={tiles} />
      </Suspense>
    </>
  )
}
