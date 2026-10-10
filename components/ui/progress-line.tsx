import { cx } from '@/lib/cx'

/** 2px hairline track filling in champagne (free-shipping progress, PRD 4.6). */
export function ProgressLine({
  value,
  max,
  label,
  className,
}: {
  value: number
  max: number
  label: string
  className?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className={cx('relative h-0.5 w-full overflow-hidden bg-line', className)}
    >
      <div
        className="absolute inset-y-0 left-0 w-full origin-left bg-champagne-400 transition-transform duration-700 ease-gallery"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  )
}
