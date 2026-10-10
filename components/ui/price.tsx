import { formatMoney } from '@/lib/format'
import { cx } from '@/lib/cx'

interface PriceProps {
  cents: number
  /** Shown struck through only when a real compare-at price exists (Competition Act, PRD 12.2). */
  compareAtCents?: number | null
  /** Renders "From $x" when variant prices differ. */
  fromCents?: number | null
  className?: string
}

export function Price({ cents, compareAtCents, fromCents, className }: PriceProps) {
  const showCompare = typeof compareAtCents === 'number' && compareAtCents > cents
  return (
    <span className={cx('price inline-flex items-baseline gap-2', className)}>
      {typeof fromCents === 'number' ? (
        <span>
          <span className="font-normal text-bone-300">From </span>
          {formatMoney(fromCents)}
        </span>
      ) : (
        <span>{formatMoney(cents)}</span>
      )}
      {showCompare ? (
        <s className="font-normal text-bone-500">
          <span className="sr-only">Was </span>
          {formatMoney(compareAtCents)}
        </s>
      ) : null}
    </span>
  )
}
