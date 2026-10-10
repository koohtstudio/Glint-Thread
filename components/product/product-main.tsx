'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ProductCard } from '@/lib/data/types'
import { useCart } from '@/lib/cart/store'
import { snapshotFor } from '@/lib/cart/snapshot'
import { formatMoney } from '@/lib/format'
import { t } from '@/lib/i18n'
import { cx } from '@/lib/cx'
import { Button } from '@/components/ui/button'
import { Price } from '@/components/ui/price'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { Gallery } from './gallery'
import { VariantSelector, defaultVariant } from './variant-selector'
import { rememberViewed } from './recently-viewed'

interface Props {
  product: ProductCard
  lowStockThreshold: number
  /** Server-rendered slots: breadcrumb + title, then the long-form accordions. */
  header: ReactNode
  intro: ReactNode
  details: ReactNode
  promoLine: string | null
  reassurance: string
  notes: string[]
}

/**
 * PDP main block (PRD 6.3): gallery 7/12 and a sticky info column 5/12 from 1024px; single column with
 * a sticky bottom "Add to bag" bar on mobile once the main button scrolls away.
 */
export function ProductMain({
  product,
  lowStockThreshold,
  header,
  intro,
  details,
  promoLine,
  reassurance,
  notes,
}: Props) {
  const [sku, setSku] = useState(() => defaultVariant(product.variants).sku)
  const [qty, setQty] = useState(1)
  const [showBar, setShowBar] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const add = useCart((s) => s.add)
  const variant = product.variants.find((v) => v.sku === sku) ?? product.variants[0]
  const maxQty = variant.stock != null ? Math.max(1, Math.min(10, variant.stock)) : 10
  const imageIndex = variant.image
    ? Math.max(
        0,
        product.images.findIndex((i) => i.src === variant.image!.src),
      )
    : 0
  const lowStock = variant.available && variant.stock != null && variant.stock <= lowStockThreshold

  useEffect(() => {
    rememberViewed(product)
  }, [product])

  // Show the mobile bar once the main button has scrolled above the viewport (rAF-throttled scroll check).
  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const el = buttonRef.current
      if (el) setShowBar(el.getBoundingClientRect().bottom < 0)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const addToBag = () => {
    add(variant.sku, qty, snapshotFor(product, variant))
  }

  return (
    <div className="grid-editorial gap-y-8">
      <div className="col-span-4 -mx-4 sm:-mx-6 md:col-span-6 lg:col-span-7 lg:mx-0">
        <Gallery images={product.images} title={product.title} activeIndex={imageIndex} />
      </div>

      <div className="col-span-4 md:col-span-6 lg:col-span-5">
        <div className="lg:sticky lg:top-[100px] lg:pb-10">
          {header}
          <p className="mt-4 text-[20px]" data-testid="pdp-price">
            <Price cents={variant.priceCents} compareAtCents={product.compareAtPriceCents} />
          </p>
          {promoLine ? <p className="mt-3 text-[14px] text-champagne-400">{promoLine}</p> : null}
          {intro}

          <div className="mt-8">
            <VariantSelector
              idPrefix="pdp"
              optionNames={product.optionNames}
              variants={product.variants}
              selectedSku={sku}
              onSelect={setSku}
            />
          </div>

          <div ref={buttonRef} className="mt-8 flex gap-3">
            <QuantityStepper value={Math.min(qty, maxQty)} onChange={setQty} max={maxQty} />
            <Button
              fullWidth
              className="flex-1"
              onClick={addToBag}
              disabled={!variant.available}
              data-testid="add-to-bag"
            >
              {variant.available ? t('product.addToBag') : t('product.soldOut')}
            </Button>
          </div>

          <div className="mt-4 min-h-6 text-[14px]" aria-live="polite">
            {!variant.available ? (
              <p className="text-bone-300">{t('product.soldOutLong')}</p>
            ) : lowStock ? (
              <p className="text-champagne-400">
                {t('product.onlyLeft', { count: variant.stock! })}
              </p>
            ) : null}
          </div>
          <p className="mt-2 text-[12px] tracking-[0.02em] text-bone-500">{reassurance}</p>
          {notes.length ? (
            <ul className="mt-4 space-y-1 text-[13px] text-bone-300">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10">{details}</div>
        </div>
      </div>

      {/* Mobile sticky bar: thumb-reachable price + Add to bag (PRD 4.9, 6.3) */}
      <div
        className={cx(
          'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-900/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-350 ease-gallery lg:hidden',
          showBar ? 'translate-y-0' : 'pointer-events-none translate-y-full',
        )}
        aria-hidden={!showBar}
        data-testid="sticky-bar"
        data-visible={showBar}
      >
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-bone-300">
              {product.title}
              {variant.title !== 'Default' ? `, ${variant.title}` : ''}
            </p>
            <p className="price text-[15px]">{formatMoney(variant.priceCents)}</p>
          </div>
          <Button
            onClick={addToBag}
            disabled={!variant.available}
            tabIndex={showBar ? 0 : -1}
            className="shrink-0"
          >
            {variant.available ? t('product.addToBag') : t('product.soldOut')}
          </Button>
        </div>
      </div>
    </div>
  )
}
