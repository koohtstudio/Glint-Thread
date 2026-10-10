import { getProductBySlug, getProducts } from '@/lib/data'
import { formatMoney } from '@/lib/format'
import { OG_SIZE, matCard } from '@/lib/og'

export const alt = 'A Glint & Thread product on its mat'
export const size = OG_SIZE
export const contentType = 'image/png'

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }))
}

/** Product OG image (PRD 13): the product image on the mat. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  const image = p?.images.find((i) => !i.lowRes) ?? p?.images[0]
  const price = p
    ? p.minPriceCents !== p.maxPriceCents
      ? `From ${formatMoney(p.minPriceCents)}`
      : formatMoney(p.priceCents)
    : ''
  return matCard({
    eyebrow: p?.categoryTitle ?? 'Glint & Thread',
    title: p?.title ?? 'Glint & Thread',
    line: price,
    imageSrc: image?.src ?? null,
  })
}
