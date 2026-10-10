import { defineArrayMember, defineField, defineType } from 'sanity'
import { PriceInput } from '../components/PriceInput'

/** Shared objects: SEO, links, alt-required images, rich text with callouts. */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (r) => r.max(70).warning('Keep titles under 70 characters'),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (r) => r.max(160).warning('Keep descriptions under 160 characters'),
    }),
  ],
})

export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'href',
      type: 'string',
      description: 'A path like /shop/jewellery or a full URL',
      validation: (r) => r.required(),
    }),
  ],
})

export const altImage = defineType({
  name: 'altImage',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for people who cannot see it. Required (PRD 13).',
      validation: (r) => r.required().min(3),
    }),
  ],
})

export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [defineField({ name: 'text', type: 'text', rows: 3, validation: (r) => r.required() })],
  preview: { select: { title: 'text' }, prepare: ({ title }) => ({ title, subtitle: 'Callout' }) },
})

export const richText = defineType({
  name: 'richText',
  title: 'Rich text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
      ],
      lists: [
        { title: 'Bullets', value: 'bullet' },
        { title: 'Numbers', value: 'number' },
      ],
      marks: {
        decorators: [{ title: 'Italic', value: 'em' }],
        annotations: [
          defineArrayMember({
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              defineField({ name: 'href', type: 'string', validation: (r) => r.required() }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({ type: 'callout' }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'caption', type: 'string' }),
      ],
    }),
  ],
})

export const faq = defineType({
  name: 'faq',
  title: 'Question',
  type: 'object',
  fields: [
    defineField({ name: 'question', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'answer', type: 'richText', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'question' } },
})

export const shippingMethod = defineType({
  name: 'shippingMethod',
  title: 'Shipping method',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      type: 'string',
      options: { list: ['standard', 'expedited', 'pickup'] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'priceCents',
      title: 'Price',
      type: 'number',
      components: { input: PriceInput },
      validation: (r) => r.required().integer().min(0),
    }),
    defineField({
      name: 'freeOverThreshold',
      title: 'Free over the threshold',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'eta',
      title: 'Delivery estimate',
      type: 'string',
      description: 'For example "3 to 7 business days"',
    }),
    defineField({ name: 'enabled', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'label', cents: 'priceCents', enabled: 'enabled' },
    prepare: ({ title, cents, enabled }) => ({
      title,
      subtitle: `${enabled === false ? 'Off · ' : ''}$${((cents ?? 0) / 100).toFixed(2)}`,
    }),
  },
})
