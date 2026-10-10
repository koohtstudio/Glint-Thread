'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/format'
import { t, type MessageKey } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'

interface OrderResult {
  orderNumber: string
  status: string
  placedAt: string
  items: { title: string; variantTitle: string; qty: number }[]
  carrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
}

/** Order lookup by order number + email (PRD 5.3). */
export function OrderStatusForm() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderResult | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOrder(null)
    setStatus('loading')
    try {
      const res = await fetch('/api/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim().toUpperCase(), email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setOrder(data.order)
      else setError(data.message ?? t('forms.genericError'))
    } catch {
      setError(t('forms.genericError'))
    }
    setStatus('idle')
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-8 sm:grid-cols-2" noValidate>
        <Input
          label={t('orderStatus.orderNumber')}
          hint={t('orderStatus.orderNumberHint')}
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          required
        />
        <Input
          label={t('orderStatus.email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="sm:col-span-2">
          <Button type="submit" loading={status === 'loading'} loadingLabel={t('forms.sending')}>
            {t('orderStatus.submit')}
          </Button>
        </div>
      </form>
      <div aria-live="polite" className="mt-10">
        {error ? <p className="text-[15px] text-error">{error}</p> : null}
        {order ? (
          <section className="border border-line bg-ink-900 p-6 lg:p-8">
            <p className="eyebrow">{order.orderNumber}</p>
            <p className="mt-3 font-serif text-[32px] leading-tight">
              {t(`orderStatus.statuses.${order.status}` as MessageKey)}
            </p>
            <p className="mt-2 text-[14px] text-bone-300">
              {t('orderStatus.placed')} {formatDate(order.placedAt)}
            </p>
            <ul className="mt-6 divide-y divide-line border-y border-line text-[14px]">
              {order.items.map((i, idx) => (
                <li key={idx} className="py-3">
                  {i.title}
                  {i.variantTitle !== 'Default' ? `, ${i.variantTitle}` : ''}{' '}
                  <span className="tabular text-bone-500">× {i.qty}</span>
                </li>
              ))}
            </ul>
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                className="link-cta btn-label mt-6"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{t('orderStatus.track', { carrier: order.carrier ?? 'Canada Post' })}</span>
              </a>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
