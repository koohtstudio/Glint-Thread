'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProductCard as ProductCardData } from '@/lib/data/types'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { ProductCard } from '@/components/product/product-card'
import { t } from '@/lib/i18n'

/**
 * Horizontal scroller with CSS scroll-snap (PRD 6.1.3): a visible next-card peek on mobile,
 * arrow buttons on desktop. No carousel library.
 */
export function EditScroller({
  products,
  labelledBy,
  heading,
}: {
  products: ProductCardData[]
  labelledBy: string
  heading: React.ReactNode
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div className="container-x mb-8 flex items-end justify-between gap-6 lg:mb-12">
        {heading}
        <div className="hidden shrink-0 gap-2 lg:flex">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={edges.start}
            aria-label={t('a11y.scrollLeft')}
            aria-controls="edit-scroller"
            className="flex size-11 items-center justify-center rounded-xs border border-line-strong text-bone-50 transition-colors hover:border-bone-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={edges.end}
            aria-label={t('a11y.scrollRight')}
            aria-controls="edit-scroller"
            className="flex size-11 items-center justify-center rounded-xs border border-line-strong text-bone-50 transition-colors hover:border-bone-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <ul
        id="edit-scroller"
        ref={ref}
        aria-labelledby={labelledBy}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 min-[1440px]:scroll-px-[calc((100vw-1440px)/2+40px)] min-[1440px]:px-[calc((100vw-1440px)/2+40px)] sm:scroll-px-6 sm:px-6 md:gap-5 lg:scroll-px-10 lg:gap-6 lg:px-10"
      >
        {products.map((p) => (
          <li
            key={p.slug}
            className="w-[68vw] shrink-0 snap-start sm:w-[40vw] md:w-[30vw] lg:w-[calc((min(100vw,1440px)-80px-72px)/4.4)]"
          >
            <ProductCard
              product={p}
              sizes="(min-width: 1024px) 300px, (min-width: 768px) 30vw, 68vw"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
