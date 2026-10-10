'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart/store'

/** Clears the bag once the order is confirmed (PRD 6.4.6). Safe on refresh: clearing twice is a no-op. */
export function ClearBag() {
  const hydrated = useCart((s) => s.hydrated)
  const clear = useCart((s) => s.clear)
  useEffect(() => {
    if (hydrated) clear()
  }, [hydrated, clear])
  return null
}
