import { defineArrayMember, defineField, defineType } from 'sanity'

export const department = defineType({
  name: 'department',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'order', type: 'number', validation: (r) => r.required().integer() }),
    defineField({ name: 'blurb', type: 'text', rows: 2 }),
    defineField({ name: 'heroImage', type: 'altImage' }),
    defineField({
      name: 'editorialTile',
      title: 'Editorial tile',
      type: 'object',
      description: 'The 2-column tile shown in listings after every 8th product.',
      fields: [
        defineField({ name: 'image', type: 'altImage' }),
        defineField({ name: 'line', type: 'string', validation: (r) => r.max(80) }),
      ],
    }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', media: 'heroImage' } },
})

export const category = defineType({
  name: 'category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'department',
      type: 'reference',
      to: [{ type: 'department' }],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'order', type: 'number' }),
    defineField({ name: 'blurb', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'title', subtitle: 'department.title' } },
})

export const collection = defineType({
  name: 'collection',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'mode',
      type: 'string',
      options: { list: ['rule', 'manual'], layout: 'radio', direction: 'horizontal' },
      initialValue: 'rule',
    }),
    defineField({
      name: 'rule',
      type: 'object',
      hidden: ({ parent }) => parent?.mode === 'manual',
      fields: [
        defineField({
          name: 'tags',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          options: { layout: 'tags' },
          description: 'Products with any of these tags',
        }),
        defineField({ name: 'maxPrice', title: 'Maximum price (cents)', type: 'number' }),
        defineField({
          name: 'departments',
          type: 'array',
          of: [defineArrayMember({ type: 'reference', to: [{ type: 'department' }] })],
        }),
        defineField({
          name: 'sort',
          type: 'string',
          options: { list: ['featured', 'newest'] },
          initialValue: 'featured',
        }),
      ],
    }),
    defineField({
      name: 'products',
      type: 'array',
      hidden: ({ parent }) => parent?.mode !== 'manual',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
    }),
    defineField({ name: 'heroImage', type: 'altImage' }),
    defineField({ name: 'blurb', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'title', subtitle: 'mode', media: 'heroImage' } },
})
