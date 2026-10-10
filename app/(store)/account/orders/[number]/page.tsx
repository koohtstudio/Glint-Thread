import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { accountUser } from '@/lib/account/guard'
import { getOrderForUser } from '@/lib/account/customer-orders'
import { formatDate } from '@/lib/format'
import { trackingUrl } from '@/lib/orders'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountShell } from '@/components/account/account-shell'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { OrderLines, OrderTotals, statusLabel } from '@/components/account/order-parts'

export const instant = false

export const metadata: Metadata = pageMetadata({
  title: t('account.ordersTitle'),
  path: '/account/orders',
  noindex: true,
})

async function OrderDetail({
  params,
}: {
  params: PageProps<'/account/orders/[number]'>['params']
}) {
  const { number } = await params
  const user = await accountUser(`/account/orders/${number}`)
  if (!user)
    return (
      <AuthShell title={t('account.ordersTitle')}>
        <AccountsUnavailable />
      </AuthShell>
    )
  const order = /^GT-[A-Z0-9]{4,12}$/.test(number) ? await getOrderForUser(user.uid, number) : null
  if (!order || order.status === 'pending' || order.status === 'expired') notFound()
  const address = order.shippingAddress
  return (
    <AccountShell
      active="orders"
      title={t('account.orderNumber', { number: order.orderNumber })}
      intro={`${statusLabel(order.status)}. ${t('account.placedOn', { date: formatDate(order.paidAt ?? order.createdAt) })}`}
      emailVerified={user.emailVerified}
      email={user.email}
    >
      <Link href="/account/orders" className="link-cta btn-label mb-10 inline-flex">
        <span>{t('account.backToOrders')}</span>
      </Link>
      <div className="grid-editorial gap-y-14">
        <section aria-labelledby="order-items" className="col-span-4 md:col-span-6 lg:col-span-7">
          <h2 id="order-items" className="t-h3 mb-6">
            {t('account.items')}
          </h2>
          <OrderLines order={order} />
        </section>
        <div className="col-span-4 space-y-12 md:col-span-6 lg:col-span-4 lg:col-start-9">
          <section aria-labelledby="order-totals">
            <h2 id="order-totals" className="sr-only">
              {t('account.orderTotal')}
            </h2>
            <OrderTotals order={order} />
          </section>
          <section aria-labelledby="order-shipping">
            <h2 id="order-shipping" className="eyebrow">
              {t('account.shippingTo')}
            </h2>
            {address && address.line1 ? (
              <address className="mt-3 text-[15px] leading-relaxed text-bone-300 not-italic">
                <span className="text-bone-50">{order.name ?? address.name}</span>
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
                <br />
                {address.city} {address.province} {address.postalCode}
              </address>
            ) : (
              <p className="mt-3 text-[14px] text-bone-500">{t('account.orderRemoved')}</p>
            )}
            {order.shippingMethod ? (
              <p className="mt-4 text-[14px] text-bone-300">{order.shippingMethod}</p>
            ) : null}
          </section>
          <section aria-labelledby="order-tracking">
            <h2 id="order-tracking" className="eyebrow">
              {t('account.tracking')}
            </h2>
            {order.trackingNumber && order.carrier ? (
              <p className="mt-3 text-[15px] text-bone-300">
                {order.carrier} <span className="tabular">{order.trackingNumber}</span>
                <a
                  href={trackingUrl(order.carrier, order.trackingNumber)}
                  className="link-cta btn-label mt-4 flex"
                  rel="noopener"
                >
                  <span>{t('account.trackPackage')}</span>
                </a>
              </p>
            ) : (
              <p className="mt-3 text-[14px] text-bone-500">{t('account.trackingNone')}</p>
            )}
          </section>
        </div>
      </div>
    </AccountShell>
  )
}

export default function OrderPage({ params }: PageProps<'/account/orders/[number]'>) {
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] pt-14" aria-busy="true" />}>
      <OrderDetail params={params} />
    </Suspense>
  )
}
