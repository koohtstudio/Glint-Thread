'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { checkoutAddressSchema, emailSchema } from '@/lib/account/schemas'
import type { Address } from '@/lib/account/types'
import { useCart } from '@/lib/cart/store'
import { PROVINCE_CODES } from '@/lib/geo'
import { t } from '@/lib/i18n'
import {
  AddressFields,
  EMPTY_ADDRESS,
  type AddressValues,
} from '@/components/account/address-fields'
import { Button } from '@/components/ui/button'
import { Checkbox, Input } from '@/components/ui/field'
import { DesktopSummary, MobileSummary } from './checkout-summary'
import { ExpressPanel, PaymentPanel, type PayApi, type WalletApi } from './checkout-payment'
import { ChoiceRow, Section } from './checkout-sections'
import { stripeAppearance, stripeFonts } from './stripe-appearance'
import { useCheckoutSession, type SessionInputs } from './use-checkout-session'

export interface CheckoutConfig {
  publishableKey: string
  taxMode: 'none' | 'table'
  gstHstNumber: string | null
  /** Firebase accounts are available (sign-in link, "Create an account", saved addresses). */
  accounts: boolean
  user: { email: string | null } | null
  addresses: Address[]
}

type Step = 'contact' | 'shipping' | 'payment'
const STEPS: Step[] = ['contact', 'shipping', 'payment']

let stripePromise: Promise<Stripe | null> | null = null
const getStripePromise = (key: string) => (stripePromise ??= loadStripe(key))

/** Zod issues to `{ field: message }`. */
function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of issues) {
    const key = String(i.path[0] ?? '_')
    if (!(key in out)) out[key] = i.message
  }
  return out
}

const focusId = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus())

