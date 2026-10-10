'use client'

import { create } from 'zustand'

/** Open state for the global overlays (search, mobile menu). The bag lives in the cart store. */
export const useUi = create<{
  searchOpen: boolean
  menuOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  setSearch: (open: boolean) => void
  openMenu: () => void
  closeMenu: () => void
  setMenu: (open: boolean) => void
}>((set) => ({
  searchOpen: false,
  menuOpen: false,
  openSearch: () => set({ searchOpen: true, menuOpen: false }),
  closeSearch: () => set({ searchOpen: false }),
  setSearch: (open) => set({ searchOpen: open }),
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  setMenu: (open) => set({ menuOpen: open }),
}))
