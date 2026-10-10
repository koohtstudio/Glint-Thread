import { defineArrayMember, defineField, defineType } from 'sanity'
import { PriceInput } from '../components/PriceInput'

export const careGuide = defineType({
  name: 'careGuide',
  title: 'Care guide',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'body', type: 'richText' }),
  ],
})

export const page = defineType({
  name: 'page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'intro', type: 'text', rows: 2 }),
    defineField({
      name: 'body',
      type: 'richText',
      description:
        'Owner facts still to fill in are written [[LIKE_THIS]]. The launch check fails while any remain.',
    }),
    defineField({
      name: 'faqs',
      title: 'Questions',
      type: 'array',
      of: [defineArrayMember({ type: 'faq' })],
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({ title, subtitle: `/${slug ?? ''}` }),
  },
})

/** Home page singleton (PRD 6.1): every section is editable. */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  groups: [
    { name: 'top', title: 'Top', default: true },
    { name: 'sections', title: 'Sections' },
  ],
  fields: [
    defineField({
      name: 'announcements',
      type: 'array',
      group: 'top',
      of: [defineArrayMember({ type: 'string' })],
      validation: (r) => r.max(5),
    }),
    defineField({
      name: 'hero',
      type: 'object',
      group: 'top',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'headline', type: 'string', validation: (r) => r.required() }),
        defineField({ name: 'headlineItalic', title: 'Italic tail', type: 'string' }),
        defineField({ name: 'sub', type: 'text', rows: 2 }),
        defineField({ name: 'image', type: 'altImage', validation: (r) => r.required() }),
        defineField({ name: 'primaryCta', type: 'link' }),
        defineField({ name: 'secondaryCta', type: 'link' }),
      ],
    }),
    defineField({
      name: 'edit',
      title: "This week's edit",
      type: 'object',
      group: 'sections',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({
          name: 'products',
          type: 'array',
          description: 'Leave empty to use featured products.',
          of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
          validation: (r) => r.max(12),
        }),
      ],
    }),
    defineField({
      name: 'departmentMosaic',
      title: 'Department mosaic order',
      type: 'array',
      group: 'sections',
      description: 'First is the large tile, second the tall one, then four small tiles.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'department' }] })],
      validation: (r) => r.max(6),
    }),
    defineField({
      name: 'departmentExtras',
      title: 'Also links',
      type: 'array',
      group: 'sections',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'department' }] })],
    }),
    defineField({
      name: 'brandBand',
      type: 'object',
      group: 'sections',
      fields: [
        defineField({ name: 'line', type: 'string' }),
        defineField({
          name: 'points',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'point',
              fields: [
                defineField({ name: 'title', type: 'string' }),
                defineField({ name: 'body', type: 'text', rows: 3 }),
              ],
            }),
          ],
          validation: (r) => r.max(3),
        }),
      ],
    }),
    defineField({
      name: 'spotlight',
      type: 'object',
      group: 'sections',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'collection', type: 'reference', to: [{ type: 'collection' }] }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'body', type: 'text', rows: 3 }),
        defineField({ name: 'image', type: 'altImage' }),
      ],
    }),
    defineField({
      name: 'offers',
      title: 'Offers band',
      type: 'array',
      group: 'sections',
      validation: (r) => r.max(2),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'offer',
          fields: [
            defineField({ name: 'eyebrow', type: 'string' }),
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'titleItalic', type: 'string' }),
            defineField({ name: 'body', type: 'text', rows: 2 }),
            defineField({ name: 'link', type: 'link' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'gifts',
      type: 'object',
      group: 'sections',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'collection', type: 'reference', to: [{ type: 'collection' }] }),
      ],
    }),
    defineField({
      name: 'story',
      type: 'object',
      group: 'sections',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'body', type: 'array', of: [defineArrayMember({ type: 'text' })] }),
        defineField({ name: 'image', type: 'altImage' }),
        defineField({ name: 'links', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
      ],
    }),
    defineField({
      name: 'newsletter',
      type: 'object',
      group: 'sections',
      fields: [
        defineField({ name: 'eyebrow', type: 'string' }),
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'body', type: 'text', rows: 3 }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
})

/** Site settings singleton (PRD 10). */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({ name: 'storeName', type: 'string', initialValue: 'Glint & Thread' }),
    defineField({ name: 'legalName', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'businessAddress',
      type: 'text',
      rows: 2,
      validation: (r) => r.required(),
    }),
    defineField({ name: 'contactEmail', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'freeShippingThreshold',
      type: 'number',
      components: { input: PriceInput },
      validation: (r) => r.required().integer().min(0),
    }),
    defineField({
      name: 'shippingMethods',
      type: 'array',
      of: [defineArrayMember({ type: 'shippingMethod' })],
    }),
    defineField({
      name: 'pickupAddress',
      type: 'text',
      rows: 2,
      description: 'Shown when local pickup is enabled.',
    }),
    defineField({
      name: 'lowStockThreshold',
      type: 'number',
      initialValue: 3,
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: 'returnsSummary',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({ name: 'social', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
    defineField({ name: 'seo', title: 'Default SEO', type: 'seo' }),
    defineField({ name: 'footerSignOff', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
