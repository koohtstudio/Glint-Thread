import { defineArrayMember, defineField, defineType } from 'sanity'
import { CustomerPanel } from '../components/CustomerPanel'
import { PriceInput } from '../components/PriceInput'

export const promotion = defineType({
  name: 'promotion',
  type: 'document',
  fields: [
    defineField({
      name: 'promotionId',
      title: 'ID',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'type',
      type: 'string',
      options: { list: ['tiered_percent_category', 'buy_x_get_y_cheapest_free'] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
    defineField({
      name: 'appliesTo',
      type: 'object',
      fields: [
        defineField({
          name: 'categories',
          type: 'array',
          of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
        }),
        defineField({
          name: 'exclude',
          title: 'Excluded products',
          type: 'array',
          of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
        }),
      ],
    }),
    defineField({
      name: 'tiers',
      type: 'array',
      hidden: ({ parent }) => parent?.type !== 'tiered_percent_category',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tier',
          fields: [
            defineField({
              name: 'minQty',
              type: 'number',
              validation: (r) => r.required().integer().min(1),
            }),
            defineField({
              name: 'percentOff',
              type: 'number',
              validation: (r) => r.required().min(1).max(100),
            }),
          ],
          preview: {
            select: { q: 'minQty', p: 'percentOff' },
            prepare: ({ q, p }) => ({ title: `${q}+ units: ${p}% off` }),
          },
        }),
      ],
    }),
    defineField({
      name: 'buyQty',
      type: 'number',
      hidden: ({ parent }) => parent?.type !== 'buy_x_get_y_cheapest_free',
    }),
    defineField({
      name: 'getQty',
      type: 'number',
      hidden: ({ parent }) => parent?.type !== 'buy_x_get_y_cheapest_free',
    }),
    defineField({
      name: 'badge',
      type: 'string',
      description: 'Short label on product cards, e.g. "Buy 2, get 1 free"',
    }),
    defineField({ name: 'startsAt', type: 'datetime' }),
    defineField({ name: 'endsAt', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', active: 'active' },
    prepare: ({ title, active }) => ({ title, subtitle: active ? 'Active' : 'Off' }),
  },
})

export const promoCode = defineType({
  name: 'promoCode',
  title: 'Promo code',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      type: 'string',
      validation: (r) =>
        r
          .required()
          .custom((v) =>
            typeof v === 'string' && /^[A-Z0-9]+$/.test(v)
              ? true
              : 'Uppercase letters and numbers only',
          ),
    }),
    defineField({
      name: 'type',
      type: 'string',
      options: { list: ['percent_off_order'] },
      initialValue: 'percent_off_order',
    }),
    defineField({
      name: 'percentOff',
      type: 'number',
      validation: (r) => r.required().min(1).max(100),
    }),
    defineField({ name: 'firstOrderOnly', type: 'boolean', initialValue: true }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
    defineField({ name: 'expiresAt', type: 'datetime' }),
    defineField({ name: 'note', type: 'text', rows: 2 }),
  ],
  preview: {
    select: { title: 'code', p: 'percentOff', active: 'active' },
    prepare: ({ title, p, active }) => ({ title, subtitle: `${p}% off${active ? '' : ' · off'}` }),
  },
})

const money = (name: string, title?: string) =>
  defineField({ name, title, type: 'number', components: { input: PriceInput }, readOnly: true })

export const order = defineType({
  name: 'order',
  type: 'document',
  fields: [
    defineField({ name: 'orderNumber', type: 'string', readOnly: true }),
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: [
          'pending',
          'paid',
          'shipped',
          'delivered',
          'expired',
          'cancelled',
          'refunded',
          'partially_refunded',
        ],
      },
    }),
    defineField({
      name: 'needsReview',
      type: 'boolean',
      description: 'Set when stock went below zero or a first-order code was reused.',
    }),
    defineField({ name: 'notes', type: 'text', rows: 3 }),
    // No personal data in Sanity (PRD 9.8): the customer's name, email, phone and address stay in Stripe.
    defineField({
      name: 'customerPanel',
      title: 'Customer',
      type: 'string',
      readOnly: true,
      description: 'Loaded live from Stripe, never stored here.',
      components: { input: CustomerPanel },
    }),
    defineField({
      name: 'shippingProvince',
      type: 'string',
      readOnly: true,
      description: 'Two-letter province code, for reporting.',
    }),
    defineField({
      name: 'emailHash',
      type: 'string',
      readOnly: true,
      hidden: true,
      description:
        'Salted SHA-256 of the email, for order lookup and first-order codes. Not reversible.',
    }),
    defineField({ name: 'shippingMethod', type: 'string', readOnly: true }),
    defineField({ name: 'shippingEta', type: 'string', readOnly: true }),
    defineField({
      name: 'carrier',
      type: 'string',
      options: { list: ['Canada Post', 'Purolator', 'UPS', 'FedEx'] },
    }),
    defineField({ name: 'trackingNumber', type: 'string' }),
    defineField({
      name: 'lines',
      type: 'array',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'orderLine',
          fields: [
            defineField({ name: 'sku', type: 'string' }),
            defineField({ name: 'productSlug', type: 'string' }),
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'variantTitle', type: 'string' }),
            defineField({ name: 'qty', type: 'number' }),
            money('unitPriceCents', 'Unit price'),
            money('lineSubtotalCents', 'Line subtotal'),
            money('discountCents', 'Discount'),
            defineField({ name: 'imageUrl', type: 'url' }),
          ],
          preview: {
            select: { title: 'title', v: 'variantTitle', q: 'qty' },
            prepare: ({ title, v, q }) => ({ title: `${q} × ${title}`, subtitle: v }),
          },
        }),
      ],
    }),
    defineField({
      name: 'amounts',
      type: 'object',
      readOnly: true,
      fields: [
        money('subtotalCents', 'Subtotal'),
        money('automaticDiscountCents', 'Automatic discounts'),
        money('codeDiscountCents', 'Code discount'),
        money('discountCents', 'All discounts'),
        money('shippingCents', 'Shipping'),
        money('taxCents', 'Tax'),
        money('totalCents', 'Total'),
      ],
    }),
    defineField({ name: 'promoCode', type: 'string', readOnly: true }),
    defineField({
      name: 'stripe',
      type: 'object',
      readOnly: true,
      fields: [
        defineField({ name: 'checkoutSessionId', type: 'string' }),
        defineField({ name: 'paymentIntentId', type: 'string' }),
        defineField({ name: 'couponId', type: 'string' }),
      ],
    }),
    defineField({
      name: 'processedEventIds',
      type: 'array',
      readOnly: true,
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({ name: 'stockDecremented', type: 'boolean', readOnly: true }),
    defineField({ name: 'quoteSnapshot', type: 'text', readOnly: true, rows: 4 }),
    defineField({ name: 'createdAt', type: 'datetime', readOnly: true }),
    defineField({ name: 'paidAt', type: 'datetime', readOnly: true }),
    defineField({ name: 'shippedAt', type: 'datetime', readOnly: true }),
    defineField({ name: 'updatedAt', type: 'datetime', readOnly: true }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: {
      n: 'orderNumber',
      status: 'status',
      total: 'amounts.totalCents',
      province: 'shippingProvince',
      review: 'needsReview',
    },
    prepare: ({ n, status, total, province, review }) => ({
      title: `${n ?? 'Order'} · $${((total ?? 0) / 100).toFixed(2)}`,
      subtitle: `${review ? 'NEEDS REVIEW · ' : ''}${status}${province ? ` · ${province}` : ''}`,
    }),
  },
})
