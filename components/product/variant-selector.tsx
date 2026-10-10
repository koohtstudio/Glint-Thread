'use client'

import { useMemo, useRef, type KeyboardEvent } from 'react'
import type { Variant } from '@/lib/data/types'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

interface Props {
  optionNames: string[]
  variants: Variant[]
  selectedSku: string | null
  onSelect: (sku: string) => void
  idPrefix?: string
}

/** Values per option, in catalogue order. */
function optionValues(optionNames: string[], variants: Variant[]) {
  return optionNames.map((name) => ({
    name,
    values: [...new Set(variants.map((v) => v.options[name]).filter(Boolean))],
  }))
}

/**
 * Variant chips (PRD 4.6): text labels (never colour-only), selected = bone border and text,
 * sold out = diagonal hairline strike + aria-disabled. Each option is a radio group with arrow-key navigation.
 */
export function VariantSelector({
  optionNames,
  variants,
  selectedSku,
  onSelect,
  idPrefix = 'opt',
}: Props) {
  const groups = useMemo(() => optionValues(optionNames, variants), [optionNames, variants])
  const selected = variants.find((v) => v.sku === selectedSku) ?? null
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  if (!optionNames.length || variants.length < 2) return null

  const resolve = (name: string, value: string): Variant | undefined => {
    const wanted = { ...(selected?.options ?? {}), [name]: value }
    const exact = variants.find((v) => optionNames.every((n) => v.options[n] === wanted[n]))
    if (exact) return exact
    // Fall back to the first available variant with this value, then any variant with it.
    return (
      variants.find((v) => v.options[name] === value && v.available) ??
      variants.find((v) => v.options[name] === value)
    )
  }

  const isAvailable = (name: string, value: string) => {
    const others = Object.entries(selected?.options ?? {}).filter(([n]) => n !== name)
    const withValue = variants.filter((v) => v.options[name] === value)
    const matching = withValue.filter((v) => others.every(([n, val]) => v.options[n] === val))
    return (matching.length ? matching : withValue).some((v) => v.available)
  }

  const onKey = (
    e: KeyboardEvent<HTMLButtonElement>,
    name: string,
    values: string[],
    index: number,
  ) => {
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
    if (!forward && !back) return
    e.preventDefault()
    for (let step = 1; step <= values.length; step++) {
      const next = (index + (forward ? step : -step) + values.length) % values.length
      const value = values[next]
      if (isAvailable(name, value)) {
        const v = resolve(name, value)
        if (v) onSelect(v.sku)
        refs.current[`${name}:${value}`]?.focus()
        return
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ name, values }) => {
        const labelId = `${idPrefix}-${name.replace(/\W+/g, '-').toLowerCase()}`
        const current = selected?.options[name]
        return (
          <div key={name}>
            <p id={labelId} className="eyebrow mb-3">
              {name}
              {current ? (
                <span className="ml-2 tracking-normal text-bone-50 normal-case">{current}</span>
              ) : null}
            </p>
            <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
              {values.map((value, i) => {
                const checked = current === value
                const available = isAvailable(name, value)
                const focusable = checked || (!current && i === 0)
                return (
                  <button
                    key={value}
                    ref={(el) => {
                      refs.current[`${name}:${value}`] = el
                    }}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-disabled={!available || undefined}
                    aria-label={available ? value : t('a11y.soldOutOption', { label: value })}
                    tabIndex={focusable ? 0 : -1}
                    onKeyDown={(e) => onKey(e, name, values, i)}
                    onClick={() => {
                      if (!available) return
                      const v = resolve(name, value)
                      if (v) onSelect(v.sku)
                    }}
                    className={cx(
                      'relative inline-flex min-h-11 items-center rounded-full border px-4 text-[13px] leading-tight transition-colors duration-200',
                      checked
                        ? 'border-bone-50 text-bone-50'
                        : available
                          ? 'border-line-strong text-bone-300 hover:border-bone-300 hover:text-bone-50'
                          : 'cursor-not-allowed border-line text-bone-500',
                    )}
                  >
                    {value}
                    {!available ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-3 top-1/2 h-px -rotate-[10deg] bg-bone-500/70"
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** First available variant (or the first variant) for initial selection. */
export function defaultVariant(variants: Variant[]): Variant {
  return variants.find((v) => v.available) ?? variants[0]
}
