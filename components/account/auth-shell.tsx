import type { ReactNode } from 'react'
import { t } from '@/lib/i18n'

/** Editorial frame for the public auth pages: title and intro on the left, the form on the right (PRD 6.4, 9.9). */
export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <div className="container-x pt-12 pb-28 lg:pt-20">
      <div className="grid-editorial gap-y-10">
        <div className="col-span-4 md:col-span-6 lg:col-span-5">
          <p className="eyebrow">{t('auth.eyebrow')}</p>
          <h1 className="t-h1 mt-4">{title}</h1>
          {intro ? <p className="t-lede mt-6 max-w-[40ch]">{intro}</p> : null}
        </div>
        <div className="col-span-4 md:col-span-6 lg:col-span-5 lg:col-start-8">{children}</div>
      </div>
    </div>
  )
}

export function AccountsUnavailable() {
  return (
    <p className="text-[15px] leading-relaxed text-bone-300" data-testid="accounts-unavailable">
      {t('auth.unavailable')}
    </p>
  )
}
