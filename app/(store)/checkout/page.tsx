import type { Metadata } from 'next'
import { Suspense } from 'react'
import { listAddresses } from '@/lib/account/store'
import { getSessionUser } from '@/lib/auth/session'
import { env, features } from '@/lib/env'
import { publicEnv } from '@/lib/public-env'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { CheckoutClient, type CheckoutConfig } from '@/components/checkout/checkout-client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = pageMetadata({
  title: t('checkout.title'),
  path: '/checkout',
  noindex: true,
})

/** The signed-in customer and their saved addresses (cookies, so this part is never prerendered). */
async function CheckoutData() {
  if (!features.stripe || !publicEnv.stripePublishableKey) {
    return (
      <div className="max-w-xl" data-testid="checkout-unavailable">
        <h2 className="t-h2">{t('checkout.unavailableTitle')}</h2>
        <p className="t-lede mt-6">{t('checkout.unavailableBody')}</p>
        <Button asChild className="mt-8" variant="secondary">
          <Link href="/bag">{t('checkout.backToBag')}</Link>
        </Button>
      </div>
    )
  }
  const user = features.firebaseAdmin ? await getSessionUser().catch(() => null) : null
  const addresses = user ? await listAddresses(user.uid).catch(() => []) : []
  const config: CheckoutConfig = {
    publishableKey: publicEnv.stripePublishableKey,
    taxMode: env.TAX_MODE,
    gstHstNumber: env.GST_HST_NUMBER ?? null,
    accounts: features.accounts,
    user: user ? { email: user.email } : null,
    addresses,
  }
  return <CheckoutClient config={config} />
}

export default function CheckoutPage() {
  return (
    <div className="container-x pt-10 pb-24 lg:pt-14">
      <p className="eyebrow">{t('checkout.eyebrow')}</p>
      <h1 className="t-h1 mt-4">{t('checkout.title')}</h1>
      <div className="mt-10 lg:mt-14">
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <CheckoutData />
        </Suspense>
      </div>
    </div>
  )
}
