'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart, type CartLine } from '@/lib/cart/store'
import { useQuickAdd } from '@/lib/cart/quick-add'
import { snapshotFor } from '@/lib/cart/snapshot'
import type { ProductCard } from '@/lib/data/types'
import type { Quote } from '@/lib/pricing/types'
import { formatDiscount, formatMoney } from '@/lib/format'
import { sentenceCase } from '@/lib/text'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { ProgressLine } from '@/components/ui/progress-line'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { Button } from '@/components/ui/button'
import { CheckoutButton } from './checkout-button'
import { PromoCode } from './promo-code'

export interface BagConfig {
  checkoutEnabled: boolean
  taxMode: 'none' | 'table'
  freeShippingThresholdCents: number
  addOns: ProductCard[]
}

/** Totals from the server quote when it matches the bag; otherwise a provisional subtotal from snapshots. */
function useTotals(lines: CartLine[], quote: Quote | null) {
  const provisional = lines.reduce((n, l) => n + l.unitPriceCents * l.qty, 0)
  const matches =
    quote !== null &&
    quote.lines.length === lines.length &&
    quote.lines.every((ql) => lines.some((l) => l.sku === ql.sku && l.qty === ql.qty))
  if (quote && matches)
    return {
      quote,
      subtotal: quote.merchandiseSubtotalCents,
      discounted: quote.discountedSubtotalCents,
      fresh: true,
    }
  return {
    quote: null,
    subtotal: provisional,
    discounted: quote
      ? Math.max(0, provisional - quote.automaticDiscountCents - quote.codeDiscountCents)
      : provisional,
    fresh: false,
  }
}

