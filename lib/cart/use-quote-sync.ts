'use client'

import { useEffect, useRef } from 'react'
import { useCart } from './store'
import { toast } from '@/lib/toast'
import type { Quote } from '@/lib/pricing/types'

/**
 * Keeps the server quote in step with the bag (PRD 6.4 step 2): debounced POST /api/quote whenever
 * lines, code or email change, then applies server corrections (removed or clamped lines).
 */
export function useQuoteSync() {
  const lines = useCart((s) => s.lines)
  const promoCode = useCart((s) => s.promoCode)
  const email = useCart((s) => s.email)
  const hydrated = useCart((s) => s.hydrated)
  const setQuote = useCart((s) => s.setQuote)
  const reconcile = useCart((s) => s.reconcile)
  const seq = useRef(0)

  const key = JSON.stringify({ l: lines.map((l) => [l.sku, l.qty]), promoCode, email })

  useEffect(() => {
    if (!hydrated) return
    const current = useCart.getState()
    if (!current.lines.length) {
      setQuote(null, 'idle')
      return
    }
    const id = ++seq.current
    setQuote(current.quote, 'loading')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lines: current.lines.map((l) => ({ sku: l.sku, qty: l.qty })),
            promoCode: current.promoCode,
            email: current.email || null,
          }),
        })
        if (!res.ok) throw new Error(String(res.status))
        const quote: Quote = await res.json()
        if (id !== seq.current) return
        setQuote(quote, 'ready')
        for (const m of quote.messages) {
          if (m.sku && (m.type === 'warning' || m.type === 'error'))
            toast(m.text, m.type === 'error' ? 'error' : 'neutral')
        }
        reconcile(quote)
      } catch {
        if (id === seq.current) setQuote(useCart.getState().quote, 'error')
      }
    }, 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated])
}
