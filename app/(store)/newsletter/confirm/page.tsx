import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getPromoCodes } from '@/lib/data'
import { emailShell, sendEmail } from '@/lib/email/send'
import { NewsletterWelcomeEmail } from '@/lib/email/templates/emails'
import { confirmSubscriber } from '@/lib/subscribers'
import { signToken, verifyToken } from '@/lib/tokens'
import { absoluteUrl } from '@/lib/public-env'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = pageMetadata({
  title: 'Newsletter',
  path: '/newsletter/confirm',
  noindex: true,
})

/** Double opt-in landing (PRD 9.7): confirms, adds to Resend, emails WELCOME10, and shows the code. */
async function Confirm({
  searchParams,
}: {
  searchParams: PageProps<'/newsletter/confirm'>['searchParams']
}) {
  const sp = await searchParams
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  const email = str(sp.email).toLowerCase()
  const token = str(sp.token)
  const consentAt = str(sp.at)
  const source = str(sp.src)
  const version = str(sp.v)
  if (
    !email ||
    !consentAt ||
    !verifyToken('confirm', email, token, `${consentAt}|${source}|${version}`)
  ) {
    return <p className="t-lede mt-8">{t('newsletter.invalidLink')}</p>
  }
  // The consent record (wording version, time of the tick, source) goes to Resend only (PRD 9.8).
  const state = await confirmSubscriber(email, { consentVersion: version, consentAt, source })
  const code =
    (await getPromoCodes()).find((c) => c.code === 'WELCOME10' && c.active)?.code ?? 'WELCOME10'
  if (state === 'confirmed' || state === 'logged') {
    const unsubscribeUrl = absoluteUrl(
      `/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${signToken('unsubscribe', email)}`,
    )
    await sendEmail({
      to: email,
      subject: `Your code: ${code}`,
      react: NewsletterWelcomeEmail({
        code,
        shell: { ...(await emailShell()), marketing: { unsubscribeUrl } },
      }),
      headers: {
        'List-Unsubscribe': `<${absoluteUrl(`/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${signToken('unsubscribe', email)}`)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
  }
  return (
    <>
      <p className="t-lede mt-8">{t('newsletter.confirmedBody')}</p>
      <p className="mt-6 font-serif text-[clamp(2.5rem,6vw,4rem)] leading-none tracking-[0.04em] text-champagne-400">
        {code}
      </p>
      <p className="mt-6 text-[15px] text-bone-300">{t('newsletter.confirmedHow')}</p>
      <Button asChild className="mt-10">
        <Link href="/shop/jewellery">{t('home.heroPrimary')}</Link>
      </Button>
    </>
  )
}

export default function ConfirmPage({ searchParams }: PageProps<'/newsletter/confirm'>) {
  return (
    <div className="container-x pt-16 pb-28 lg:pt-24">
      <div className="max-w-[680px]">
        <p className="eyebrow">{t('newsletter.eyebrow')}</p>
        <h1 className="t-h1 mt-4">{t('newsletter.confirmedTitle')}</h1>
        <Suspense fallback={<div className="mt-8 min-h-40" aria-busy="true" />}>
          <Confirm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
