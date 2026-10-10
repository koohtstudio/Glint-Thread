import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProductCards, getSiteSettings } from '@/lib/data'
import { sortProducts } from '@/lib/data/derive'
import { env, features } from '@/lib/env'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { publicEnv } from '@/lib/public-env'
import { BagPageClient } from '@/components/cart/bag-page'

export const metadata: Metadata = pageMetadata({
  title: t('bag.pageTitle'),
  path: '/bag',
  noindex: true,
})

export default async function BagPage() {
  const [settings, cards] = await Promise.all([getSiteSettings(), getProductCards()])
  const addOns = sortProducts(
    cards.filter((p) => p.maxPriceCents < 1000 && !p.soldOut && !p.images[0].lowRes),
    'featured',
  ).slice(0, 8)
  return (
    <div className="container-x pt-10 pb-24 lg:pt-14">
      <p className="eyebrow">{t('nav.bag')}</p>
      <h1 className="t-h1 mt-4">{t('bag.pageTitle')}</h1>
      <div className="mt-10 max-w-3xl lg:mt-14">
        <Suspense fallback={<div className="min-h-64" aria-busy="true" />}>
          <BagPageClient
            config={{
              checkoutEnabled: features.stripe && Boolean(publicEnv.stripePublishableKey),
              taxMode: env.TAX_MODE,
              freeShippingThresholdCents: settings.freeShippingThresholdCents,
              addOns,
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
