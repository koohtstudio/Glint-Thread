import { getCollection, getCollections, getProductCardsBySlugs } from '@/lib/data'
import { OG_SIZE, matCard } from '@/lib/og'

export const alt = 'A Glint & Thread collection'
export const size = OG_SIZE
export const contentType = 'image/png'

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ slug: c.slug }))
}

/** Collection OG image (PRD 13): the lead product on the mat, generated with opengraph-image.tsx. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = await getCollection(slug)
  const [lead] = c ? await getProductCardsBySlugs(c.productSlugs.slice(0, 6)) : []
  const image = c?.image ?? lead?.images.find((i) => !i.lowRes) ?? lead?.images[0]
  return matCard({
    eyebrow: 'Collection',
    title: c?.title ?? 'Glint & Thread',
    line: c?.blurb,
    imageSrc: image?.src ?? null,
  })
}