export function CheckoutClient({ config }: { config: CheckoutConfig }) {
  const { user, addresses } = config
  const lines = useCart((s) => s.lines)
  const hydrated = useCart((s) => s.hydrated)
  const cartEmail = useCart((s) => s.email)

  // ----- Form state -----
  const [step, setStep] = useState<Step>(user ? 'shipping' : 'contact')
  // Typed email; until the customer types, the account email or the one already given in the bag is used.
  const [emailInput, setEmail] = useState<string | null>(null)
  const email = user?.email ?? emailInput ?? cartEmail ?? ''
  const [createAccount, setCreateAccount] = useState(false)
  const defaultSaved = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  const [savedId, setSavedId] = useState(defaultSaved)
  const [address, setAddress] = useState<AddressValues>(EMPTY_ADDRESS)
  const [phoneOverride, setPhoneOverride] = useState('')
  const [saveAddress, setSaveAddress] = useState(true)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>('standard')
  const [touched, setTouched] = useState({ contact: false, shipping: false })
  const [expressAvailable, setExpressAvailable] = useState(false)

  // ----- Validation (the same Zod schemas the server uses) -----
  const emailResult = emailSchema.safeParse(email.trim())
  const emailValid = emailResult.success
  const saved = addresses.find((a) => a.id === savedId)
  const rawAddress: AddressValues = saved
    ? { ...saved, phone: saved.phone || phoneOverride }
    : address
  const addressResult = checkoutAddressSchema.safeParse(rawAddress)
  const validAddress = addressResult.success
    ? (({ label: _label, ...rest }) => rest)(addressResult.data)
    : null
  const errors =
    touched.shipping && !addressResult.success ? fieldErrors(addressResult.error.issues) : {}
  const province =
    validAddress?.province ??
    (PROVINCE_CODES.includes(rawAddress.province.toUpperCase())
      ? rawAddress.province.toUpperCase()
      : null)

  const inputs: SessionInputs = {
    email: emailValid ? email.trim().toLowerCase() : '',
    createAccount: !user && createAccount,
    address: validAddress,
    province,
    shippingMethodId,
  }

  const enabled = hydrated && lines.length > 0
  const session = useCheckoutSession(inputs, enabled)
  const { quote, status, clientSecret, orderNumber, sync, hold, clearHold, release } = session

  // Keep the chosen shipping method valid against the owner's current methods (adjusting state while rendering).
  if (
    quote?.shippingOptions.length &&
    !quote.shippingOptions.some((o) => o.id === shippingMethodId)
  )
    setShippingMethodId(quote.shippingOptions[0].id)

  // ----- Step handling -----
  const stepIndex = STEPS.indexOf(step)
  const goTo = (next: Step) => {
    setStep(next)
    focusId(`${next}-title`)
  }
  const continueContact = () => {
    setTouched((s) => ({ ...s, contact: true }))
    if (!emailValid) return focusId('checkout-email')
    useCart.setState({ email: email.trim().toLowerCase() })
    goTo('shipping')
  }
  const continueShipping = () => {
    setTouched((s) => ({ ...s, shipping: true }))
    if (!addressResult.success) {
      const first = Object.keys(fieldErrors(addressResult.error.issues))[0]
      return focusId(
        saved ? 'checkout-phone-override' : `shipping-${first === 'postalCode' ? 'postal' : first}`,
      )
    }
    if (!quote?.shipping) return
    goTo('payment')
  }

  // ----- Payment -----
  const returnUrl =
    typeof window === 'undefined' || !orderNumber
      ? ''
      : `${window.location.origin}/checkout/success?order=${orderNumber}`

  const prepare: PayApi['prepare'] = async () => {
    setTouched({ contact: true, shipping: true })
    if (!emailValid) {
      setStep('contact')
      focusId('checkout-email')
      return { ok: false }
    }
    if (!validAddress) {
      setStep('shipping')
      return { ok: false }
    }
    if (!quote?.shipping && !quote?.shippingOptions.some((o) => o.id === shippingMethodId)) {
      setStep('shipping')
      return { ok: false }
    }
    const res = await hold({
      email: email.trim().toLowerCase(),
      address: validAddress,
      province: validAddress.province,
      shippingMethodId,
    })
    clearHold() // the held values are the form's own; no re-sync, a payment is about to be confirmed
    if (!res.ok) return { ok: false, message: res.message ?? t('checkout.paymentError') }
    if (user && saveAddress && !saved) {
      // Fire and forget: a failed save never blocks the payment.
      void fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validAddress, label: '' }),
      }).catch(() => undefined)
    }
    return {
      ok: true,
      billing: {
        name: validAddress.name,
        email: email.trim().toLowerCase(),
        phone: validAddress.phone,
      },
    }
  }

  const walletApi: WalletApi | null = clientSecret
    ? {
        quote,
        clientSecret,
        returnUrl,
        hold,
        release,
        adopt: ({ email: walletEmail }) => {
          if (!user) setEmail(walletEmail)
        },
        onAvailable: setExpressAvailable,
      }
    : null
  const payApi: PayApi | null = clientSecret
    ? {
        clientSecret,
        returnUrl,
        totalCents: quote?.totalCents ?? null,
        prepare,
        busy: status === 'creating' || status === 'updating',
      }
    : null

  // ----- Render -----
  if (hydrated && lines.length === 0) {
    return (
      <div className="max-w-xl py-10">
        <p className="t-lede">{t('bag.empty')}</p>
        <Button asChild className="mt-8">
          <Link href="/shop">{t('bag.emptyCta')}</Link>
        </Button>
      </div>
    )
  }
  if (status === 'unavailable') {
    return (
      <div className="max-w-xl py-10" data-testid="checkout-unavailable">
        <h2 className="t-h2">{t('checkout.unavailableTitle')}</h2>
        <p className="t-lede mt-6">{t('checkout.unavailableBody')}</p>
        <Button asChild className="mt-8" variant="secondary">
          <Link href="/bag">{t('checkout.backToBag')}</Link>
        </Button>
      </div>
    )
  }

  const summaryProps = {
    quote,
    taxMode: config.taxMode,
    gstHstNumber: config.gstHstNumber,
    updating: status === 'creating' || status === 'updating',
    hasProvince: Boolean(province),
  }
  const notice =
    status === 'blocked' || status === 'error' || status === 'processed' ? (
      <div
        role="alert"
        className="mb-8 border border-line bg-ink-900 p-5 text-[15px]"
        data-testid="checkout-notice"
      >
        <p>
          {status === 'blocked' && session.message
            ? t('checkout.stockChanged', { message: session.message })
            : (session.message ?? t('checkout.error'))}
        </p>
        <div className="mt-4 flex gap-6">
          {status === 'error' ? (
            <button
              type="button"
              className="btn-label underline underline-offset-4"
              onClick={() => void sync()}
            >
              {t('checkout.retry')}
            </button>
          ) : null}
          <Link href="/bag" className="btn-label underline underline-offset-4">
            {t('checkout.backToBag')}
          </Link>
        </div>
      </div>
    ) : null

  const body = (
    <div>
      {notice}
      {walletApi ? (
        <div className={expressAvailable ? 'pb-8' : 'hidden'}>
          <p className="eyebrow mb-4">{t('checkout.express')}</p>
          <ExpressPanel api={walletApi} />
          <p className="eyebrow mt-8 text-center">{t('checkout.orPayByCard')}</p>
        </div>
      ) : null}

      <Section
        id="contact"
        n={1}
        title={t('checkout.sectionContact')}
        open={step === 'contact'}
        done={stepIndex > 0}
        onEdit={() => goTo('contact')}
        summary={email}
      >
        {user ? (
          <p className="text-[15px] text-bone-300" data-testid="signed-in-as">
            {t('checkout.signedInAs', { email: user.email ?? '' })}
          </p>
        ) : (
          <div className="flex max-w-xl flex-col gap-6">
            <Input
              id="checkout-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              label={t('checkout.emailLabel')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={touched.contact && !emailValid ? t('forms.invalidEmail') : null}
              required
            />
            {config.accounts ? (
              <>
                <Checkbox
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  label={t('checkout.createAccount')}
                />
                <p className="text-[14px] text-bone-500">
                  {t('checkout.haveAccount')}{' '}
                  <Link
                    href="/account/sign-in?next=/checkout"
                    className="underline underline-offset-4 hover:text-bone-50"
                  >
                    {t('checkout.signIn')}
                  </Link>
                </p>
              </>
            ) : null}
          </div>
        )}
        <Button
          fullWidth
          className="mt-8 lg:hidden"
          onClick={continueContact}
          hidden={Boolean(user)}
        >
          {t('checkout.continue')}
        </Button>
      </Section>

      <Section
        id="shipping"
        n={2}
        title={t('checkout.sectionShipping')}
        open={step === 'shipping'}
        done={stepIndex > 1}
        onEdit={() => goTo('shipping')}
        summary={
          <>
            {validAddress
              ? `${validAddress.name}, ${validAddress.line1}, ${validAddress.city} ${validAddress.province}`
              : ''}
            {quote?.shipping ? <span className="block">{quote.shipping.label}</span> : null}
          </>
        }
      >
        {addresses.length ? (
          <fieldset className="mb-8">
            <legend className="eyebrow mb-3">{t('checkout.savedAddresses')}</legend>
            <div className="flex flex-col gap-3">
              {addresses.map((a) => (
                <ChoiceRow
                  key={a.id}
                  name="saved-address"
                  value={a.id}
                  checked={savedId === a.id}
                  onChange={setSavedId}
                  title={a.label ? `${a.label}: ${a.name}` : a.name}
                  detail={`${a.line1}${a.line2 ? `, ${a.line2}` : ''}, ${a.city} ${a.province} ${a.postalCode}`}
                />
              ))}
              <ChoiceRow
                name="saved-address"
                value=""
                checked={savedId === ''}
                onChange={setSavedId}
                title={t('checkout.useNewAddress')}
              />
            </div>
          </fieldset>
        ) : null}

        {saved ? (
          !saved.phone ? (
            <Input
              id="checkout-phone-override"
              wrapperClassName="mb-8 max-w-sm"
              label={t('checkout.phone')}
              hint={t('checkout.phoneHint')}
              type="tel"
              inputMode="tel"
              autoComplete="shipping tel"
              value={phoneOverride}
              onChange={(e) => setPhoneOverride(e.target.value)}
              error={errors.phone}
              required
            />
          ) : null
        ) : (
          <AddressFields
            idPrefix="shipping"
            values={address}
            errors={errors}
            onChange={(field, value) => setAddress((a) => ({ ...a, [field]: value }))}
          />
        )}

        {user && !saved ? (
          <Checkbox
            className="mt-8"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
            label={t('checkout.saveAddress')}
          />
        ) : null}

        <fieldset className="mt-10">
          <legend className="eyebrow mb-3">{t('checkout.shippingMethod')}</legend>
          <div className="flex flex-col gap-3">
            {(quote?.shippingOptions ?? []).map((o) => (
              <ChoiceRow
                key={o.id}
                name="shipping-method"
                value={o.id}
                checked={shippingMethodId === o.id}
                onChange={setShippingMethodId}
                title={o.label}
                detail={o.eta}
                aside={o.amountCents ? formatMoneyShort(o.amountCents) : t('checkout.free')}
              />
            ))}
            {!quote?.shippingOptions.length ? (
              <div className="h-[76px] border border-line" aria-hidden="true" />
            ) : null}
          </div>
        </fieldset>

        <Button fullWidth className="mt-8 lg:hidden" onClick={continueShipping}>
          {t('checkout.continue')}
        </Button>
      </Section>

      <Section
        id="payment"
        n={3}
        title={t('checkout.sectionPayment')}
        open={step === 'payment'}
        done={false}
        onEdit={() => goTo('payment')}
      >
        {payApi ? (
          <PaymentPanel api={payApi} />
        ) : (
          <div className="h-40 border border-line" aria-hidden="true" />
        )}
      </Section>
    </div>
  )

  return (
    <div className="grid-editorial gap-y-8">
      <div className="col-span-4 md:col-span-6 lg:hidden">
        <MobileSummary {...summaryProps} />
      </div>
      <div className="col-span-4 md:col-span-6 lg:col-span-7 lg:row-start-1">
        {clientSecret ? (
          <Elements
            stripe={getStripePromise(config.publishableKey)}
            options={{
              clientSecret,
              appearance: stripeAppearance,
              fonts: stripeFonts(window.location.origin),
            }}
          >
            {body}
          </Elements>
        ) : (
          <>
            {notice}
            <CheckoutSkeleton />
          </>
        )}
      </div>
      <DesktopSummary {...summaryProps} />
    </div>
  )
}

function formatMoneyShort(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label={t('checkout.loading')} role="status">
      <div className="relative mb-8 h-px overflow-hidden bg-line">
        <span className="absolute inset-0 animate-hairline bg-bone-300" />
      </div>
      {[
        t('checkout.sectionContact'),
        t('checkout.sectionShipping'),
        t('checkout.sectionPayment'),
      ].map((title, i) => (
        <section key={title} className="border-t border-line py-8 lg:py-10">
          <h2 className="flex items-baseline gap-4">
            <span
              className="tabular font-serif text-[28px] leading-none text-bone-300"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className="t-h3">{title}</span>
          </h2>
          <div
            className={
              i === 0
                ? 'mt-6 h-24 bg-ink-900 lg:ml-11'
                : 'hidden lg:mt-6 lg:ml-11 lg:block lg:h-24 lg:bg-ink-900'
            }
          />
        </section>
      ))}
    </div>
  )
}
