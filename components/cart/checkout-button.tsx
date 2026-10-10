'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/store'
import { toast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

/**
 * Checkout (PRD 6.4, 8.4). Without Stripe keys it renders disabled with "Checkout opens soon".
 * Otherwise it asks the server for a Stripe Checkout Session and redirects.
 */
export function CheckoutButton({ enabled, disabled }: { enabled: boolean; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)

  if (!enabled) {
    return (
      <div>
        <Button fullWidth aria-disabled="true" disabled data-testid="checkout-button">
          {t('bag.checkoutSoon')}
        </Button>
        <p className="mt-3 text-[13px] leading-snug text-bone-500">{t('bag.checkoutSoonNote')}</p>
      </div>
    )
  }

  const go = async () => {
    const { lines, promoCode, email } = useCart.getState()
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map((l) => ({ sku: l.sku, qty: l.qty })),
          promoCode,
          email: email || null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string }
      if (res.ok && data.url) {
        window.location.assign(data.url)
        return
      }
      toast(data.message ?? t('checkout.error'), 'error')
    } catch {
      toast(t('checkout.error'), 'error')
    }
    setLoading(false)
  }

  return (
    <Button
      fullWidth
      onClick={go}
      loading={loading}
      loadingLabel={t('bag.checkoutLoading')}
      disabled={disabled}
      data-testid="checkout-button"
    >
      {t('bag.checkout')}
    </Button>
  )
}
