import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import type { ProductCard as ProductCardData } from '@/lib/data/types'
import { ProductCard } from '@/components/product/product-card'

export interface EditorialTile {
  image: { src: string; alt: string; blurDataURL?: string }
  line: string
  href?: string
}

export const LISTING_CARD_SIZES = '(min-width: 1280px) 23vw, (min-width: 768px) 31vw, 47vw'

/**
 * Listing grid (PRD 4.9, 6.2): 2 columns under 768, 3 to 1279, 4 from 1280.
 * After every 8th product an editorial tile spans 2 columns: a full-bleed image and one serif line.
 */
export function ListingGrid({
  products,
  tiles,
  firstEager = 4,
}: {
  products: ProductCardData[]
  tiles: EditorialTile[]
  firstEager?: number
}) {
  return (
    <ul className="grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 md:gap-y-12 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-14">
      {products.map((p, i) => {
        const tile = tiles.length && i > 0 && i % 8 === 0 ? tiles[(i / 8 - 1) % tiles.length] : null
        return (
          <Fragment key={p.slug}>
            {tile ? (
              <li className="col-span-2">
                <EditorialTileView tile={tile} />
              </li>
            ) : null}
            <li>
              <ProductCard
                product={p}
                sizes={LISTING_CARD_SIZES}
                preload={i < Math.min(firstEager, 2)}
                headingLevel="h2"
              />
            </li>
          </Fragment>
        )
      })}
    </ul>
  )
}

function EditorialTileView({ tile }: { tile: EditorialTile }) {
  const body = (
    <figure className="flex h-full flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-950 md:aspect-auto md:min-h-0 md:flex-1">
        <Image
          src={tile.image.src}
          alt={tile.image.alt}
          fill
          sizes="(min-width: 1280px) 46vw, (min-width: 768px) 62vw, 94vw"
          placeholder={tile.image.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={tile.image.blurDataURL}
          className="motion-transform object-cover transition-transform duration-900 ease-gallery group-hover:scale-[1.03]"
        />
      </div>
      <figcaption className="mt-3 font-serif text-[22px] leading-tight text-bone-50 md:text-[26px]">
        {tile.line}
      </figcaption>
    </figure>
  )
  return tile.href ? (
    <Link href={tile.href} className="group block h-full">
      {body}
    </Link>
  ) : (
    body
  )
}
