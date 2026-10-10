'use client'

import Link from 'next/link'
import { fontVariables } from '@/lib/fonts'
import './globals.css'

/** Last-resort error boundary for the root layout. Keeps brand colours with system-safe markup. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en-CA" className={fontVariables}>
      <body className="flex min-h-dvh items-center bg-ink-950 text-bone-50">
        <main className="container-x py-20">
          <p className="eyebrow">Error</p>
          <h1 className="t-h1 mt-6">Something came unclasped.</h1>
          <p className="mt-6 max-w-[44ch] text-bone-300">
            That one&apos;s on us. Try again, and if it keeps happening, let us know.
          </p>
          <div className="mt-10 flex gap-8">
            <button
              type="button"
              onClick={reset}
              className="btn-label h-12 rounded-xs bg-bone-50 px-7 text-ink-950 hover:bg-champagne-400"
            >
              Try again
            </button>
            <Link href="/contact" className="link-cta btn-label">
              <span>Contact us</span>
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
