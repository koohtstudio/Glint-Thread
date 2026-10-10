'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { ProductCard as ProductCardData } from '@/lib/data/types'
import { useCart } from '@/lib/cart/store'
import { useQuickAdd } from '@/lib/cart/quick-add'
import { snapshotFor } from '@/lib/cart/snapshot'
import { toast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { cx } from '@/lib/cx'
import { Badge } from '@/components/ui/badge'
import { Price } from '@/components/ui/price'
import { MatImage } from './mat-image'
import { Swatches } from './swatches'

interface Props {
  product: ProductCardData
  sizes?: string
  preload?: boolean
  className?: string
  /** Heading level of the title inside listings. */
  headingLevel?: 'h2' | 'h3'
}

/** Second image, mounted on first mouse hover and faded in once loaded (PRD 4.5: 500ms crossfade). */
function HoverImage({ src, sizes }: { src: string; sizes: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      onLoad={() => setLoaded(true)}
      className={cx(
        'motion-transform bg-ink-800 object-contain opacity-0 transition-[opacity,transform] duration-500 ease-gallery',
        loaded && 'group-hover:scale-[1.03] group-hover:opacity-100',
      )}
    />
  )
}

export const CARD_SIZES = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw'

/**
 * Product card (PRD 4.6): mat 4:5, 12px gap, two-line title, price row, swatches.
 * The title link stretches over the whole card (one link); quick add is a separate button above it.
 */
export function ProductCard({
  product,
  sizes = CARD_SIZES,
  preload,
  className,
  headingLevel = 'h3',
}: Props) {
  const [hovered, setHovered] = useState(false)
  const add = useCart((s) => s.add)
  const openQuickAdd = useQuickAdd((s) => s.open)
  const [primary, secondary] = product.images
  const single = product.variants.length === 1
  const Heading = headingLevel
  const differs = product.minPriceCents !== product.maxPriceCents

  const quickAdd = () => {
    if (single) {
      const v = product.variants[0]
      add(v.sku, 1, snapshotFor(product, v))
      toast(t('toast.added', { title: product.title }))
    } else {
      openQuickAdd(product)
    }
  }

  return (
    <article
      className={cx('group relative flex flex-col', className)}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true)
      }}
    >
      <MatImage
        image={primary}
        sizes={sizes}
        preload={preload}
        imageClassName="transition-transform duration-900 ease-gallery group-hover:scale-[1.03] motion-transform"
        hoverLayer={
          hovered && secondary && !secondary.lowRes ? (
            <HoverImage src={secondary.src} sizes={sizes} />
          ) : null
        }
      >
        {product.soldOut ? (
          <Badge className="absolute top-3 left-3 z-10">{t('product.soldOut')}</Badge>
        ) : product.promotion ? (
          <Badge className="absolute top-3 left-3 z-10">{product.promotion.badge}</Badge>
        ) : null}
        {!product.soldOut ? (
          <button
            type="button"
            onClick={quickAdd}
            className="btn-label absolute inset-x-0 bottom-0 z-20 hidden h-11 translate-y-full items-center justify-center border-t border-line bg-ink-950/90 text-bone-50 transition-[transform,background-color] duration-500 ease-gallery group-focus-within:translate-y-0 group-hover:translate-y-0 hover:bg-bone-50 hover:text-ink-950 focus-visible:translate-y-0 lg:flex"
            aria-label={`${single ? t('product.quickAdd') : t('product.selectOptions')}: ${product.title}`}
          >
            {single ? t('product.quickAdd') : t('product.selectOptions')}
          </button>
        ) : null}
      </MatImage>
      <div className="mt-3 flex flex-col">
        <Heading className="line-clamp-2 text-[14px] leading-[1.4] font-medium text-bone-50">
          <Link
            href={`/products/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-champagne-400"
          >
            {product.title}
          </Link>
        </Heading>
        <div className="mt-1 text-[14px] text-bone-300">
          <Price
            cents={product.priceCents}
            fromCents={differs ? product.minPriceCents : null}
            compareAtCents={product.compareAtPriceCents}
          />
        </div>
        <Swatches colours={product.colours} />
      </div>
    </article>
  )
}
