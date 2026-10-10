'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart/store'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

/**
 * Checkout (PRD 6.4, 8.4). The one-page checkout lives at /checkout. Without Stripe keys the button renders
 * disabled with "Checkout opens soon".
 */
export function CheckoutButton({ enabled, disabled }: { enabled: boolean; disabled?: boolean }) {
  const close = useCart((s) => s.close)

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

  return (
    <Button asChild fullWidth data-testid="checkout-button" onClick={() => close()}>
      <Link
        href="/checkout"
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
      >
        {t('bag.checkout')}
      </Link>
    </Button>
  )
}
