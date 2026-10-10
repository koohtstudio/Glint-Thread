'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

/** Branded error page (PRD 6.7): retry button and a contact link. */
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <section className="container-x flex min-h-[70dvh] flex-col justify-center py-20">
      <p className="eyebrow">{t('error.eyebrow')}</p>
      <h1 className="t-hero mt-6 max-w-[14ch]">{t('error.title')}</h1>
      <p className="t-lede mt-8 max-w-[44ch]">{t('error.body')}</p>
      <div className="mt-10 flex flex-wrap items-center gap-8">
        <Button onClick={reset}>{t('error.retry')}</Button>
        <Link href="/contact" className="link-cta btn-label">
          <span>{t('error.contact')}</span>
        </Link>
      </div>
      {error.digest ? (
        <p className="tabular mt-10 text-[12px] text-bone-500">Ref {error.digest}</p>
      ) : null}
    </section>
  )
}
