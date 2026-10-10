import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

/** Eyebrow + serif H2, left-aligned, with an optional action on the right (never centred, PRD 4.8 #8). */
export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
  className,
}: {
  id: string
  eyebrow: string
  title: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-x-8 gap-y-4', className)}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="t-h2 mt-4">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}
