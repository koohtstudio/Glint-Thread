'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Finish, PriceBucket, ProductCard as ProductCardData, SortKey } from '@/lib/data/types'
import { COLOUR_FAMILY_LABELS, filterProducts, sortProducts } from '@/lib/data/derive'
import type { Facets } from '@/lib/data/facets'
import {
  PAGE_SIZE,
  activeFilterCount,
  parseListingParams,
  serializeListingParams,
  type ListingState,
} from '@/lib/data/listing-params'
import { cx } from '@/lib/cx'
import { t, type MessageKey } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { ChevronDownIcon, CloseIcon } from '@/components/ui/icons'
import { ListingGrid, type EditorialTile } from './listing-grid'

const FINISH_LABEL: Record<Finish, MessageKey> = {
  'gold-tone': 'listing.finishGold',
  'silver-tone': 'listing.finishSilver',
  'two-tone': 'listing.finishTwo',
  'stainless-steel': 'listing.finishSteel',
}
const PRICE_LABEL: Record<PriceBucket, MessageKey> = {
  'under-10': 'listing.priceUnder10',
  '10-20': 'listing.price10to20',
  '20-40': 'listing.price20to40',
  '40-plus': 'listing.price40plus',
}
const SORT_LABEL: Record<SortKey, MessageKey> = {
  featured: 'listing.sortFeatured',
  newest: 'listing.sortNewest',
  'price-asc': 'listing.sortPriceAsc',
  'price-desc': 'listing.sortPriceDesc',
}

type GroupKey = 'category' | 'finish' | 'colour' | 'price'

function optionsFor(group: GroupKey, facets: Facets): { value: string; label: string }[] {
  switch (group) {
    case 'category':
      return facets.categories.map((c) => ({ value: c.slug, label: c.title }))
    case 'finish':
      return facets.finishes.map((f) => ({ value: f, label: t(FINISH_LABEL[f]) }))
    case 'colour':
      return facets.colours.map((c) => ({ value: c, label: COLOUR_FAMILY_LABELS[c] }))
    case 'price':
      return facets.prices.map((p) => ({ value: p, label: t(PRICE_LABEL[p]) }))
  }
}

const GROUP_LABEL: Record<GroupKey, MessageKey> = {
  category: 'listing.category',
  finish: 'listing.finish',
  colour: 'listing.colour',
  price: 'listing.price',
}

interface Props {
  products: ProductCardData[]
  facets: Facets
  tiles: EditorialTile[]
}

/** Interactive listing: URL-param filters, sort and "Load more", updated without a full reload (PRD 6.2). */
export function ListingView(props: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const state = useMemo(
    () => parseListingParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  )

  const update = (next: Partial<ListingState>, resetPage = true) => {
    const merged: ListingState = {
      ...state,
      ...next,
      page: resetPage ? 1 : (next.page ?? state.page),
    }
    const qs = serializeListingParams(merged, new URLSearchParams(searchParams.toString()))
    // Native history integrates with the App Router: no server round trip, and Back restores filters.
    window.history.pushState(null, '', `${pathname}${qs}`)
  }

  return <ListingBody {...props} state={state} update={update} interactive />
}

/** Static version rendered on the server (and as the Suspense fallback): unfiltered, first page. */
export function ListingStatic(props: Props) {
  const state: ListingState = { page: 1, sort: 'featured' }
  return <ListingBody {...props} state={state} update={() => {}} interactive={false} />
}

