import type { Crumb } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { Breadcrumbs } from '@/components/content/breadcrumbs'

/** Listing header block (PRD 6.2): eyebrow, serif H1, one-line blurb, product count. Left-aligned. */
export function ListingHeader({
  eyebrow,
  title,
  blurb,
  count,
  crumbs,
  children,
}: {
  eyebrow: string
  title: string
  blurb?: string
  count: number
  crumbs: Crumb[]
  children?: React.ReactNode
}) {
  return (
    <header className="container-x pt-8 pb-10 lg:pt-10 lg:pb-14">
      <Breadcrumbs crumbs={crumbs} />
      <div className="grid-editorial mt-10 gap-y-6 lg:mt-14">
        <div className="col-span-4 md:col-span-6 lg:col-span-8">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="t-h1 mt-4">{title}</h1>
        </div>
        <div className="col-span-4 flex flex-col justify-end md:col-span-5 lg:col-span-4 lg:col-start-9">
          {blurb ? <p className="t-lede max-w-[42ch]">{blurb}</p> : null}
          <p className="eyebrow tabular mt-4">
            {count === 1 ? t('listing.result') : t('listing.results', { count })}
          </p>
        </div>
      </div>
      {children}
    </header>
  )
}
