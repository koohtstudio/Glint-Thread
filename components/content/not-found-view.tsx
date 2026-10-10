import Link from 'next/link'
import { t } from '@/lib/i18n'
import { SearchIcon } from '@/components/ui/icons'

const DEPARTMENTS = [
  { title: 'Jewellery', href: '/shop/jewellery' },
  { title: 'Hats & Scarves', href: '/shop/hats-scarves' },
  { title: 'Bags', href: '/shop/bags' },
  { title: 'Socks', href: '/shop/socks' },
]

/** Branded 404 (PRD 6.7): full-height ink-950, the serif line, a search field and four department links. */
export function NotFoundView() {
  return (
    <section className="container-x flex min-h-[calc(100dvh-112px)] flex-col justify-center py-20">
      <div className="grid-editorial gap-y-12">
        <div className="col-span-4 md:col-span-6 lg:col-span-8">
          <p className="eyebrow">{t('notFound.eyebrow')}</p>
          <h1 className="t-hero mt-6 max-w-[16ch]">{t('notFound.title')}</h1>
        </div>
        <div className="col-span-4 md:col-span-5 lg:col-span-4 lg:col-start-9 lg:self-end">
          <p className="text-[15px] text-bone-300">{t('notFound.body')}</p>
          <form
            action="/search"
            role="search"
            className="mt-6 flex items-center gap-3 border-b border-line-strong"
          >
            <SearchIcon className="shrink-0 text-bone-300" />
            <label htmlFor="nf-search" className="sr-only">
              {t('search.label')}
            </label>
            <input
              id="nf-search"
              name="q"
              type="search"
              placeholder={t('search.placeholder')}
              className="h-12 w-full bg-transparent outline-offset-4"
            />
          </form>
          <ul className="mt-8 grid grid-cols-2 gap-x-6">
            {DEPARTMENTS.map((d) => (
              <li key={d.href}>
                <Link
                  href={d.href}
                  className="link-host flex min-h-12 items-center font-serif text-[24px]"
                >
                  <span className="link-anim">{d.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
