'use client'

import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Nav, NavDepartment } from '@/lib/nav'
import { useCart, selectCount } from '@/lib/cart/store'
import { useUi } from '@/lib/ui-store'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { BagIcon, MenuIcon, SearchIcon } from '@/components/ui/icons'
import { Wordmark } from './wordmark'

/**
 * Header (PRD 4.6): 64px mobile, 76px desktop. Transparent over the home hero, then ink-950/85 with
 * backdrop blur and a bottom hairline after 24px of scroll. Desktop nav left, wordmark centred,
 * search and bag right. Mobile: menu left, wordmark centre, bag right.
 */
export function Header({ nav }: { nav: Nav }) {
  const pathname = usePathname()
  const overHero = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [menuValue, setMenuValue] = useState('')
  const count = useCart(selectCount)
  const hydrated = useCart((s) => s.hydrated)
  const openBag = useCart((s) => s.open)
  const openSearch = useUi((s) => s.openSearch)
  const openMenu = useUi((s) => s.openMenu)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mega menu on route change (PRD 4.6), using the render-time reset pattern.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMenuValue('')
  }

  const solid = !overHero || scrolled || menuValue !== ''

  return (
    <header
      className={cx(
        'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ease-gallery',
        solid
          ? 'border-b border-line bg-ink-950/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-x relative grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[76px]">
        {/* Left: menu button below xl, department nav from xl */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={openMenu}
            className="-ml-3 flex size-11 items-center justify-center text-bone-50 xl:hidden"
            aria-label={t('a11y.openMenu')}
          >
            <MenuIcon />
          </button>
          <NavigationMenu.Root
            value={menuValue}
            onValueChange={setMenuValue}
            delayDuration={120}
            skipDelayDuration={300}
            aria-label={t('a11y.mainNav')}
            className="hidden xl:block"
          >
            <NavigationMenu.List className="flex items-center gap-6 text-[13px] font-medium">
              {nav.primary.map((d) => (
                <DepartmentItem key={d.slug} department={d} pathname={pathname} />
              ))}
              <NavigationMenu.Item value="more">
                <NavigationMenu.Trigger className="link-anim flex h-11 items-center text-bone-50 data-[state=open]:after:scale-x-100">
                  {t('nav.more')}
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="mega-content">
                  <MegaPanel departments={nav.more} />
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild active={pathname === nav.gifts.href}>
                  <Link
                    href={nav.gifts.href}
                    className="link-anim flex h-11 items-center text-bone-50"
                    aria-current={pathname === nav.gifts.href ? 'page' : undefined}
                  >
                    {nav.gifts.label}
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            <div className="absolute inset-x-0 top-full">
              <NavigationMenu.Viewport className="mega-viewport relative h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden border-b border-line bg-ink-900" />
            </div>
          </NavigationMenu.Root>
        </div>

        <Wordmark />

        <div className="flex items-center justify-end gap-1 sm:gap-3">
          <button
            type="button"
            onClick={openSearch}
            className="hidden h-11 items-center gap-2 px-2 text-[13px] font-medium text-bone-50 sm:flex"
            aria-label={t('a11y.openSearch')}
          >
            <SearchIcon />
            <span className="hidden xl:inline">{t('nav.search')}</span>
          </button>
          <button
            type="button"
            onClick={openBag}
            className="-mr-2 flex h-11 items-center gap-2 px-2 text-[13px] font-medium text-bone-50"
            aria-label={t('a11y.openBag', { count: hydrated ? count : 0 })}
          >
            <BagIcon />
            <span className="hidden xl:inline">{t('nav.bag')}</span>
            {/* Fixed-width count so hydration never shifts the layout (PRD 4.8 #10). */}
            <span className="tabular inline-block w-[2ch] text-left" aria-hidden="true">
              {hydrated && count > 0 ? count : ''}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}

function DepartmentItem({ department, pathname }: { department: NavDepartment; pathname: string }) {
  const active = pathname.startsWith(department.href)
  return (
    <NavigationMenu.Item value={department.slug}>
      <NavigationMenu.Trigger
        className="link-anim flex h-11 items-center text-bone-50 data-[state=open]:after:scale-x-100"
        aria-current={active ? 'true' : undefined}
      >
        {department.title}
      </NavigationMenu.Trigger>
      <NavigationMenu.Content className="mega-content">
        <MegaPanel departments={[department]} />
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  )
}

/** Full-width ink-900 panel: category links in columns plus one editorial tile with a caption. */
function MegaPanel({ departments }: { departments: NavDepartment[] }) {
  const tile = departments[0]?.tile
  return (
    <div className="container-x grid grid-cols-12 gap-6 py-10">
      <div
        className={cx(
          'col-span-8 grid gap-10',
          departments.length > 1 ? 'grid-cols-3' : 'grid-cols-2',
        )}
      >
        {departments.map((d) => (
          <div key={d.slug}>
            <NavigationMenu.Link asChild>
              <Link href={d.href} className="group inline-block">
                <span className="font-serif text-[32px] leading-none text-bone-50 transition-colors group-hover:text-champagne-400">
                  {d.title}
                </span>
                <span className="eyebrow mt-3 block">
                  {t('nav.shopAll', { department: d.title.toLowerCase() })}
                </span>
              </Link>
            </NavigationMenu.Link>
            {d.categories.length > 1 || departments.length > 1 ? (
              <ul className="mt-6 space-y-1">
                {d.categories.map((c) => (
                  <li key={c.slug}>
                    <NavigationMenu.Link asChild>
                      <Link
                        href={c.href}
                        className="link-anim py-1 text-[15px] text-bone-300 hover:text-bone-50"
                      >
                        {c.title}
                      </Link>
                    </NavigationMenu.Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      {tile ? (
        <NavigationMenu.Link asChild>
          <Link href={departments[0].href} className="group col-span-4 col-start-9 block">
            <div className="relative aspect-[16/10] overflow-hidden bg-ink-950">
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(min-width: 1440px) 440px, 30vw"
                placeholder={tile.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={tile.blurDataURL}
                className="motion-transform object-cover transition-transform duration-900 ease-gallery group-hover:scale-[1.03]"
              />
            </div>
            <p className="mt-3 text-[14px] text-bone-300">{tile.line}</p>
          </Link>
        </NavigationMenu.Link>
      ) : null}
    </div>
  )
}
