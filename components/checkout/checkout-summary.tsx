'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useCart } from '@/lib/cart/store'
import type { Quote } from '@/lib/pricing/types'
import { cx } from '@/lib/cx'
import { formatDiscount, formatMoney } from '@/lib/format'
import { t } from '@/lib/i18n'
import { PromoCode } from '@/components/cart/promo-code'
import { ChevronDownIcon } from '@/components/ui/icons'

interface SummaryProps {
  quote: Quote | null
  taxMode: 'none' | 'table'
  gstHstNumber: string | null
  /** True while the server is re-quoting: totals dim so a stale number is never read as final. */
  updating: boolean
  hasProvince: boolean
}

function Row({
  label,
  value,
  strong,
  testId,
}: {
  label: string
  value: string
  strong?: boolean
  testId?: string
}) {
  return (
    <div className={cx('flex justify-between gap-4', strong && 'border-t border-line pt-3')}>
      <dt className={strong ? undefined : 'text-bone-300'}>{label}</dt>
      <dd className={cx('price text-right', strong && 'text-[17px]')} data-testid={testId}>
        {value}
      </dd>
    </div>
  )
}

function Lines({ quote }: { quote: Quote | null }) {
  const cartLines = useCart((s) => s.lines)
  const rows = quote
    ? quote.lines.map((l) => ({
        key: l.sku,
        title: l.title,
        variant: l.variantTitle,
        qty: l.qty,
        totalCents: l.lineSubtotalCents - l.discountCents,
        image: l.image,
      }))
    : cartLines.map((l) => ({
        key: l.sku,
        title: l.title,
        variant: l.variantTitle,
        qty: l.qty,
        totalCents: l.unitPriceCents * l.qty,
        image: l.image,
      }))
  return (
    <ul className="divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[56px_1fr_auto] items-center gap-4 py-4">
          <div className="mat aspect-[4/5]" aria-hidden="true">
            {r.image ? (
              <div className="absolute inset-[6%]">
                <Image src={r.image.src} alt="" fill sizes="56px" className="object-contain" />
              </div>
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] leading-[1.4] font-medium">{r.title}</p>
            <p className="mt-0.5 text-[13px] text-bone-300">
              {r.variant !== 'Default' ? `${r.variant}, ` : ''}
              {t('checkout.quantity', { qty: r.qty })}
            </p>
          </div>
          <p className="price text-[14px]">{formatMoney(r.totalCents)}</p>
        </li>
      ))}
    </ul>
  )
}

function Totals({ quote, taxMode, gstHstNumber, updating, hasProvince }: SummaryProps) {
  const cartLines = useCart((s) => s.lines)
  const provisional = cartLines.reduce((n, l) => n + l.unitPriceCents * l.qty, 0)
  const subtotal = quote?.merchandiseSubtotalCents ?? provisional
  return (
    <div className={cx('transition-opacity duration-300', updating && 'opacity-60')}>
      <dl className="space-y-2 text-[14px]">
        <Row label={t('checkout.subtotal')} value={formatMoney(subtotal)} />
        {quote?.promotions.map((p) => (
          <Row key={p.id} label={p.title} value={formatDiscount(p.discountCents)} />
        ))}
        {quote && quote.codeDiscountCents > 0 && quote.promoCode ? (
          <Row label={quote.promoCode.code} value={formatDiscount(quote.codeDiscountCents)} />
        ) : null}
        <Row
          label={t('checkout.shipping')}
          value={
            quote?.shipping
              ? quote.shipping.amountCents
                ? formatMoney(quote.shipping.amountCents)
                : t('checkout.free')
              : t('checkout.shippingPending')
          }
        />
        {quote?.taxLines.map((line) => (
          <Row
            key={`${line.code}-${line.ratePercent}`}
            label={line.label}
            value={formatMoney(line.amountCents)}
          />
        ))}
        {taxMode === 'table' && !quote?.taxLines.length ? (
          <Row
            label={t('checkout.tax')}
            value={hasProvince ? formatMoney(0) : t('checkout.taxPending')}
          />
        ) : null}
        <Row
          strong
          label={t('checkout.total')}
          value={quote ? formatMoney(quote.totalCents) : formatMoney(subtotal)}
          testId="checkout-total"
        />
      </dl>
      <p className="sr-only" role="status" aria-live="polite">
        {updating ? t('checkout.updating') : quote ? formatMoney(quote.totalCents) : ''}
      </p>
      {taxMode === 'table' && gstHstNumber ? (
        <p className="mt-4 text-[12px] text-bone-500">
          {t('checkout.gstHst', { number: gstHstNumber })}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Order summary (PRD 6.4.5). Every number is the server quote; before the first quote arrives it falls back to
 * the bag snapshots. Mobile: a collapsed band above the form showing the total. Desktop: a sticky panel beside it.
 */
export function MobileSummary(props: SummaryProps) {
  const [open, setOpen] = useState(false)
  const total = props.quote?.totalCents
  return (
    <div className="border border-line bg-ink-900 px-4 sm:px-6 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="summary-mobile"
        className="flex min-h-14 w-full items-center justify-between gap-4 text-[14px]"
      >
        <span className="flex items-center gap-2 text-bone-300">
          {open ? t('checkout.hideSummary') : t('checkout.showSummary')}
          <ChevronDownIcon
            size={16}
            className={cx('transition-transform duration-250 ease-gallery', open && 'rotate-180')}
          />
        </span>
        <span className="price text-[16px]">{total != null ? formatMoney(total) : ''}</span>
      </button>
      <div id="summary-mobile" hidden={!open} className="pb-6">
        <Lines quote={props.quote} />
        <div className="mt-2">
          <PromoCode />
        </div>
        <div className="mt-4">
          <Totals {...props} />
        </div>
      </div>
    </div>
  )
}

export function DesktopSummary(props: SummaryProps) {
  return (
    <aside
      aria-labelledby="summary-title"
      className="hidden border border-line bg-ink-900 p-8 lg:sticky lg:top-28 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:block lg:self-start"
    >
      <h2 id="summary-title" className="eyebrow">
        {t('checkout.summary')}
      </h2>
      <div className="mt-6">
        <Lines quote={props.quote} />
      </div>
      <div className="mt-2">
        <PromoCode />
      </div>
      <div className="mt-4">
        <Totals {...props} />
      </div>
    </aside>
  )
}
