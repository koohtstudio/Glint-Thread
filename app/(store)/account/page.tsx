import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { accountUser } from '@/lib/account/guard'
import { listOrdersForUser } from '@/lib/account/customer-orders'
import { getProfile, listAddresses } from '@/lib/account/store'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountShell } from '@/components/account/account-shell'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { OrderRow } from '@/components/account/order-parts'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = pageMetadata({
  title: t('account.title'),
  path: '/account',
  noindex: true,
})

async function Overview() {
  const user = await accountUser('/account')
  if (!user)
    return (
      <AuthShell title={t('account.title')}>
        <AccountsUnavailable />
      </AuthShell>
    )
  const [profile, orders, addresses] = await Promise.all([
    getProfile(user.uid),
    listOrdersForUser(user.uid, 3),
    listAddresses(user.uid),
  ])
  const first = profile?.firstName?.trim()
  const primary = addresses.find((a) => a.isDefault) ?? addresses[0]
  return (
    <AccountShell
      active="overview"
      title={first ? t('account.greeting', { name: first }) : t('account.greetingNoName')}
      intro={t('account.intro')}
      emailVerified={user.emailVerified}
      email={user.email}
    >
      <div className="grid-editorial gap-y-14">
        <section aria-labelledby="recent-orders" className="col-span-4 md:col-span-6 lg:col-span-7">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="recent-orders" className="t-h3">
              {t('account.recentOrders')}
            </h2>
            {orders.length ? (
              <Link href="/account/orders" className="link-cta btn-label">
                <span>{t('account.viewAllOrders')}</span>
              </Link>
            ) : null}
          </div>
          {orders.length ? (
            <ul className="mt-6 border-t border-line">
              {orders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          ) : (
            <div className="mt-6 border-t border-line pt-8" data-testid="no-orders">
              <p className="text-[15px] text-bone-300">{t('account.noOrders')}</p>
              <Button asChild variant="secondary" className="mt-6">
                <Link href="/shop/jewellery">{t('account.startShopping')}</Link>
              </Button>
            </div>
          )}
        </section>

        <section
          aria-labelledby="default-address"
          className="col-span-4 md:col-span-6 lg:col-span-4 lg:col-start-9"
        >
          <h2 id="default-address" className="t-h3">
            {t('account.defaultAddress')}
          </h2>
          <div className="mt-6 border-t border-line pt-6 text-[15px] leading-relaxed">
            {primary ? (
              <address className="text-bone-300 not-italic">
                <span className="text-bone-50">{primary.name}</span>
                <br />
                {primary.line1}
                {primary.line2 ? `, ${primary.line2}` : ''}
                <br />
                {primary.city} {primary.province} {primary.postalCode}
              </address>
            ) : (
              <p className="text-bone-300">{t('account.noAddress')}</p>
            )}
            <Link href="/account/addresses" className="link-cta btn-label mt-6 inline-flex">
              <span>{t('account.manageAddresses')}</span>
            </Link>
          </div>
        </section>
      </div>
    </AccountShell>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] pt-14" aria-busy="true" />}>
      <Overview />
    </Suspense>
  )
}
