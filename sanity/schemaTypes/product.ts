import { defineArrayMember, defineField, defineType } from 'sanity'
import { PriceInput } from '../components/PriceInput'
import { UnitCostInput } from '../components/MarginBadge'
import { StockInput } from '../components/StockInput'
import { VerifyPanel } from '../components/VerifyPanel'

/** Variant object (PRD 10): title, SKU, options, optional price override, stock, optional image. */
export const variant = defineType({
  name: 'variant',
  title: 'Variant',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'sku', title: 'SKU', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'option',
          fields: [
            defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'value', type: 'string', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'name', subtitle: 'value' } },
        }),
      ],
    }),
    defineField({
      name: 'price',
      title: 'Price override',
      type: 'number',
      description: 'Leave empty to use the product price.',
      components: { input: PriceInput },
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: 'stock',
      type: 'number',
      description: 'Units on hand. Empty means not counted yet.',
      components: { input: StockInput },
      validation: (r) => r.integer(),
    }),
    defineField({
      name: 'image',
      type: 'altImage',
      description: 'Optional: selecting this variant swaps the gallery to it.',
    }),
  ],
  preview: {
    select: { title: 'title', sku: 'sku', stock: 'stock' },
    prepare: ({ title, sku, stock }) => ({
      title,
      subtitle: `${sku} · ${typeof stock === 'number' ? `${stock} in stock` : 'stock not counted'}`,
    }),
  },
})

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'pricing', title: 'Price and stock' },
    { name: 'media', title: 'Photos' },
    { name: 'details', title: 'Details' },
    { name: 'admin', title: 'Admin' },
  ],
  fields: [
    defineField({
      name: 'photoNote',
      title: 'Launch notes',
      type: 'string',
      group: 'main',
      description: 'Reshoot note. Studio only.',
      components: { input: VerifyPanel },
    }),
    defineField({ name: 'title', type: 'string', group: 'main', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'main',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      group: 'main',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      group: 'main',
      options: { list: ['active', 'draft', 'archived'], layout: 'radio', direction: 'horizontal' },
      initialValue: 'draft',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'department',
      type: 'reference',
      to: [{ type: 'department' }],
      group: 'main',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'main',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'price',
      type: 'number',
      group: 'pricing',
      components: { input: PriceInput },
      validation: (r) => r.required().integer().min(0),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare-at price',
      type: 'number',
      group: 'pricing',
      description:
        'Only if the item really sold at this price for a meaningful period (Competition Act).',
      components: { input: PriceInput },
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: 'unitCost',
      title: 'Landed unit cost (private)',
      type: 'number',
      group: 'pricing',
      description: 'Unit + freight + duty. Never sent to the storefront.',
      components: { input: UnitCostInput },
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: 'variants',
      type: 'array',
      group: 'pricing',
      of: [defineArrayMember({ type: 'variant' })],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'optionNames',
      title: 'Option names',
      type: 'array',
      group: 'pricing',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'excludedFromPromotions',
      type: 'boolean',
      group: 'pricing',
      initialValue: false,
    }),
    defineField({
      name: 'finalSale',
      title: 'Final sale',
      type: 'boolean',
      group: 'pricing',
      description:
        'Hygiene items. Earrings, hair ties and beauty tools are final sale automatically.',
    }),
    defineField({
      name: 'images',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({ type: 'altImage' })],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'shortDescription',
      type: 'text',
      rows: 2,
      group: 'details',
      validation: (r) => r.required().max(200),
    }),
    defineField({ name: 'description', type: 'richText', group: 'details' }),
    defineField({
      name: 'details',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'careGuide',
      type: 'reference',
      to: [{ type: 'careGuide' }],
      group: 'details',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({ name: 'featured', type: 'boolean', group: 'details', initialValue: false }),
    defineField({
      name: 'verify',
      title: 'Facts to verify',
      type: 'array',
      group: 'admin',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Dimensions, fibre content and so on. Studio only.',
    }),
    defineField({ name: 'seo', type: 'seo', group: 'admin' }),
  ],
  preview: {
    select: { title: 'title', media: 'images.0', price: 'price', status: 'status' },
    prepare: ({ title, media, price, status }) => ({
      title,
      media,
      subtitle: `${status === 'active' ? '' : `${status} · `}$${((price ?? 0) / 100).toFixed(2)}`,
    }),
  },
  orderings: [
    { title: 'Title', name: 'title', by: [{ field: 'title', direction: 'asc' }] },
    { title: 'Price, low to high', name: 'priceAsc', by: [{ field: 'price', direction: 'asc' }] },
  ],
})
