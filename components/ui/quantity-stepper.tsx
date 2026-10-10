'use client'

import { MinusIcon, PlusIcon } from './icons'
import { t } from '@/lib/i18n'
import { cx } from '@/lib/cx'

interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'md' | 'sm'
  label?: string
  className?: string
}

/** Hairline quantity stepper with 44px tap targets and tabular numerals. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = 'md',
  label,
  className,
}: Props) {
  const h = size === 'md' ? 'h-12' : 'h-11'
  return (
    <div
      role="group"
      aria-label={label ?? t('a11y.quantity')}
      className={cx('inline-flex items-stretch rounded-xs border border-line-strong', h, className)}
    >
      <button
        type="button"
        className="flex w-11 items-center justify-center text-bone-300 transition-colors hover:text-bone-50 disabled:cursor-not-allowed disabled:text-bone-700"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={t('a11y.decrease')}
      >
        <MinusIcon size={16} />
      </button>
      <output
        aria-live="polite"
        className="tabular flex min-w-8 items-center justify-center text-[15px] font-medium"
      >
        {value}
      </output>
      <button
        type="button"
        className="flex w-11 items-center justify-center text-bone-300 transition-colors hover:text-bone-50 disabled:cursor-not-allowed disabled:text-bone-700"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={t('a11y.increase')}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  )
}
