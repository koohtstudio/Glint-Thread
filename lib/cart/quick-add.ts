'use client'

import { create } from 'zustand'
import type { ProductCard } from '@/lib/data/types'

/** Opens the variant sheet for multi-variant quick add (PRD 4.6 product card). */
export const useQuickAdd = create<{
  product: ProductCard | null
  open: (p: ProductCard) => void
  close: () => void
}>((set) => ({
  product: null,
  open: (product) => set({ product }),
  close: () => set({ product: null }),
}))
