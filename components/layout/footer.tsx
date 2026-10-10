import Link from 'next/link'
import { cacheLife } from 'next/cache'
import type { Nav } from '@/lib/nav'
import type { SiteSettings } from '@/lib/data/types'
import { t } from '@/lib/i18n'
import { Wordmark } from './wordmark'
import { FooterNewsletter } from './footer-newsletter'

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="link-host flex min-h-11 items-center text-[14px] text-bone-300 hover:text-bone-50 pointer-fine:min-h-8"
    >
      <span className="link-anim">{children}</span>
    </Link>
  )
}

async function currentYear() {
  'use cache'
  cacheLife('days')
  return new Date().getFullYear()
}

const HELP = [
  { href: '/shipping-returns', key: 'footer.shippingReturns' },
  { href: '/faq', key: 'footer.faq' },
  { href: '/care', key: 'footer.care' },
  { href: '/size-guide', key: 'footer.sizeGuide' },
  { href: '/order-status', key: 'footer.orderStatus' },
  { href: '/contact', key: 'footer.contact' },
] as const

const ABOUT = [
  { href: '/about', key: 'footer.ourStory' },
  { href: '/accessibility', key: 'footer.accessibility' },
  { href: '/privacy', key: 'footer.privacy' },
  { href: '/terms', key: 'footer.terms' },
] as const

/** Footer (PRD 5.4): Shop, Help, About, Newsletter columns, and the sign-off line. */
export async function Footer({ nav, settings }: { nav: Nav; settings: SiteSettings }) {
  const year = await currentYear()
  const [first, ...rest] = settings.footerSignOff.split('. ')
  return (
    <footer className="border-t border-line bg-ink-950" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">
        {t('a11y.footerNav')}
      </h2>
      <div className="container-x pt-16 pb-10 lg:pt-24">
        <p className="t-h2 max-w-[14ch] text-bone-50 lg:max-w-none">
          {rest.length ? (
            <>
              {first}. <em className="italic">{rest.join('. ')}</em>
            </>
          ) : (
            settings.footerSignOff
          )}
        </p>

        <div className="grid-editorial mt-16 gap-y-12 lg:mt-24">
          <nav aria-label={t('footer.shop')} className="col-span-2 md:col-span-2 lg:col-span-2">
            <h2 className="eyebrow">{t('footer.shop')}</h2>
            <ul className="mt-3">
              {nav.all.map((d) => (
                <li key={d.slug}>
                  <FooterLink href={d.href}>{d.title}</FooterLink>
                </li>
              ))}
              <li>
                <FooterLink href={nav.gifts.href}>{nav.gifts.label}</FooterLink>
              </li>
            </ul>
          </nav>
          <nav aria-label={t('footer.help')} className="col-span-2 md:col-span-2 lg:col-span-2">
            <h2 className="eyebrow">{t('footer.help')}</h2>
            <ul className="mt-3">
              {HELP.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{t(l.key)}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t('footer.about')} className="col-span-4 md:col-span-2 lg:col-span-2">
            <h2 className="eyebrow">{t('footer.about')}</h2>
            <ul className="mt-3">
              {ABOUT.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{t(l.key)}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="col-span-4 md:col-span-6 lg:col-span-5 lg:col-start-8">
            <FooterNewsletter />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 text-[12px] text-bone-500 sm:flex-row sm:items-center sm:justify-between lg:mt-24">
          <Wordmark className="text-bone-300 sm:text-[22px]" />
          <p className="tabular">{t('footer.copyright', { year })}</p>
          <p>{t('footer.madeIn')}</p>
        </div>
      </div>
    </footer>
  )
}
