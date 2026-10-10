'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from '@stripe/stripe-js'
import { checkoutAddressSchema } from '@/lib/account/schemas'
import { formatMoney } from '@/lib/format'
import { provinceCodeFrom } from '@/lib/geo'
import { t } from '@/lib/i18n'
import type { Quote } from '@/lib/pricing/types'
import { Button } from '@/components/ui/button'
import type { SessionInputs, SyncResult } from './use-checkout-session'

const EXPRESS_OPTIONS: StripeExpressCheckoutElementOptions = {
  emailRequired: true,
  phoneNumberRequired: true,
  shippingAddressRequired: true,
  allowedShippingCountries: ['CA'],
  buttonHeight: 48,
  buttonTheme: { applePay: 'white', googlePay: 'white' },
  buttonType: { applePay: 'buy', googlePay: 'buy' },
  layout: { maxColumns: 2, maxRows: 1, overflow: 'auto' },
  // Apple Pay and Google Pay only (PRD 6.4.4.3).
  paymentMethods: {
    applePay: 'auto',
    googlePay: 'auto',
    link: 'never',
    paypal: 'never',
    amazonPay: 'never',
    klarna: 'never',
  },
}

/** What the wallet sheet shows under the total: merchandise after savings, shipping and each named tax line. */
function lineItemsFrom(quote: Quote) {
  const items = [
    { name: t('checkout.subtotal'), amount: quote.discountedSubtotalCents },
    { name: t('checkout.shipping'), amount: quote.shipping?.amountCents ?? 0 },
    ...quote.taxLines.map((l) => ({ name: l.label, amount: l.amountCents })),
  ]
  return items
}

/** The selected method first (wallets preselect the first rate), then the others. */
function ratesFrom(quote: Quote) {
  const rate = (o: Quote['shippingOptions'][number]) => ({
    id: o.id,
    displayName: o.label,
    amount: o.amountCents,
    deliveryEstimate: o.eta,
  })
  const selected = quote.shipping?.id
  const options = [...quote.shippingOptions].sort(
    (a, b) => Number(b.id === selected) - Number(a.id === selected),
  )
  return options.map(rate)
}

export interface WalletApi {
  quote: Quote | null
  clientSecret: string
  returnUrl: string
  /** Sync with these values held until `release()` (wallet sheets edit address and method away from the form). */
  hold: (override: Partial<SessionInputs>) => Promise<SyncResult>
  release: () => void
  /** Reflect what the wallet collected in the form, in case the payment then fails. */
  adopt: (details: { email: string; name: string; phone: string }) => void
  onAvailable: (available: boolean) => void
}

