import type { Metadata } from 'next'
import { Suspense } from 'react'
import { accountUser } from '@/lib/account/guard'
import { listAddresses } from '@/lib/account/store'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountShell } from '@/components/account/account-shell'
import { AddressManager } from '@/components/account/address-manager'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'

export const metadata: Metadata = pageMetadata({
  title: t('account.addressesTitle'),
  path: '/account/addresses',
  noindex: true,
})

async function Addresses() {
  const user = await accountUser('/account/addresses')
  if (!user)
    return (
      <AuthShell title={t('account.addressesTitle')}>
        <AccountsUnavailable />
      </AuthShell>
    )
  return (
    <AccountShell
      active="addresses"
      title={t('account.addressesTitle')}
      intro={t('account.addressesIntro')}
      emailVerified={user.emailVerified}
      email={user.email}
    >
      <AddressManager initial={await listAddresses(user.uid)} />
    </AccountShell>
  )
}

export default function AddressesPage() {
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] pt-14" aria-busy="true" />}>
      <Addresses />
    </Suspense>
  )
}
