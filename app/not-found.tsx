import type { Metadata } from 'next'
import { NotFoundView } from '@/components/content/not-found-view'
import { Wordmark } from '@/components/layout/wordmark'

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } }

/** Unmatched URLs render outside the store layout, so this adds a quiet header of its own. */
export default function NotFound() {
  return (
    <>
      <header className="border-b border-line">
        <div className="container-x flex h-16 items-center justify-center lg:h-[76px]">
          <Wordmark />
        </div>
      </header>
      <main id="main">
        <NotFoundView />
      </main>
    </>
  )
}
