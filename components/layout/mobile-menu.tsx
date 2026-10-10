'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Nav } from '@/lib/nav'
import { useUi } from '@/lib/ui-store'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { Sheet } from '@/components/ui/sheet'
import { PlusIcon, SearchIcon } from '@/components/ui/icons'

const FOOTER_LINKS = [
  { href: '/shipping-returns', key: 'footer.shippingReturns' },
  { href: '/faq', key: 'footer.faq' },
  { href: '/order-status', key: 'footer.orderStatus' },
  { href: '/contact', key: 'footer.contact' },
  { href: '/about', key: 'footer.ourStory' },
] as const

/** Mobile menu (PRD 4.6): full-height sheet from the left, search on top, large serif departments. */
export function MobileMenu({ nav }: { nav: Nav }) {
  const open = useUi((s) => s.menuOpen)
  const setOpen = useUi((s) => s.setMenu)
  const router = useRouter()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])

  return (
    <Sheet open={open} onOpenChange={setOpen} side="left" title={t('nav.shop')} hideTitle>
      <div className="flex min-h-full flex-col px-5 pt-4 pb-8">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`)
            setOpen(false)
          }}
          className="flex items-center gap-3 border-b border-line-strong"
        >
          <SearchIcon className="shrink-0 text-bone-300" />
          <label htmlFor="mobile-search" className="sr-only">
            {t('search.label')}
          </label>
          <input
            id="mobile-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-12 w-full bg-transparent text-base outline-offset-4"
            enterKeyHint="search"
          />
        </form>

        <nav aria-label={t('a11y.mainNav')} className="mt-6">
          <ul>
            {nav.all.map((d) => {
              const isOpen = expanded === d.slug
              return (
                <li key={d.slug} className="border-b border-line">
                  <div className="flex items-center justify-between">
                    <Link
                      href={d.href}
                      className="flex min-h-14 flex-1 items-center py-2 font-serif text-[32px] leading-none"
                    >
                      {d.title}
                    </Link>
                    {d.categories.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : d.slug)}
                        aria-expanded={isOpen}
                        aria-controls={`mm-${d.slug}`}
                        aria-label={`${d.title}: ${isOpen ? 'hide' : 'show'} categories`}
                        className="flex size-11 items-center justify-center text-bone-300"
                      >
                        <PlusIcon
                          className={cx(
                            'transition-transform duration-250 ease-gallery',
                            isOpen && 'rotate-45',
                          )}
                        />
                      </button>
                    ) : null}
                  </div>
                  {d.categories.length > 1 ? (
                    <ul id={`mm-${d.slug}`} hidden={!isOpen} className="pb-4">
                      <li>
                        <Link
                          href={d.href}
                          className="flex min-h-11 items-center text-[15px] text-bone-300"
                        >
                          {t('nav.shopAll', { department: d.title.toLowerCase() })}
                        </Link>
                      </li>
                      {d.categories.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={c.href}
                            className="flex min-h-11 items-center text-[15px] text-bone-300"
                          >
                            {c.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
            <li className="border-b border-line">
              <Link
                href={nav.gifts.href}
                className="flex min-h-14 items-center py-2 font-serif text-[32px] leading-none italic"
              >
                {nav.gifts.label}
              </Link>
            </li>
          </ul>
        </nav>

        <ul className="mt-auto grid grid-cols-2 gap-x-4 pt-10">
          {FOOTER_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-11 items-center text-[13px] text-bone-300">
                {t(l.key)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
