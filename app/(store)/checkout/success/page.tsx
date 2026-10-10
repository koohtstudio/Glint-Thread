import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { loadConfirmation } from '@/lib/checkout/summary'
import { env } from '@/lib/env'
import { formatMoney } from '@/lib/format'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { ClearBag } from '@/components/cart/clear-bag'

export const metadata: Metadata = pageMetadata({
  title: 'Order confirmed',
  path: '/checkout/success',
  noindex: true,
})

async function Confirmation({
  searchParams,
}: {
  searchParams: PageProps<'/checkout/success'>['searchParams']
}) {
  // Everything here is per-request (the PaymentIntent is retrieved with the secret key).
  await connection()
  const sp = await searchParams
  const pick = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const view =
    pick('payment_intent') && pick('payment_intent_client_secret')
      ? await loadConfirmation(pick('payment_intent'), pick('payment_intent_client_secret'))
      : null

  if (!view) {
    return (
      <div className="max-w-2xl">
        <p className="eyebrow">{t('success.eyebrow')}</p>
        <h1 className="t-h1 mt-4">{t('success.title')}</h1>
        <p className="t-lede mt-8">{t('success.missing')}</p>
        <Button asChild variant="secondary" className="mt-10">
          <Link href="/order-status">{t('orderStatus.title')}</Link>
        </Button>
      </div>
    )
  }

  if (view.state === 'failed') {
    return (
      <div className="max-w-2xl">
        <p className="eyebrow">{t('success.eyebrow')}</p>
        <h1 className="t-h1 mt-4">{t('success.failedTitle')}</h1>
        <p className="t-lede mt-8">{t('success.failedBody')}</p>
        <Button asChild className="mt-10">
          <Link href="/checkout">{t('success.tryAgain')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid-editorial gap-y-14">
      <ClearBag />
      <div className="col-span-4 md:col-span-6 lg:col-span-6">
        <p className="eyebrow">{t('success.eyebrow')}</p>
        <h1 className="t-hero mt-5">{t('success.title')}</h1>
        <p className="t-lede mt-8 max-w-[44ch]">
          {view.email
            ? t('success.intro', { orderNumber: view.orderNumber, email: view.email })
            : t('success.introNoEmail', { orderNumber: view.orderNumber })}
        </p>
        {view.state === 'processing' ? (
          <p className="mt-4 text-[15px] text-champagne-400">{t('success.processing')}</p>
        ) : null}
        <h2 className="eyebrow mt-14">{t('success.next')}</h2>
        <ol className="mt-5 space-y-4">
          {[t('success.step1'), t('success.step2'), t('success.step3')].map((s, i) => (
            <li
              key={s}
              className="grid grid-cols-[2rem_1fr] text-[15px] leading-relaxed text-bone-300"
            >
              <span className="tabular font-serif text-[22px] leading-none text-bone-50">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <Button asChild className="mt-12">
          <Link href="/shop">{t('success.keepBrowsing')}</Link>
        </Button>
      </div>
      <section
        aria-labelledby="summary-title"
        className="col-span-4 border border-line bg-ink-900 p-6 md:col-span-6 lg:col-span-5 lg:col-start-8 lg:self-start lg:p-8"
      >
        <h2 id="summary-title" className="eyebrow">
          {t('success.summary')}{' '}
          <span className="tabular ml-2 text-bone-50">{view.orderNumber}</span>
        </h2>
        {view.detailed ? (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {view.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 py-3 text-[14px]">
                <span>
                  {item.title} <span className="tabular text-bone-500">× {item.qty}</span>
                </span>
                <span className="price">{formatMoney(item.totalCents)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <dl className="mt-4 space-y-2 text-[14px]">
          {view.detailed ? (
            <>
              <div className="flex justify-between">
                <dt className="text-bone-300">{t('bag.subtotal')}</dt>
                <dd className="price">{formatMoney(view.subtotalCents)}</dd>
              </div>
              {view.discountCents ? (
                <div className="flex justify-between">
                  <dt className="text-bone-300">{t('success.discount')}</dt>
                  <dd className="price">{`−${formatMoney(view.discountCents)}`}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-bone-300">{t('success.shipping')}</dt>
                <dd className="price">
                  {view.shippingCents ? formatMoney(view.shippingCents) : t('checkout.free')}
                </dd>
              </div>
              {view.taxLines.map((line) => (
                <div key={`${line.code}-${line.ratePercent}`} className="flex justify-between">
                  <dt className="text-bone-300">{line.label}</dt>
                  <dd className="price">{formatMoney(line.amountCents)}</dd>
                </div>
              ))}
            </>
          ) : null}
          <div className="flex justify-between border-t border-line pt-3 text-[16px]">
            <dt>{view.state === 'succeeded' ? t('success.paid') : t('success.total')}</dt>
            <dd className="price">{formatMoney(view.totalCents)}</dd>
          </div>
        </dl>
        {view.detailed && view.taxLines.length && env.GST_HST_NUMBER ? (
          <p className="mt-4 text-[12px] text-bone-500">
            {t('checkout.gstHst', { number: env.GST_HST_NUMBER })}
          </p>
        ) : null}
      </section>
    </div>
  )
}

export default function SuccessPage({ searchParams }: PageProps<'/checkout/success'>) {
  return (
    <div className="container-x pt-12 pb-28 lg:pt-20">
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
