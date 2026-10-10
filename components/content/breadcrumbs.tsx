import Link from 'next/link'
import type { Crumb } from '@/lib/seo'
import { breadcrumbJsonLd } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { JsonLd } from './json-ld'

/** Breadcrumbs (PRD 5.4) with matching BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumbs({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  return (
    <>
      <nav aria-label={t('a11y.breadcrumb')} className={className}>
        <ol className="flex flex-wrap items-center gap-x-2 text-[12px] text-bone-500">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <li key={c.href} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-bone-300">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={c.href}
                      className="link-host inline-flex min-h-8 items-center hover:text-bone-50"
                    >
                      <span className="link-anim">{c.name}</span>
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  )
}
