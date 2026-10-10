'use client'

import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Quote } from '@/lib/pricing/types'

/**
 * Bag state (PRD 8.1): Zustand + persist to localStorage, guarded so private mode or blocked storage
 * never breaks the page. Line snapshots render instantly; the server quote is the source of truth.
 */
export interface CartLineSnapshot {
  productSlug: string
  title: string
  variantTitle: string
  unitPriceCents: number
  image: { src: string; alt: string; width: number; height: number; blurDataURL?: string } | null
}

export interface CartLine extends CartLineSnapshot {
  sku: string
  qty: number
  addedAt: number
}

interface CartState {
  lines: CartLine[]
  promoCode: string | null
  email: string | null
  isOpen: boolean
  highlightSku: string | null
  hydrated: boolean
  quote: Quote | null
  quoteStatus: 'idle' | 'loading' | 'ready' | 'error'
  add: (sku: string, qty: number, snapshot: CartLineSnapshot, options?: { open?: boolean }) => void
  setQty: (sku: string, qty: number) => void
  remove: (sku: string) => void
  clear: () => void
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
  setPromo: (code: string | null, email?: string | null) => void
  setQuote: (quote: Quote | null, status: CartState['quoteStatus']) => void
  reconcile: (quote: Quote) => void
  setHydrated: () => void
}

export const MAX_QTY = 10

const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      /* storage full or blocked: the bag still works for this visit */
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}

let highlightTimer: ReturnType<typeof setTimeout> | undefined

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promoCode: null,
      email: null,
      isOpen: false,
      highlightSku: null,
      hydrated: false,
      quote: null,
      quoteStatus: 'idle',
      add(sku, qty, snapshot, options = { open: true }) {
        const lines = get().lines
        const existing = lines.find((l) => l.sku === sku)
        const next = existing
          ? lines.map((l) =>
              l.sku === sku ? { ...l, ...snapshot, qty: Math.min(MAX_QTY, l.qty + qty) } : l,
            )
          : [...lines, { sku, qty: Math.min(MAX_QTY, qty), addedAt: Date.now(), ...snapshot }]
        set({ lines: next, highlightSku: sku, isOpen: options.open ?? true })
        clearTimeout(highlightTimer)
        // PRD 6.4: the added item is highlighted for 1.2s.
        highlightTimer = setTimeout(() => set({ highlightSku: null }), 1200)
      },
      setQty(sku, qty) {
        if (qty <= 0) return get().remove(sku)
        set({
          lines: get().lines.map((l) =>
            l.sku === sku ? { ...l, qty: Math.min(MAX_QTY, qty) } : l,
          ),
        })
      },
      remove(sku) {
        set({ lines: get().lines.filter((l) => l.sku !== sku) })
      },
      clear() {
        set({ lines: [], promoCode: null, quote: null, quoteStatus: 'idle' })
      },
      open() {
        set({ isOpen: true })
      },
      close() {
        set({ isOpen: false })
      },
      setOpen(open) {
        set({ isOpen: open })
      },
      setPromo(code, email) {
        set({
          promoCode: code ? code.trim().toUpperCase() : null,
          ...(email !== undefined ? { email } : {}),
        })
      },
      setQuote(quote, status) {
        set({ quote, quoteStatus: status })
      },
      setHydrated() {
        set({ hydrated: true })
      },
      /** Apply server corrections (removed SKUs, clamped quantities) back to the local bag. */
      reconcile(quote) {
        const bySku = new Map(quote.lines.map((l) => [l.sku, l]))
        const lines = get()
          .lines.filter((l) => bySku.has(l.sku))
          .map((l) => {
            const q = bySku.get(l.sku)!
            return q.qty === l.qty && q.unitPriceCents === l.unitPriceCents
              ? l
              : { ...l, qty: q.qty, unitPriceCents: q.unitPriceCents }
          })
        const changed =
          lines.length !== get().lines.length || lines.some((l, i) => l !== get().lines[i])
        if (changed) set({ lines })
      },
    }),
    {
      name: 'gt-bag-v1',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ lines: s.lines, promoCode: s.promoCode, email: s.email }),
      // Runs during store creation, so it must use the state it is given, not `useCart`.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)

export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.qty, 0)
