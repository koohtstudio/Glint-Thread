'use client'

import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

/**
 * One numbered checkout section (PRD 6.4.4). Mobile: only the current section is open; a finished one collapses
 * to a one-line summary with "Edit". Desktop (lg): every section stays open and Continue / Edit are hidden.
 */
export function Section({
  id,
  n,
  title,
  open,
  done,
  summary,
  onEdit,
  children,
}: {
  id: string
  n: number
  title: string
  open: boolean
  done: boolean
  summary?: ReactNode
  onEdit: () => void
  children: ReactNode
}) {
  const showSummary = !open && done
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cx('border-t border-line py-8 lg:py-10', !open && !done && 'max-lg:opacity-60')}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`${id}-title`} tabIndex={-1} className="flex items-baseline gap-4 outline-none">
          <span
            className="tabular font-serif text-[28px] leading-none text-bone-300"
            aria-hidden="true"
          >
            {n}
          </span>
          <span className="t-h3">{title}</span>
        </h2>
        {showSummary ? (
          <button
            type="button"
            onClick={onEdit}
            className="btn-label min-h-11 px-1 text-bone-300 underline-offset-4 hover:text-bone-50 hover:underline lg:hidden"
            aria-label={`${t('checkout.edit')}: ${title}`}
          >
            {t('checkout.edit')}
          </button>
        ) : null}
      </div>
      {showSummary ? (
        <div className="mt-4 text-[15px] leading-relaxed text-bone-300 lg:hidden">{summary}</div>
      ) : null}
      <div className={cx('mt-6 lg:pl-11', open ? 'block' : 'hidden lg:block')}>{children}</div>
    </section>
  )
}

/** A radio presented as a bordered row: saved addresses and shipping methods. */
export function ChoiceRow({
  name,
  value,
  checked,
  onChange,
  title,
  detail,
  aside,
  describedBy,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  title: string
  detail?: ReactNode
  aside?: ReactNode
  describedBy?: string
}) {
  return (
    <label
      className={cx(
        'grid cursor-pointer grid-cols-[20px_1fr_auto] items-start gap-4 border px-4 py-4 transition-colors duration-250 ease-gallery',
        checked ? 'border-bone-50 bg-ink-800' : 'border-line hover:border-line-strong',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-champagne-400',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 grid size-5 place-items-center rounded-full border',
          checked ? 'border-bone-50' : 'border-bone-500',
        )}
      >
        {checked ? <span className="size-2.5 rounded-full bg-bone-50" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] leading-snug font-medium">{title}</span>
        {detail ? (
          <span className="mt-1 block text-[14px] leading-snug text-bone-300">{detail}</span>
        ) : null}
      </span>
      {aside ? <span className="price text-[15px]">{aside}</span> : null}
    </label>
  )
}
