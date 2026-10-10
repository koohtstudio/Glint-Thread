import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

/** Tiny uppercase label for the top-left of a mat (PRD 4.6). No colours: bone on ink-950/70. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-block bg-ink-950/70 px-2 py-1 text-[10px] leading-none font-medium tracking-[0.14em] text-bone-50 uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}