export function BagContents({
  config,
  layout = 'drawer',
}: {
  config: BagConfig
  layout?: 'drawer' | 'page'
}) {
  const lines = useCart((s) => s.lines)
  const hydrated = useCart((s) => s.hydrated)
  const storedQuote = useCart((s) => s.quote)
  const quoteStatus = useCart((s) => s.quoteStatus)
  const close = useCart((s) => s.close)
  const totals = useTotals(lines, storedQuote)
  const quote = totals.quote
  const threshold = quote?.freeShipping.thresholdCents ?? config.freeShippingThresholdCents
  const remaining = Math.max(0, threshold - totals.discounted)
  const unlocked = lines.length > 0 && remaining === 0
  const savings = quote ? quote.automaticDiscountCents + quote.codeDiscountCents : 0

  if (!hydrated) return <div className="min-h-64" aria-busy="true" />

  if (!lines.length) {
    return (
      <div className={cx('flex flex-col', layout === 'drawer' ? 'px-5 py-10 sm:px-6' : 'py-6')}>
        <p className="font-serif text-[32px] leading-[1.1] text-balance">{t('bag.empty')}</p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button asChild>
            <Link href="/shop/jewellery" onClick={close}>
              {t('bag.emptyCta')}
            </Link>
          </Button>
          <Link href="/shop/socks" onClick={close} className="link-cta btn-label">
            <span>{t('bag.emptyAlt')}</span>
          </Link>
        </div>
        <AddOns products={config.addOns} skus={[]} />
      </div>
    )
  }

  const promoTitles = new Map((quote?.promotions ?? []).map((p) => [p.id, sentenceCase(p.title)]))

  return (
    <div className="flex flex-col">
      <div className={cx(layout === 'drawer' ? 'px-5 pt-5 sm:px-6' : 'pt-2')}>
        <p className="text-[14px]" aria-live="polite">
          {unlocked ? (
            <span className="text-bone-50">{t('bag.freeShippingUnlocked')}</span>
          ) : (
            <span className="text-bone-300">
              {t('bag.freeShippingRemaining', { amount: formatMoney(remaining) })}
            </span>
          )}
        </p>
        <ProgressLine
          value={totals.discounted}
          max={threshold}
          label={t('bag.freeShippingRemaining', { amount: formatMoney(remaining) })}
          className="mt-3"
        />
      </div>

      <ul
        className={cx('mt-2', layout === 'drawer' ? 'px-5 sm:px-6' : '')}
        aria-label={t('bag.pageTitle')}
      >
        {lines.map((line) => {
          const ql = quote?.lines.find((l) => l.sku === line.sku)
          return (
            <BagLine
              key={line.sku}
              line={line}
              quoteLine={ql}
              promoTitles={promoTitles}
              layout={layout}
            />
          )
        })}
      </ul>

      <div className={cx(layout === 'drawer' ? 'px-5 sm:px-6' : '')}>
        <PromoCode />
      </div>

      <AddOns
        products={config.addOns}
        skus={lines.map((l) => l.sku)}
        padded={layout === 'drawer'}
      />

      <div
        className={cx(
          'sticky bottom-0 mt-auto border-t border-line bg-ink-900',
          layout === 'drawer' ? 'px-5 py-5 sm:px-6' : 'px-0 py-6',
        )}
      >
        <dl className="space-y-2 text-[15px]" aria-busy={quoteStatus === 'loading' || undefined}>
          <div className="flex justify-between">
            <dt className="text-bone-300">{t('bag.subtotal')}</dt>
            <dd className="price">{formatMoney(totals.subtotal)}</dd>
          </div>
          {savings > 0 ? (
            <div className="flex justify-between">
              <dt className="text-bone-300">{t('bag.savings')}</dt>
              <dd className="price text-bone-50" data-testid="bag-savings">
                {formatDiscount(savings)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-3">
            <dt>{t('bag.total')}</dt>
            <dd className="price text-[17px]" data-testid="bag-total">
              {formatMoney(totals.discounted)}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-[13px] text-bone-500">
          {config.taxMode === 'table' ? t('bag.shippingTaxNote') : t('bag.shippingNote')}
        </p>
        <div className="mt-5">
          <CheckoutButton
            enabled={config.checkoutEnabled}
            disabled={!totals.fresh && quoteStatus === 'loading'}
          />
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed tracking-[0.04em] text-bone-500">
          {t('bag.payments')}
        </p>
      </div>
    </div>
  )
}

function BagLine({
  line,
  quoteLine,
  promoTitles,
  layout,
}: {
  line: CartLine
  quoteLine?: Quote['lines'][number]
  promoTitles: Map<string, string>
  layout: 'drawer' | 'page'
}) {
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const close = useCart((s) => s.close)
  const highlight = useCart((s) => s.highlightSku === line.sku)
  const lineTotal = (quoteLine?.unitPriceCents ?? line.unitPriceCents) * line.qty
  const discount = quoteLine?.discountCents ?? 0
  const promoLabel = quoteLine?.promotionIds.map((id) => promoTitles.get(id)).filter(Boolean)[0]
  const max = quoteLine?.available != null ? Math.min(10, quoteLine.available) : 10
  const thumb = layout === 'drawer' ? 72 : 112

  return (
    <li
      className={cx(
        'grid gap-4 border-b border-line py-5 transition-colors duration-1000 ease-gallery',
        highlight && 'bg-ink-800',
      )}
      style={{ gridTemplateColumns: `${thumb}px 1fr` }}
      data-testid="bag-line"
      data-sku={line.sku}
    >
      <Link href={`/products/${line.productSlug}`} onClick={close} tabIndex={-1} aria-hidden="true">
        <div className="mat aspect-[4/5]">
          {line.image ? (
            <div className="absolute inset-[6%]">
              <Image
                src={line.image.src}
                alt=""
                fill
                sizes={`${thumb}px`}
                placeholder={line.image.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={line.image.blurDataURL}
                className="object-contain"
              />
            </div>
          ) : null}
        </div>
      </Link>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${line.productSlug}`}
              onClick={close}
              className="text-[14px] leading-[1.4] font-medium hover:text-champagne-400"
            >
              {line.title}
            </Link>
            {line.variantTitle !== 'Default' ? (
              <p className="mt-0.5 text-[13px] text-bone-300">{line.variantTitle}</p>
            ) : null}
          </div>
          <p className="price shrink-0 text-[14px]">{formatMoney(lineTotal)}</p>
        </div>
        {discount > 0 && promoLabel ? (
          <p className="mt-1 text-[13px] text-bone-500" data-testid="line-savings">
            {promoLabel} <span className="tabular">{formatDiscount(discount)}</span>
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3">
          <QuantityStepper
            size="sm"
            value={line.qty}
            max={max}
            onChange={(q) => setQty(line.sku, q)}
            label={`${t('a11y.quantity')}: ${line.title}`}
          />
          <button
            type="button"
            onClick={() => remove(line.sku)}
            className="min-h-11 px-1 text-[13px] text-bone-500 underline-offset-4 hover:text-bone-50 hover:underline"
            aria-label={t('a11y.remove', { title: line.title })}
          >
            {t('bag.remove')}
          </button>
        </div>
      </div>
    </li>
  )
}

/** "Under $10 add-ons" (PRD 4.6): three small cards for products not already in the bag. */
function AddOns({
  products,
  skus,
  padded = true,
}: {
  products: ProductCard[]
  skus: string[]
  padded?: boolean
}) {
  const add = useCart((s) => s.add)
  const openQuickAdd = useQuickAdd((s) => s.open)
  const picks = products.filter((p) => !p.variants.some((v) => skus.includes(v.sku))).slice(0, 3)
  if (!picks.length) return null
  return (
    <section
      className={cx('border-t border-line py-6', padded && 'px-5 sm:px-6')}
      aria-labelledby="addons-title"
    >
      <h2 id="addons-title" className="eyebrow">
        {t('bag.addOns')}
      </h2>
      <ul className="mt-4 grid grid-cols-3 gap-3">
        {picks.map((p) => {
          const single = p.variants.length === 1
          return (
            <li key={p.slug} className="flex flex-col">
              <div className="mat aspect-[4/5]">
                <div className="absolute inset-[6%]">
                  <Image
                    src={p.images[0].src}
                    alt={p.images[0].alt}
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[12px] leading-snug font-medium">{p.title}</p>
              <p className="price text-[12px] text-bone-300">{formatMoney(p.minPriceCents)}</p>
              <button
                type="button"
                onClick={() =>
                  single
                    ? add(p.variants[0].sku, 1, snapshotFor(p, p.variants[0]))
                    : openQuickAdd(p)
                }
                className="btn-label mt-2 h-11 border border-line-strong text-[11px] hover:border-bone-50"
                aria-label={`${t('bag.add')}: ${p.title}`}
              >
                {t('bag.add')}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
