import Link from 'next/link'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { SignOutButton, VerifyBanner } from './account-controls'

const SECTIONS = [
  { key: 'overview', href: '/account', label: 'account.navOverview' },
  { key: 'orders', href: '/account/orders', label: 'account.navOrders' },
  { key: 'addresses', href: '/account/addresses', label: 'account.navAddresses' },
  { key: 'profile', href: '/account/profile', label: 'account.navProfile' },
  { key: 'preferences', href: '/account/preferences', label: 'account.navPreferences' },
] as const

export type AccountSection = (typeof SECTIONS)[number]['key']

/** Frame for the signed-in pages: eyebrow, title, section links, sign-out and the verify-email banner (PRD 9.9). */
export function AccountShell({
  active,
  title,
  intro,
  emailVerified = true,
  email,
  children,
}: {
  active: AccountSection
  title: string
  intro?: string
  emailVerified?: boolean
  email?: string | null
  children: ReactNode
}) {
  return (
    <div className="container-x pt-10 pb-28 lg:pt-14">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow">{t('account.title')}</p>
          <h1 className="t-h1 mt-4">{title}</h1>
          {intro ? <p className="t-lede mt-5 max-w-[48ch]">{intro}</p> : null}
        </div>
        <SignOutButton />
      </div>

      <nav aria-label={t('account.navLabel')} className="mt-10 border-b border-line">
        <ul className="-mb-px flex flex-wrap gap-x-8 gap-y-1">
          {SECTIONS.map((s) => (
            <li key={s.key}>
              <Link
                href={s.href}
                aria-current={s.key === active ? 'page' : undefined}
                className={cx(
                  'flex min-h-12 items-center border-b-2 text-[14px] transition-colors duration-250 ease-gallery',
                  s.key === active
                    ? 'border-champagne-400 text-bone-50'
                    : 'border-transparent text-bone-300 hover:text-bone-50',
                )}
              >
                {t(s.label)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {!emailVerified ? <VerifyBanner email={email ?? ''} /> : null}
      <div className="mt-10 lg:mt-14">{children}</div>
    </div>
  )
}
