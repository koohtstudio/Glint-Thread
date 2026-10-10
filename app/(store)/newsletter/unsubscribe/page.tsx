import type { Metadata } from 'next'
import { Suspense } from 'react'
import { unsubscribe } from '@/lib/subscribers'
import { verifyToken } from '@/lib/tokens'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'

export const metadata: Metadata = pageMetadata({
  title: 'Unsubscribe',
  path: '/newsletter/unsubscribe',
  noindex: true,
})

async function Result({
  searchParams,
}: {
  searchParams: PageProps<'/newsletter/unsubscribe'>['searchParams']
}) {
  const sp = await searchParams
  const email = typeof sp.email === 'string' ? sp.email.toLowerCase() : ''
  const token = typeof sp.token === 'string' ? sp.token : ''
  if (!email || !verifyToken('unsubscribe', email, token))
    return <p className="t-lede mt-8">{t('newsletter.invalidLink')}</p>
  await unsubscribe(email)
  return <p className="t-lede mt-8">{t('newsletter.unsubscribed')}</p>
}

/** One-click unsubscribe landing page (CASL, PRD 9.6). */
export default function UnsubscribePage({ searchParams }: PageProps<'/newsletter/unsubscribe'>) {
  return (
    <div className="container-x pt-16 pb-28 lg:pt-24">
      <div className="max-w-[680px]">
        <p className="eyebrow">{t('newsletter.eyebrow')}</p>
        <h1 className="t-h1 mt-4">Unsubscribe</h1>
        <Suspense fallback={<div className="mt-8 min-h-20" aria-busy="true" />}>
          <Result searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
