import type { ColourSwatch } from '@/lib/data/types'
import { t } from '@/lib/i18n'

/** Up to five colour dots plus "+n" (PRD 4.6). Always paired with a text label for screen readers. */
export function Swatches({ colours, max = 5 }: { colours: ColourSwatch[]; max?: number }) {
  const withHex = colours.filter((c) => c.hex)
  if (withHex.length < 2) return null
  const shown = withHex.slice(0, max)
  const extra = withHex.length - shown.length
  return (
    <div
      className="mt-2 flex items-center gap-1.5"
      aria-label={t('a11y.colours', { colours: withHex.map((c) => c.label).join(', ') })}
      role="img"
    >
      {shown.map((c) => (
        <span
          key={`${c.label}-${c.hex}`}
          className="size-2.5 rounded-full border border-line-strong"
          style={{ backgroundColor: c.hex ?? undefined }}
          aria-hidden="true"
        />
      ))}
      {extra > 0 ? (
        <span className="tabular ml-0.5 text-[11px] leading-none text-bone-500" aria-hidden="true">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}
