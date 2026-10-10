import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSessionUser } from '@/lib/auth/session'
import { safeNext } from '@/lib/auth/next'
import { firstParam } from '@/lib/auth/params'
import { features } from '@/lib/env'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { SignUpForm } from '@/components/account/auth-forms'

export const metadata: Metadata = pageMetadata({
  title: t('auth.signUpTitle'),
  path: '/account/sign-up',
  noindex: true,
})

async function SignUpContent({
  searchParams,
}: {
  searchParams: PageProps<'/account/sign-up'>['searchParams']
}) {
  const sp = await searchParams
  const next = safeNext(firstParam(sp.next))
  if (!features.accounts) return <AccountsUnavailable />
  if (await getSessionUser()) redirect(next)
  return <SignUpForm next={next} />
}

export default function SignUpPage({ searchParams }: PageProps<'/account/sign-up'>) {
  return (
    <AuthShell title={t('auth.signUpTitle')} intro={t('auth.signUpIntro')}>
      <Suspense fallback={<div className="min-h-64" aria-busy="true" />}>
        <SignUpContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
