import Image from 'next/image'
import Link from 'next/link'
import type { CustomerOrder, CustomerOrderStatus } from '@/lib/account/types'
import { formatDate, formatDiscount, formatMoney, plural } from '@/lib/format'
import { t, type MessageKey } from '@/lib/i18n'

export const statusLabel = (status: CustomerOrderStatus) =>
  t(`account.status_${status}` as MessageKey)

type ListedOrder = CustomerOrder & { id: string }

/** One order in a list: number, date, status, item count and total; the whole row is the link. */
export function OrderRow({ order }: { order: ListedOrder }) {
  const count = order.lines.reduce((n, l) => n + l.qty, 0)
  return (
    <li className="border-b border-line">
      <Link
        href={`/account/orders/${order.orderNumber}`}
        className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-6 transition-colors duration-250 ease-gallery hover:bg-ink-900 sm:grid-cols-[1.2fr_1fr_auto] sm:px-4"
      >
        <span>
          <span className="font-serif text-[24px] leading-none">{order.orderNumber}</span>
          <span className="mt-2 block text-[13px] text-bone-300">
            {t('account.placedOn', { date: formatDate(order.paidAt ?? order.createdAt) })}
          </span>
        </span>
        <span className="col-span-2 text-[14px] text-bone-300 sm:col-span-1">
          <span className="eyebrow">{statusLabel(order.status)}</span>
          <span className="mt-1 block">{plural(count, 'item', 'items')}</span>
        </span>
        <span className="price row-start-1 text-[16px] sm:row-start-auto">
          {formatMoney(order.totals.totalCents)}
        </span>
      </Link>
    </li>
  )
}

/** Lines, savings, shipping, each named tax line and the total (PRD 6.4.5, 9.9). */
export function OrderTotals({ order }: { order: CustomerOrder }) {
  const { totals } = order
  return (
    <dl className="space-y-2 text-[14px]">
      <div className="flex justify-between">
        <dt className="text-bone-300">{t('checkout.subtotal')}</dt>
        <dd className="price">{formatMoney(totals.subtotalCents)}</dd>
      </div>
      {totals.discountCents > 0 ? (
        <div className="flex justify-between">
          <dt className="text-bone-300">{order.promoCode ?? t('checkout.savings')}</dt>
          <dd className="price">{formatDiscount(totals.discountCents)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between">
        <dt className="text-bone-300">{t('checkout.shipping')}</dt>
        <dd className="price">
          {totals.shippingCents ? formatMoney(totals.shippingCents) : t('checkout.free')}
        </dd>
      </div>
      {totals.taxLines.map((line) => (
        <div key={`${line.code}-${line.ratePercent}`} className="flex justify-between">
          <dt className="text-bone-300">{line.label}</dt>
          <dd className="price">{formatMoney(line.amountCents)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-3 text-[16px]">
        <dt>{order.status === 'pending' ? t('account.orderTotal') : t('account.paidTotal')}</dt>
        <dd className="price">{formatMoney(totals.totalCents)}</dd>
      </div>
    </dl>
  )
}

export function OrderLines({ order }: { order: CustomerOrder }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {order.lines.map((l) => (
        <li key={l.sku} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 py-4">
          <div className="mat aspect-[4/5]" aria-hidden="true">
            {l.image ? (
              <div className="absolute inset-[6%]">
                <Image src={l.image} alt="" fill sizes="64px" className="object-contain" />
              </div>
            ) : null}
          </div>
          <div className="min-w-0">
            <Link
              href={`/products/${l.productSlug}`}
              className="text-[14px] leading-[1.4] font-medium hover:text-champagne-400"
            >
              {l.title}
            </Link>
            <p className="mt-0.5 text-[13px] text-bone-300">
              {l.variantTitle !== 'Default' ? `${l.variantTitle}, ` : ''}
              {t('checkout.quantity', { qty: l.qty })}
            </p>
          </div>
          <p className="price text-[14px]">{formatMoney(l.lineTotalCents)}</p>
        </li>
      ))}
    </ul>
  )
}
