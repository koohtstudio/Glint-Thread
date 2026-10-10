import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getCategories, getDepartments, searchProducts } from '@/lib/data'
import { computeFacets } from '@/lib/data/facets'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { Breadcrumbs } from '@/components/content/breadcrumbs'
import { ListingStatic, ListingView } from '@/components/listing/listing-view'
import { SearchIcon } from '@/components/ui/icons'

export const metadata: Metadata = pageMetadata({ title: 'Search', path: '/search', noindex: true })

async function Results({ searchParams }: { searchParams: PageProps<'/search'>['searchParams'] }) {
  const sp = await searchParams
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 80) ?? ''
  const [products, categories, departments] = await Promise.all([
    q ? searchProducts(q) : Promise.resolve([]),
    getCategories(),
    getDepartments(),
  ])
  const facets = computeFacets(
    products,
    categories.map((c) => ({ slug: c.slug, title: c.title })),
  )
  return (
    <>
      <header className="container-x pt-8 pb-10 lg:pt-10 lg:pb-14">
        <Breadcrumbs
          crumbs={[
            { name: t('nav.home'), href: '/' },
            { name: t('search.title'), href: '/search' },
          ]}
        />
        <p className="eyebrow mt-10 lg:mt-14">{t('search.title')}</p>
        <h1 className="t-h1 mt-4 max-w-[20ch]">
          {q ? t('search.resultsFor', { q }) : t('search.prompt')}
        </h1>
        <form
          action="/search"
          role="search"
          className="mt-8 flex max-w-xl items-center gap-3 border-b border-line-strong"
        >
          <SearchIcon className="shrink-0 text-bone-300" />
          <label htmlFor="search-page-input" className="sr-only">
            {t('search.label')}
          </label>
          <input
            id="search-page-input"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t('search.placeholder')}
            className="h-12 w-full bg-transparent text-[17px] outline-offset-4"
          />
          <button type="submit" className="btn-label h-11 px-2 text-bone-300 hover:text-bone-50">
            {t('search.submit')}
          </button>
        </form>
      </header>
      {products.length ? (
        <Suspense fallback={<ListingStatic products={products} facets={facets} tiles={[]} />}>
          <ListingView products={products} facets={facets} tiles={[]} />
        </Suspense>
      ) : (
        <div className="container-x border-t border-line pt-12 pb-28">
          {q ? (
            <p className="font-serif text-[32px] leading-tight">{t('search.noResults', { q })}</p>
          ) : null}
          <p className="mt-4 text-bone-300">{t('search.noResultsHint')}</p>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
            {departments.map((d) => (
              <li key={d.slug}>
                <Link href={`/shop/${d.slug}`} className="link-anim font-serif text-[24px]">
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <Suspense fallback={<div className="container-x min-h-[60vh] pt-10" aria-busy="true" />}>
      <Results searchParams={searchParams} />
    </Suspense>
  )
}
