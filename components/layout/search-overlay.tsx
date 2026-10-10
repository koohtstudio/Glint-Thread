'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { searchList, type SearchItem } from '@/lib/data/derive'
import { useUi } from '@/lib/ui-store'
import { formatMoney } from '@/lib/format'
import { t } from '@/lib/i18n'
import { CloseIcon, SearchIcon } from '@/components/ui/icons'

let indexPromise: Promise<SearchItem[]> | null = null
function loadIndex(): Promise<SearchItem[]> {
  indexPromise ??= fetch('/api/search-index')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => {
      indexPromise = null
      return []
    })
  return indexPromise
}

/**
 * Instant search overlay (PRD 6.5): debounced 150ms, up to 6 products with thumbnails, "See all results".
 * Empty state suggests department links.
 */
export function SearchOverlay({ departments }: { departments: { title: string; href: string }[] }) {
  const open = useUi((s) => s.searchOpen)
  const setOpen = useUi((s) => s.setSearch)
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [index, setIndex] = useState<SearchItem[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) loadIndex().then(setIndex)
  }, [open])

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 150)
    return () => clearTimeout(id)
  }, [q])

  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  const results = useMemo(
    () => (index && debounced.trim() ? searchList(index, debounced, 6) : []),
    [index, debounced],
  )
  const query = debounced.trim()

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-ink-950/60" />
        <Dialog.Content
          className="search-panel fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto border-b border-line bg-ink-900 outline-none"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <Dialog.Title className="sr-only">{t('search.title')}</Dialog.Title>
          <Dialog.Description className="sr-only">{t('search.label')}</Dialog.Description>
          <div className="container-x py-6 lg:py-10">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                if (q.trim()) {
                  router.push(`/search?q=${encodeURIComponent(q.trim())}`)
                  setOpen(false)
                }
              }}
              className="flex items-center gap-4 border-b border-line-strong"
            >
              <SearchIcon className="shrink-0 text-bone-300" />
              <label htmlFor="search-overlay-input" className="sr-only">
                {t('search.label')}
              </label>
              <input
                ref={inputRef}
                id="search-overlay-input"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search.placeholder')}
                autoComplete="off"
                enterKeyHint="search"
                aria-controls="search-results"
                className="h-16 w-full bg-transparent font-serif text-[28px] leading-none outline-offset-4 placeholder:text-bone-500 lg:h-20 lg:text-[40px]"
              />
              <Dialog.Close
                className="flex size-11 shrink-0 items-center justify-center text-bone-300 hover:text-bone-50"
                aria-label={t('a11y.closeSearch')}
              >
                <CloseIcon />
              </Dialog.Close>
            </form>

            <div id="search-results" aria-live="polite" className="mt-8 min-h-24">
              {query && index && results.length > 0 ? (
                <>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
                    {results.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/products/${p.slug}`} className="group block">
                          <div className="mat aspect-[4/5]">
                            {p.image ? (
                              <div className="mat-inner">
                                <Image
                                  src={p.image.src}
                                  alt={p.image.alt}
                                  fill
                                  sizes={
                                    p.image.lowRes
                                      ? `${p.image.width}px`
                                      : '(min-width: 1024px) 200px, 45vw'
                                  }
                                  placeholder={p.image.blurDataURL ? 'blur' : 'empty'}
                                  blurDataURL={p.image.blurDataURL}
                                  className="object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                          <p className="mt-3 line-clamp-2 text-[14px] leading-[1.4] font-medium group-hover:text-champagne-400">
                            {p.title}
                          </p>
                          <p className="price mt-1 text-[14px] text-bone-300">
                            {p.minPriceCents !== p.maxPriceCents ? 'From ' : ''}
                            {formatMoney(p.minPriceCents)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className="link-cta btn-label mt-8"
                  >
                    <span>{t('search.seeAll', { q: query })}</span>
                  </Link>
                </>
              ) : query && index ? (
                <div>
                  <p className="font-serif text-[28px] leading-tight">
                    {t('search.noResults', { q: query })}
                  </p>
                  <p className="mt-4 text-bone-300">{t('search.noResultsHint')}</p>
                  <DepartmentLinks departments={departments} />
                </div>
              ) : (
                <div>
                  <p className="eyebrow">{t('search.prompt')}</p>
                  <DepartmentLinks departments={departments} />
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DepartmentLinks({ departments }: { departments: { title: string; href: string }[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
      {departments.map((d) => (
        <li key={d.href}>
          <Link
            href={d.href}
            className="link-anim flex min-h-11 items-center font-serif text-[22px] text-bone-50"
          >
            {d.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
