'use client'

import { useEffect, useRef } from 'react'
import { MAX_QTY, useCart, type CartLine } from './store'

const HINT_COOKIE = 'gt_signed_in'

function signedInHint(): boolean {
  try {
    return document.cookie.split('; ').some((c) => c === `${HINT_COOKIE}=1`)
  } catch {
    return false
  }
}

interface RemoteCart {
  lines: CartLine[]
  promoCode: string | null
}

/** Union of both bags: the same SKU keeps the larger quantity; the local code wins, else the saved one (PRD 9.9). */
export function mergeCarts(local: RemoteCart, remote: RemoteCart): RemoteCart {
  const bySku = new Map<string, CartLine>()
  for (const line of remote.lines) bySku.set(line.sku, line)
  for (const line of local.lines) {
    const other = bySku.get(line.sku)
    bySku.set(
      line.sku,
      other ? { ...line, qty: Math.min(MAX_QTY, Math.max(line.qty, other.qty)) } : line,
    )
  }
  return {
    lines: [...bySku.values()].sort((a, b) => a.addedAt - b.addedAt),
    promoCode: local.promoCode ?? remote.promoCode ?? null,
  }
}

const push = (cart: RemoteCart) =>
  fetch('/api/account/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines: cart.lines, promoCode: cart.promoCode }),
  })

/**
 * A signed-in customer's bag follows them across devices (PRD 9.9). On the first load after sign-in the saved bag
 * (Firestore, through /api/account/cart) is merged with the local one; after that every change is saved, debounced.
 * Signed-out visitors (no hint cookie) never touch the network here.
 */
export function useAccountCartSync() {
  const hydrated = useCart((s) => s.hydrated)
  const lines = useCart((s) => s.lines)
  const promoCode = useCart((s) => s.promoCode)
  const phase = useRef<'idle' | 'merging' | 'ready'>('idle')

  useEffect(() => {
    if (!hydrated || phase.current !== 'idle' || !signedInHint()) return
    phase.current = 'merging'
    void (async () => {
      try {
        const res = await fetch('/api/account/cart', { cache: 'no-store' })
        if (!res.ok) {
          phase.current = 'idle'
          return
        }
        const { cart } = (await res.json()) as { cart: RemoteCart }
        const local = useCart.getState()
        const merged = mergeCarts(
          { lines: local.lines, promoCode: local.promoCode },
          { lines: cart.lines ?? [], promoCode: cart.promoCode ?? null },
        )
        useCart.setState({ lines: merged.lines, promoCode: merged.promoCode })
        await push(merged)
        phase.current = 'ready'
      } catch {
        phase.current = 'idle'
      }
    })()
  }, [hydrated])

  const key = JSON.stringify([lines.map((l) => [l.sku, l.qty]), promoCode])
  useEffect(() => {
    if (phase.current !== 'ready') return
    const timer = setTimeout(() => {
      const { lines: l, promoCode: p } = useCart.getState()
      void push({ lines: l, promoCode: p }).catch(() => undefined)
    }, 1000)
    return () => clearTimeout(timer)
  }, [key])
}