function ListingBody({
  products,
  facets,
  tiles,
  state,
  update,
  interactive,
}: Props & {
  state: ListingState
  update: (next: Partial<ListingState>, resetPage?: boolean) => void
  interactive: boolean
}) {
  const filtered = useMemo(
    () => sortProducts(filterProducts(products, state), state.sort),
    [products, state],
  )
  const visible = filtered.slice(0, state.page * PAGE_SIZE)
  const count = activeFilterCount(state)
  const groups = (['category', 'finish', 'colour', 'price'] as GroupKey[]).filter(
    (g) => optionsFor(g, facets).length > 1,
  )

  return (
    <>
      <FilterBar
        groups={groups}
        facets={facets}
        state={state}
        update={update}
        total={filtered.length}
        products={products}
        interactive={interactive}
      />
      <div className="container-x pt-8 pb-24 lg:pt-10">
        {count > 0 ? <ActiveFilters state={state} facets={facets} update={update} /> : null}
        {visible.length ? (
          <ListingGrid products={visible} tiles={count === 0 ? tiles : []} />
        ) : (
          <div className="py-24">
            <p className="font-serif text-[32px] leading-tight">{t('listing.empty')}</p>
            <Button
              variant="secondary"
              className="mt-8"
              onClick={() =>
                update({ category: [], finish: [], colour: [], price: [], inStock: false })
              }
            >
              {t('listing.clear')}
            </Button>
          </div>
        )}
        {visible.length < filtered.length ? (
          <div className="mt-16 flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="tabular text-[13px] text-bone-500">
              {t('listing.showing', { shown: visible.length, total: filtered.length })}
            </p>
            {interactive ? (
              <Button variant="secondary" onClick={() => update({ page: state.page + 1 }, false)}>
                {t('listing.loadMore')}
              </Button>
            ) : (
              <a
                href="?page=2"
                className="btn-label inline-flex h-12 items-center rounded-xs border border-bone-50 px-7"
              >
                {t('listing.loadMore')}
              </a>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}

function FilterBar({
  groups,
  facets,
  state,
  update,
  total,
  products,
  interactive,
}: {
  groups: GroupKey[]
  facets: Facets
  state: ListingState
  update: (next: Partial<ListingState>, resetPage?: boolean) => void
  total: number
  products: ProductCardData[]
  interactive: boolean
}) {
  const [open, setOpen] = useState<GroupKey | null>(null)
  const [sheet, setSheet] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggleValue = (group: GroupKey, value: string) => {
    const current = (state[group] ?? []) as string[]
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    update({ [group]: next } as Partial<ListingState>)
  }

  return (
    <div
      ref={barRef}
      className="sticky top-16 z-30 border-y border-line bg-ink-950/95 backdrop-blur-md lg:top-[76px]"
    >
      <div className="container-x flex h-14 items-center justify-between gap-4">
        {/* Mobile and tablet: one button opens the bottom sheet */}
        <button
          type="button"
          className="btn-label flex h-11 items-center gap-2 lg:hidden"
          onClick={() => setSheet(true)}
          disabled={!interactive}
          aria-haspopup="dialog"
        >
          {t('listing.filterAndSort')}
          {activeFilterCount(state) ? (
            <span className="tabular text-champagne-400">({activeFilterCount(state)})</span>
          ) : null}
        </button>

        {/* Desktop: a disclosure per group */}
        <div className="hidden items-center gap-1 lg:flex">
          {groups.map((g) => {
            const selected = ((state[g] ?? []) as string[]).length
            return (
              <button
                key={g}
                type="button"
                disabled={!interactive}
                aria-expanded={open === g}
                aria-controls={`filter-panel-${g}`}
                onClick={() => setOpen(open === g ? null : g)}
                className={cx(
                  'flex h-11 items-center gap-1.5 px-3 text-[13px] font-medium transition-colors first:-ml-3',
                  open === g || selected ? 'text-bone-50' : 'text-bone-300 hover:text-bone-50',
                )}
              >
                {t(GROUP_LABEL[g])}
                {selected ? <span className="tabular text-champagne-400">({selected})</span> : null}
                <ChevronDownIcon
                  size={16}
                  className={cx(
                    'transition-transform duration-250 ease-gallery',
                    open === g && 'rotate-180',
                  )}
                />
              </button>
            )
          })}
          <label className="ml-2 flex h-11 cursor-pointer items-center gap-2.5 px-3 text-[13px] font-medium text-bone-300 hover:text-bone-50">
            <input
              type="checkbox"
              disabled={!interactive}
              checked={Boolean(state.inStock)}
              onChange={(e) => update({ inStock: e.target.checked })}
              className="size-4 cursor-pointer appearance-none rounded-xs border border-line-strong checked:border-bone-50 checked:bg-bone-50"
            />
            {t('listing.inStock')}
          </label>
        </div>

        <div className="flex items-center gap-5">
          <p className="tabular text-[13px] text-bone-500" aria-live="polite">
            {total === 1 ? t('listing.result') : t('listing.results', { count: total })}
          </p>
          <div className="relative hidden items-center lg:flex">
            <label htmlFor="sort-select" className="mr-2 text-[13px] text-bone-500">
              {t('listing.sort')}
            </label>
            <select
              id="sort-select"
              disabled={!interactive}
              value={state.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              className="h-11 cursor-pointer appearance-none bg-transparent pr-6 text-[13px] font-medium text-bone-50"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((s) => (
                <option key={s} value={s} className="bg-ink-900">
                  {t(SORT_LABEL[s])}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={16}
              className="pointer-events-none absolute right-0 text-bone-300"
            />
          </div>
        </div>
      </div>

      {open ? (
        <div
          id={`filter-panel-${open}`}
          className="hidden border-t border-line bg-ink-900 lg:block"
        >
          <fieldset className="container-x py-6">
            <legend className="sr-only">{t(GROUP_LABEL[open])}</legend>
            <ul className="flex flex-wrap gap-2">
              {optionsFor(open, facets).map((o) => {
                const checked = ((state[open] ?? []) as string[]).includes(o.value)
                return (
                  <li key={o.value}>
                    <label
                      className={cx(
                        'relative inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[13px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-champagne-400',
                        checked
                          ? 'border-bone-50 text-bone-50'
                          : 'border-line-strong text-bone-300 hover:border-bone-300 hover:text-bone-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleValue(open, o.value)}
                      />
                      {o.label}
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        </div>
      ) : null}

      {interactive ? (
        <FilterSheet
          open={sheet}
          onOpenChange={setSheet}
          groups={groups}
          facets={facets}
          state={state}
          products={products}
          apply={(next) => {
            update(next)
            setSheet(false)
          }}
        />
      ) : null}
    </div>
  )
}

/** Mobile bottom sheet (PRD 6.2): stage changes, then "Apply (n results)". */
function FilterSheet({
  open,
  onOpenChange,
  groups,
  facets,
  state,
  products,
  apply,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  groups: GroupKey[]
  facets: Facets
  state: ListingState
  products: ProductCardData[]
  apply: (next: Partial<ListingState>) => void
}) {
  const [draft, setDraft] = useState<ListingState>(state)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(state)
  }
  const count = useMemo(() => filterProducts(products, draft).length, [products, draft])

  const toggle = (group: GroupKey, value: string) => {
    const current = (draft[group] ?? []) as string[]
    setDraft({
      ...draft,
      [group]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="bottom"
      title={t('listing.filterAndSort')}
      footer={
        <div className="flex items-center gap-4 px-5 py-4">
          <button
            type="button"
            className="btn-label h-12 px-2 text-bone-300"
            onClick={() =>
              setDraft({
                ...draft,
                category: [],
                finish: [],
                colour: [],
                price: [],
                inStock: false,
              })
            }
          >
            {t('listing.clearAll')}
          </button>
          <Button fullWidth onClick={() => apply(draft)}>
            {count === 1 ? t('listing.applyOne') : t('listing.apply', { count })}
          </Button>
        </div>
      }
    >
      <div className="space-y-8 px-5 py-6">
        <fieldset>
          <legend className="eyebrow mb-3">{t('listing.sort')}</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((s) => (
              <label
                key={s}
                className={cx(
                  'inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-champagne-400',
                  draft.sort === s
                    ? 'border-bone-50 text-bone-50'
                    : 'border-line-strong text-bone-300',
                )}
              >
                <input
                  type="radio"
                  name="sheet-sort"
                  className="sr-only"
                  checked={draft.sort === s}
                  onChange={() => setDraft({ ...draft, sort: s })}
                />
                {t(SORT_LABEL[s])}
              </label>
            ))}
          </div>
        </fieldset>
        {groups.map((g) => (
          <fieldset key={g}>
            <legend className="eyebrow mb-3">{t(GROUP_LABEL[g])}</legend>
            <div className="flex flex-wrap gap-2">
              {optionsFor(g, facets).map((o) => {
                const checked = ((draft[g] ?? []) as string[]).includes(o.value)
                return (
                  <label
                    key={o.value}
                    className={cx(
                      'inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-champagne-400',
                      checked ? 'border-bone-50 text-bone-50' : 'border-line-strong text-bone-300',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggle(g, o.value)}
                    />
                    {o.label}
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={Boolean(draft.inStock)}
            onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
            className="size-5 cursor-pointer appearance-none rounded-xs border border-line-strong checked:border-bone-50 checked:bg-bone-50"
          />
          {t('listing.inStock')}
        </label>
      </div>
    </Sheet>
  )
}

function ActiveFilters({
  state,
  facets,
  update,
}: {
  state: ListingState
  facets: Facets
  update: (next: Partial<ListingState>) => void
}) {
  const chips: { group: GroupKey | 'inStock'; value: string; label: string }[] = []
  for (const g of ['category', 'finish', 'colour', 'price'] as GroupKey[]) {
    const opts = optionsFor(g, facets)
    for (const v of (state[g] ?? []) as string[])
      chips.push({ group: g, value: v, label: opts.find((o) => o.value === v)?.label ?? v })
  }
  if (state.inStock) chips.push({ group: 'inStock', value: '1', label: t('listing.inStock') })
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2" aria-label={t('listing.activeFilters')}>
      {chips.map((c) => (
        <button
          key={`${c.group}:${c.value}`}
          type="button"
          onClick={() =>
            c.group === 'inStock'
              ? update({ inStock: false })
              : update({
                  [c.group]: ((state[c.group] ?? []) as string[]).filter((v) => v !== c.value),
                } as Partial<ListingState>)
          }
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong pr-2.5 pl-3.5 text-[12px] text-bone-300 hover:border-bone-50 hover:text-bone-50"
          aria-label={t('listing.removeFilter', { label: c.label })}
        >
          {c.label}
          <CloseIcon size={14} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => update({ category: [], finish: [], colour: [], price: [], inStock: false })}
        className="ml-2 min-h-9 text-[12px] text-bone-500 underline-offset-4 hover:text-bone-50 hover:underline"
      >
        {t('listing.clearAll')}
      </button>
    </div>
  )
}
