import type { Metadata } from 'next'
import { Suspense } from 'react'
import { accountUser } from '@/lib/account/guard'
import { getProfile } from '@/lib/account/store'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountShell } from '@/components/account/account-shell'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { PreferencesForm } from '@/components/account/profile-forms'

export const metadata: Metadata = pageMetadata({
  title: t('account.preferencesTitle'),
  path: '/account/preferences',
  noindex: true,
})

async function Preferences() {
  const user = await accountUser('/account/preferences')
  if (!user)
    return (
      <AuthShell title={t('account.preferencesTitle')}>
        <AccountsUnavailable />
      </AuthShell>
    )
  const profile = await getProfile(user.uid)
  return (
    <AccountShell
      active="preferences"
      title={t('account.preferencesTitle')}
      intro={t('account.preferencesIntro')}
      emailVerified={user.emailVerified}
      email={user.email}
    >
      <PreferencesForm
        initial={Boolean(profile?.marketingOptIn)}
        emailVerified={user.emailVerified}
      />
    </AccountShell>
  )
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] pt-14" aria-busy="true" />}>
      <Preferences />
    </Suspense>
  )
}
