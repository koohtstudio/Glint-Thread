import type { Metadata } from 'next'
import { Suspense } from 'react'
import { safeNext } from '@/lib/auth/next'
import { firstParam } from '@/lib/auth/params'
import { features } from '@/lib/env'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { ActionHandler } from '@/components/account/auth-forms'

export const metadata: Metadata = pageMetadata({
  title: t('auth.eyebrow'),
  path: '/account/action',
  noindex: true,
})

async function ActionContent({
  searchParams,
}: {
  searchParams: PageProps<'/account/action'>['searchParams']
}) {
  const sp = await searchParams
  if (!features.accounts) return <AccountsUnavailable />
  return (
    <ActionHandler
      mode={firstParam(sp.mode)}
      oobCode={firstParam(sp.oobCode)}
      email={firstParam(sp.email)}
      next={safeNext(firstParam(sp.next))}
    />
  )
}

export default function ActionPage({ searchParams }: PageProps<'/account/action'>) {
  return (
    <AuthShell title={t('auth.eyebrow')}>
      <Suspense fallback={<div className="min-h-32" aria-busy="true" />}>
        <ActionContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
