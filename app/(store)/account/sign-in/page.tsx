import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSessionUser } from '@/lib/auth/session'
import { safeNext } from '@/lib/auth/next'
import { firstParam } from '@/lib/auth/params'
import { features } from '@/lib/env'
import { publicEnv } from '@/lib/public-env'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { SignInForm } from '@/components/account/auth-forms'

export const metadata: Metadata = pageMetadata({
  title: t('auth.signInTitle'),
  path: '/account/sign-in',
  noindex: true,
})

async function SignInContent({
  searchParams,
}: {
  searchParams: PageProps<'/account/sign-in'>['searchParams']
}) {
  const sp = await searchParams
  const next = safeNext(firstParam(sp.next))
  const reauth = firstParam(sp.reauth) === '1'
  if (!features.accounts) return <AccountsUnavailable />
  // Already signed in: carry on, unless this is a "sign in again" prompt for a sensitive action.
  if (!reauth && (await getSessionUser())) redirect(next)
  return (
    <>
      {reauth ? (
        <p role="status" className="mb-8 text-[15px] text-bone-300">
          {t('account.reauthNotice')}
        </p>
      ) : null}
      <SignInForm next={next} google={publicEnv.firebase.googleEnabled} />
    </>
  )
}

export default function SignInPage({ searchParams }: PageProps<'/account/sign-in'>) {
  return (
    <AuthShell title={t('auth.signInTitle')} intro={t('auth.signInIntro')}>
      <Suspense fallback={<div className="min-h-64" aria-busy="true" />}>
        <SignInContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
