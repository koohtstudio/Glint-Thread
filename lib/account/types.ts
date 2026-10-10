import type { TaxLine } from '@/lib/pricing/types'

/** Private customer data (Firestore, PRD 10.1). Dates are ISO strings so they sort and compare simply. */
export interface Profile {
  firstName: string
  lastName: string
  phone: string
  email: string
  marketingOptIn: boolean
  marketingConsentAt?: string
  marketingConsentVersion?: string
  marketingConsentSource?: string
  /** Set once the opt-in has been sent to Resend (after the email is verified). */
  marketingSyncedAt?: string
  createdAt: string
}

export interface Address {
  id: string
  label: string
  name: string
  line1: string
  line2: string
  city: string
  province: string
  postalCode: string
  phone: string
  isDefault: boolean
}

export type AddressInput = Omit<Address, 'id' | 'isDefault'>

export type CustomerOrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'expired'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export interface CustomerOrderLine {
  sku: string
  productSlug: string
  title: string
  variantTitle: string
  qty: number
  unitPriceCents: number
  /** After this line's share of promotion savings. */
  lineTotalCents: number
  image: string | null
}

export interface ShippingAddress {
  name: string
  line1: string
  line2: string
  city: string
  province: string
  postalCode: string
  phone: string
}

export interface CustomerOrder {
  sanityOrderId: string | null
  orderNumber: string
  uid: string | null
  email: string | null
  name: string | null
  phone: string | null
  shippingAddress: ShippingAddress | null
  stripePaymentIntentId: string | null
  status: CustomerOrderStatus
  totals: {
    subtotalCents: number
    discountCents: number
    shippingCents: number
    taxCents: number
    totalCents: number
    taxLines: TaxLine[]
  }
  lines: CustomerOrderLine[]
  shippingMethod: string | null
  promoCode: string | null
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  /** The guest ticked "Create an account" at checkout. */
  createAccount: boolean
  createdAt: string
  paidAt: string | null
  /** Set when the customer deleted their account; personal fields are then removed. */
  anonymisedAt: string | null
}

export interface CartDoc {
  lines: {
    sku: string
    qty: number
    addedAt: number
    productSlug: string
    title: string
    variantTitle: string
    unitPriceCents: number
    image: { src: string; alt: string; width: number; height: number; blurDataURL?: string } | null
  }[]
  promoCode: string | null
  updatedAt: string
}
