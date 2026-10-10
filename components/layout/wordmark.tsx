import Link from 'next/link'
import { cx } from '@/lib/cx'

/** Typeset wordmark (PRD 4.6): Instrument Serif 26px, the ampersand in italic. */
export function Wordmark({ className, asLink = true }: { className?: string; asLink?: boolean }) {
  const mark = (
    <span
      className={cx(
        'font-serif text-[22px] leading-none tracking-[-0.01em] whitespace-nowrap sm:text-[26px]',
        className,
      )}
    >
      Glint <em className="font-serif italic">&amp;</em> Thread
    </span>
  )
  if (!asLink) return mark
  return (
    <Link href="/" aria-label="Glint & Thread, home" className="inline-flex min-h-11 items-center">
      {mark}
    </Link>
  )
}
