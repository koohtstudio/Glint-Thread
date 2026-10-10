'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ProductCard } from '@/lib/data/types'
import { formatMoney } from '@/lib/format'
import { t } from '@/lib/i18n'

const KEY = 'gt-recent-v1'
const MAX = 8

interface Viewed {
  slug: string
  title: string
  minPriceCents: number
  maxPriceCents: number
  image: { src: string; alt: string; width: number; lowRes: boolean; blurDataURL?: string } | null
}

function read(): Viewed[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Viewed[]) : []
    return Array.isArray(parsed) ? parsed.filter((v) => v && typeof v.slug === 'string') : []
  } catch {
    return []
  }
}

/** Records a product view (PRD 6.3: localStorage, try/catch, max 8). */
export function rememberViewed(p: ProductCard) {
  try {
    const img = p.images[0]
    const entry: Viewed = {
      slug: p.slug,
      title: p.title,
      minPriceCents: p.minPriceCents,
      maxPriceCents: p.maxPriceCents,
      image: img
        ? {
            src: img.src,
            alt: img.alt,
            width: img.width,
            lowRes: img.lowRes,
            blurDataURL: img.blurDataURL,
          }
        : null,
    }
    const next = [entry, ...read().filter((v) => v.slug !== p.slug)].slice(0, MAX)
    window.localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('gt-recent'))
  } catch {
    /* storage unavailable: recently viewed simply stays empty */
  }
}

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [items, setItems] = useState<Viewed[]>([])

  useEffect(() => {
    const load = () => setItems(read().filter((v) => v.slug !== currentSlug))
    load()
    window.addEventListener('gt-recent', load)
    return () => window.removeEventListener('gt-recent', load)
  }, [currentSlug])

  if (!items.length) return null
  return (
    <section aria-labelledby="recent-title" className="border-t border-line pt-16 lg:pt-24">
      <h2 id="recent-title" className="t-h3">
        {t('product.recentlyViewed')}
      </h2>
      <ul className="mt-8 no-scrollbar flex snap-x gap-4 overflow-x-auto md:gap-5 lg:gap-6">
        {items.map((v) => (
          <li
            key={v.slug}
            className="w-[38vw] shrink-0 snap-start sm:w-[24vw] lg:w-[calc((100%-120px)/6)]"
          >
            <Link href={`/products/${v.slug}`} className="group block">
              <div className="mat aspect-[4/5]">
                {v.image ? (
                  <div className="mat-inner">
                    <Image
                      src={v.image.src}
                      alt=""
                      fill
                      sizes={
                        v.image.lowRes ? `${v.image.width}px` : '(min-width: 1024px) 200px, 38vw'
                      }
                      placeholder={v.image.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={v.image.blurDataURL}
                      className="object-contain"
                    />
                  </div>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-2 text-[13px] leading-snug font-medium group-hover:text-champagne-400">
                {v.title}
              </p>
              <p className="price mt-0.5 text-[13px] text-bone-300">
                {v.minPriceCents !== v.maxPriceCents ? 'From ' : ''}
                {formatMoney(v.minPriceCents)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