/** Apple Pay and Google Pay at the top of the page (PRD 6.4.4.3). Renders nothing where neither is available. */
export function ExpressPanel({ api }: { api: WalletApi }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const apiRef = useRef(api)
  useEffect(() => {
    apiRef.current = api
  })

  if (!stripe || !elements) return null

  const refresh = async (res: SyncResult) => {
    if (!res.ok || !res.quote) return null
    await elements.fetchUpdates()
    return res.quote
  }

  const onAddressChange = async (e: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
    const province = provinceCodeFrom(e.address.state)
    if (e.address.country !== 'CA' || !province) return e.reject()
    const quote = await refresh(await apiRef.current.hold({ address: null, province }))
    if (!quote) return e.reject()
    e.resolve({ lineItems: lineItemsFrom(quote), shippingRates: ratesFrom(quote) })
  }

  const onRateChange = async (e: StripeExpressCheckoutElementShippingRateChangeEvent) => {
    const quote = await refresh(await apiRef.current.hold({ shippingMethodId: e.shippingRate.id }))
    if (!quote) return e.reject()
    e.resolve({ lineItems: lineItemsFrom(quote), shippingRates: ratesFrom(quote) })
  }

  const onConfirm = async (e: StripeExpressCheckoutElementConfirmEvent) => {
    setError(null)
    const current = apiRef.current
    const fail = (message: string, reason: 'fail' | 'invalid_shipping_address' = 'fail') => {
      e.paymentFailed({ reason, message })
      setError(message)
      current.release()
    }
    const submitted = await elements.submit()
    if (submitted.error) return fail(submitted.error.message ?? t('checkout.paymentError'))
    const ship = e.shippingAddress
    const email = e.billingDetails?.email
    if (!ship || !email) return fail(t('checkout.paymentError'), 'invalid_shipping_address')
    const parsed = checkoutAddressSchema.safeParse({
      name: ship.name,
      line1: ship.address.line1,
      line2: ship.address.line2 ?? '',
      city: ship.address.city,
      province: provinceCodeFrom(ship.address.state) ?? '',
      postalCode: ship.address.postal_code,
      phone: e.billingDetails?.phone ?? '',
    })
    if (!parsed.success)
      return fail(
        parsed.error.issues[0]?.message ?? t('checkout.paymentError'),
        'invalid_shipping_address',
      )

    current.adopt({ email, name: parsed.data.name, phone: parsed.data.phone })
    const res = await current.hold({
      email,
      address: parsed.data,
      province: parsed.data.province,
      ...(e.shippingRate ? { shippingMethodId: e.shippingRate.id } : {}),
    })
    if (!res.ok) return fail(res.message ?? t('checkout.paymentError'))
    await elements.fetchUpdates()
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: current.clientSecret,
      confirmParams: { return_url: current.returnUrl },
    })
    if (confirmError) fail(confirmError.message ?? t('checkout.paymentError'))
  }

  return (
    <div>
      <ExpressCheckoutElement
        options={EXPRESS_OPTIONS}
        onReady={(e) => api.onAvailable(Boolean(e.availablePaymentMethods))}
        onClick={(e) =>
          e.resolve({
            lineItems: api.quote ? lineItemsFrom(api.quote) : undefined,
            shippingRates: api.quote ? ratesFrom(api.quote) : undefined,
          })
        }
        onShippingAddressChange={onAddressChange}
        onShippingRateChange={onRateChange}
        onCancel={() => api.release()}
        onConfirm={onConfirm}
      />
      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export interface PayApi {
  clientSecret: string
  returnUrl: string
  totalCents: number | null
  /** Validates contact and shipping, syncs the order, and returns the billing details; or why not. */
  prepare: () => Promise<
    | { ok: true; billing: { name: string; email: string; phone: string } }
    | { ok: false; message?: string }
  >
  busy: boolean
}

/** The Payment Element and the Pay button (PRD 6.4.4.3). Declines show inline; the form stays intact (6.4.7). */
export function PaymentPanel({ api }: { api: PayApi }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pay = async () => {
    if (!stripe || !elements) return
    setError(null)
    setPaying(true)
    // submit() first: it validates the Payment Element and must run inside the click.
    const submitted = await elements.submit()
    if (submitted.error) {
      setError(submitted.error.message ?? t('checkout.paymentError'))
      setPaying(false)
      return
    }
    const prepared = await api.prepare()
    if (!prepared.ok) {
      if (prepared.message) setError(prepared.message)
      setPaying(false)
      return
    }
    await elements.fetchUpdates()
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: api.clientSecret,
      confirmParams: {
        return_url: api.returnUrl,
        payment_method_data: { billing_details: prepared.billing },
      },
    })
    // Reached only on an immediate error; success and 3-D Secure navigate to return_url.
    setError(confirmError.message ?? t('checkout.paymentError'))
    setPaying(false)
  }

  const loading = paying || api.busy
  return (
    <div>
      <PaymentElement
        options={{
          layout: { type: 'tabs', defaultCollapsed: false },
          wallets: { applePay: 'never', googlePay: 'never' },
          fields: {
            billingDetails: { name: 'never', email: 'never', phone: 'never', address: 'auto' },
          },
        }}
      />
      {error ? (
        <p role="alert" className="mt-4 text-[14px] text-error" data-testid="payment-error">
          {error}
        </p>
      ) : null}
      <Button
        fullWidth
        className="mt-8"
        onClick={pay}
        loading={paying}
        loadingLabel={t('checkout.paying')}
        disabled={!stripe || !elements || loading}
        data-testid="pay-button"
      >
        {api.totalCents != null
          ? t('checkout.pay', { amount: formatMoney(api.totalCents) })
          : t('checkout.payNoAmount')}
      </Button>
      <p className="mt-4 text-[12px] leading-relaxed text-bone-500">
        {t('checkout.agree')}{' '}
        <Link href="/terms" className="underline underline-offset-4 hover:text-bone-50">
          {t('checkout.terms')}
        </Link>{' '}
        {t('checkout.and')}{' '}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-bone-50">
          {t('checkout.privacy')}
        </Link>
        . {t('checkout.securePayments')}
      </p>
    </div>
  )
}
