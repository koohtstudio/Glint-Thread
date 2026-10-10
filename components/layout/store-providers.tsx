'use client'

import type { ReactNode } from 'react'
import type { Nav } from '@/lib/nav'
import { useQuoteSync } from '@/lib/cart/use-quote-sync'
import { MotionProvider } from '@/components/ui/motion'
import { Toaster } from '@/components/ui/toaster'
import { BagDrawer } from '@/components/cart/bag-drawer'
import type { BagConfig } from '@/components/cart/bag-contents'
import { QuickAddSheet } from '@/components/product/quick-add-sheet'
import { MobileMenu } from './mobile-menu'
import { SearchOverlay } from './search-overlay'

function QuoteSync() {
  useQuoteSync()
  return null
}

/** Client-side islands shared by every store page: bag, quick add, menus, search, toasts. */
export function StoreProviders({
  children,
  bag,
  nav,
}: {
  children: ReactNode
  bag: BagConfig
  nav: Nav
}) {
  return (
    <MotionProvider>
      {children}
      <QuoteSync />
      <BagDrawer config={bag} />
      <QuickAddSheet />
      <MobileMenu nav={nav} />
      <SearchOverlay departments={nav.all.map((d) => ({ title: d.title, href: d.href }))} />
      <Toaster />
    </MotionProvider>
  )
}
