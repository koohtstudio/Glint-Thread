import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { Breadcrumbs } from '@/components/content/breadcrumbs'
import { OrderStatusForm } from '@/components/content/order-status-form'

export const metadata: Metadata = pageMetadata({
  title: t('orderStatus.title'),
  description: 'Look up an order with your order number and email.',
  path: '/order-status',
})

export default function OrderStatusPage() {
  return (
    <div className="container-x pt-8 pb-28 lg:pt-10">
      <Breadcrumbs
        crumbs={[
          { name: t('nav.home'), href: '/' },
          { name: t('orderStatus.title'), href: '/order-status' },
        ]}
      />
      <div className="mx-auto mt-12 max-w-[680px] lg:mt-16">
        <p className="eyebrow">Help</p>
        <h1 className="t-h1 mt-4">{t('orderStatus.title')}</h1>
        <p className="t-lede mt-6">{t('orderStatus.intro')}</p>
        <div className="mt-12">
          <OrderStatusForm />
        </div>
      </div>
    </div>
  )
}
