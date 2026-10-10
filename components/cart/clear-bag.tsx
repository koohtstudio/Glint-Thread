'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart/store'

/** Clears the bag once the order is confirmed (PRD 6.4.6). Safe on refresh: clearing twice is a no-op. */
export function ClearBag() {
  const hydrated = useCart((s) => s.hydrated)
  const clear = useCart((s) => s.clear)
  useEffect(() => {
    if (!hydrated) return
    clear()
    try {
      // The finished checkout's PaymentIntent must not be picked up by the next one.
      window.sessionStorage.removeItem('gt-checkout-v1')
    } catch {
      /* private mode */
    }
  }, [hydrated, clear])
  return null
}
