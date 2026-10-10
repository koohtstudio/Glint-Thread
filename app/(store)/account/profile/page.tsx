import type { Metadata } from 'next'
import { Suspense } from 'react'
import { accountUser } from '@/lib/account/guard'
import { getProfile } from '@/lib/account/store'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountShell } from '@/components/account/account-shell'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { DeleteAccountForm, PasswordForm, ProfileForm } from '@/components/account/profile-forms'

export const metadata: Metadata = pageMetadata({
  title: t('account.profileTitle'),
  path: '/account/profile',
  noindex: true,
})

async function Profile() {
  const user = await accountUser('/account/profile')
  if (!user)
    return (
      <AuthShell title={t('account.profileTitle')}>
        <AccountsUnavailable />
      </AuthShell>
    )
  const profile = await getProfile(user.uid)
  return (
    <AccountShell
      active="profile"
      title={t('account.profileTitle')}
      intro={t('account.profileIntro')}
      emailVerified={user.emailVerified}
      email={user.email}
    >
      <ProfileForm
        email={user.email ?? ''}
        initial={{
          firstName: profile?.firstName ?? '',
          lastName: profile?.lastName ?? '',
          phone: profile?.phone ?? '',
        }}
      />
      <section aria-labelledby="password-title" className="mt-16 border-t border-line pt-12">
        <h2 id="password-title" className="t-h3">
          {t('account.passwordTitle')}
        </h2>
        <p className="mt-3 mb-8 max-w-[52ch] text-[15px] text-bone-300">
          {t('account.passwordIntro')}
        </p>
        <PasswordForm />
      </section>
      <section aria-labelledby="delete-title" className="mt-16 border-t border-line pt-12">
        <h2 id="delete-title" className="t-h3">
          {t('account.deleteTitle')}
        </h2>
        <p className="mt-3 mb-8 max-w-[56ch] text-[15px] text-bone-300">
          {t('account.deleteIntro')}
        </p>
        <DeleteAccountForm />
      </section>
    </AccountShell>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] pt-14" aria-busy="true" />}>
      <Profile />
    </Suspense>
  )
}
