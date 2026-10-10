import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { accountUser } from '@/lib/account/guard'
import { listOrdersForUser } from '@/lib/account/customer-orders'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountShell } from '@/components/account/account-shell'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { OrderRow } from '@/components/account/order-parts'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = pageMetadata({
  title: t('account.ordersTitle'),
  path: '/account/orders',
  noindex: true,
})

async function Orders() {
  const user = await accountUser('/account/orders')
  if (!user)
    return (
      <AuthShell title={t('account.ordersTitle')}>
        <AccountsUnavailable />
      </AuthShell>
    )
  const orders = await listOrdersForUser(user.uid)
  return (
    <AccountShell
      active="orders"
      title={t('account.ordersTitle')}
      intro={t('account.ordersIntro')}
      emailVerified={user.emailVerified}
      email={user.email}
    >
      {orders.length ? (
        <ul className="max-w-4xl border-t border-line" data-testid="orders-list">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </ul>
      ) : (
        <div className="max-w-xl border-t border-line pt-8" data-testid="no-orders">
          <p className="text-[15px] text-bone-300">{t('account.noOrders')}</p>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/shop/jewellery">{t('account.startShopping')}</Link>
          </Button>
        </div>
      )}
    </AccountShell>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] pt-14" aria-busy="true" />}>
      <Orders />
    </Suspense>
  )
}
