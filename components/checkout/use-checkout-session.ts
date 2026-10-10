'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCart } from '@/lib/cart/store'
import type { Quote } from '@/lib/pricing/types'

/** What the form knows. Only valid values are sent: an address that fails validation is `null`. */
export interface SessionInputs {
  email: string
  createAccount: boolean
  address: {
    name: string
    line1: string
    line2: string
    city: string
    province: string
    postalCode: string
    phone: string
  } | null
  province: string | null
  shippingMethodId: string | null
}

export interface CheckoutSessionRef {
  orderId: string
  paymentIntentId: string
  token: string
}

export type SessionStatus =
  'creating' | 'ready' | 'updating' | 'blocked' | 'processed' | 'unavailable' | 'error'

export interface SyncResult {
  ok: boolean
  quote: Quote | null
  message: string | null
}

interface Stored {
  session: CheckoutSessionRef
  clientSecret: string
  orderNumber: string
}

const STORAGE_KEY = 'gt-checkout-v1'

function readStored(): Stored | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

function writeStored(value: Stored | null) {
  try {
    if (value) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode: a refresh then creates a fresh order, which is fine */
  }
}

/**
 * Keeps the server order and the Stripe PaymentIntent in step with the form (PRD 9.2).
 * The first call creates the pending order and PaymentIntent; every later call (address, shipping method, code,
 * email, bag) re-quotes on the server and updates the PaymentIntent amount. Calls are serialised, and a call that
 * has been superseded before it starts is skipped, so rapid edits cost one request. The session survives a
 * refresh in sessionStorage (the PaymentIntent is reused, not duplicated).
 */
export function useCheckoutSession(inputs: SessionInputs, enabled: boolean) {
  const lines = useCart((s) => s.lines)
  const promoCode = useCart((s) => s.promoCode)
  const [status, setStatus] = useState<SessionStatus>('creating')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [stored, setStored] = useState<Stored | null>(null)
  /** Bumps after each successful server update so Elements can `fetchUpdates()`. */
  const [version, setVersion] = useState(0)

  const inputsRef = useRef(inputs)
  const storedRef = useRef<Stored | null>(null)
  const chain = useRef<Promise<unknown>>(Promise.resolve())
  const ticket = useRef(0)
  const last = useRef<SyncResult>({ ok: false, quote: null, message: null })
  /** Values a wallet sheet (Apple Pay, Google Pay) edited away from the form; kept until the sheet closes. */
  const held = useRef<Partial<SessionInputs>>({})

  useEffect(() => {
    inputsRef.current = inputs
  })

  // Resume a session from this tab (refresh, back from the success page's "try again").
  useEffect(() => {
    const prior = readStored()
    if (prior) {
      storedRef.current = prior
      // sessionStorage only exists after hydration, so this one-off read has to happen in an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStored(prior)
    }
  }, [])

  const exec = useCallback(async (override?: Partial<SessionInputs>): Promise<SyncResult> => {
    const cart = useCart.getState()
    const input = { ...inputsRef.current, ...held.current, ...override }
    const attempt = async (prior: Stored | null): Promise<SyncResult> => {
      setStatus(prior ? 'updating' : 'creating')
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: cart.lines.map((l) => ({ sku: l.sku, qty: l.qty })),
          promoCode: cart.promoCode,
          email: input.email || null,
          createAccount: input.createAccount,
          address: input.address,
          province: input.province,
          shippingMethodId: input.shippingMethodId,
          session: prior?.session ?? null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        message?: string
        quote?: Quote
        clientSecret?: string
        orderNumber?: string
        session?: CheckoutSessionRef
      }
      if (
        res.ok &&
        data.ok &&
        data.quote &&
        data.clientSecret &&
        data.session &&
        data.orderNumber
      ) {
        const next: Stored = {
          session: data.session,
          clientSecret: data.clientSecret,
          orderNumber: data.orderNumber,
        }
        storedRef.current = next
        writeStored(next)
        setStored((current) => (current?.clientSecret === next.clientSecret ? current : next))
        setQuote(data.quote)
        setMessage(null)
        setStatus('ready')
        setVersion((v) => v + 1)
        return { ok: true, quote: data.quote, message: null }
      }
      // A stale or foreign session: start over once with a fresh order and PaymentIntent.
      if (prior && (data.error === 'invalid_session' || data.error === 'already_processed')) {
        storedRef.current = null
        writeStored(null)
        if (data.error === 'already_processed') {
          setStatus('processed')
          setMessage(data.message ?? null)
          return { ok: false, quote: null, message: data.message ?? null }
        }
        return attempt(null)
      }
      if (data.quote) setQuote(data.quote)
      setMessage(data.message ?? null)
      setStatus(
        res.status === 503
          ? 'unavailable'
          : data.error === 'lines_unavailable' || data.error === 'code_needs_email'
            ? 'blocked'
            : 'error',
      )
      return { ok: false, quote: data.quote ?? null, message: data.message ?? null }
    }
    try {
      return await attempt(storedRef.current)
    } catch {
      setStatus('error')
      return { ok: false, quote: null, message: null }
    }
  }, [])

  /** Sync now (queued behind any request in flight). A newer call makes an older, not-yet-started one skip. */
  const sync = useCallback(
    (override?: Partial<SessionInputs>): Promise<SyncResult> => {
      const mine = ++ticket.current
      const run = chain.current
        .catch(() => undefined)
        .then(async () => {
          if (mine !== ticket.current) return last.current // superseded: the newer call does the work
          last.current = await exec(override)
          return last.current
        })
      chain.current = run
      return run
    },
    [exec],
  )

  /** Sync with these values held (until `clearHold`/`release`). */
  const hold = useCallback(
    (override: Partial<SessionInputs>) => {
      held.current = { ...held.current, ...override }
      return sync()
    },
    [sync],
  )
  /** Forget the held values without syncing (the held values were the form's own, as at pay time). */
  const clearHold = useCallback(() => {
    held.current = {}
  }, [])
  /** The wallet sheet closed: back to the form's own values. */
  const release = useCallback(() => {
    held.current = {}
    void sync()
  }, [sync])

  // Background sync whenever something that changes the order changes.
  const key = JSON.stringify([
    lines.map((l) => [l.sku, l.qty]),
    promoCode,
    inputs.email,
    inputs.createAccount,
    inputs.address,
    inputs.province,
    inputs.shippingMethodId,
  ])
  const firstRun = useRef(true)
  useEffect(() => {
    if (!enabled) return
    const delay = firstRun.current ? 0 : 400
    firstRun.current = false
    const timer = setTimeout(() => void sync(), delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  return {
    status,
    quote,
    message,
    clientSecret: stored?.clientSecret ?? null,
    orderNumber: stored?.orderNumber ?? null,
    session: stored?.session ?? null,
    version,
    sync,
    hold,
    clearHold,
    release,
  }
}
