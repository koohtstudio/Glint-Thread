import { z } from 'zod'

/**
 * Zod schema for `catalog/products.json`. The catalogue is validated at load time so a bad edit
 * fails loudly in development and in tests instead of rendering a broken page.
 */
const cents = z.number().int().nonnegative()
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case')

export const catalogImageSchema = z.object({
  file: z.string().regex(/^images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  source: z.string().optional(),
  alt: z.string().min(1, 'every image needs alt text'),
})

export const catalogVariantSchema = z.object({
  title: z.string().min(1),
  options: z.record(z.string(), z.string()),
  sku: z.string().min(3),
  priceCents: cents,
  stock: z.number().int().nullable(),
  image: z.string().optional(),
})

export const catalogProductSchema = z.object({
  slug,
  sku: z.string().min(3),
  title: z.string().min(1),
  department: slug,
  category: slug,
  priceCents: cents,
  compareAtPriceCents: cents.nullable(),
  currency: z.literal('CAD'),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  details: z.array(z.string()),
  careGuide: slug.nullable(),
  optionNames: z.array(z.string()),
  variants: z.array(catalogVariantSchema).min(1),
  images: z.array(catalogImageSchema).min(1),
  tags: z.array(z.string()),
  featured: z.boolean(),
  excludedFromPromotions: z.boolean(),
  photoNote: z.string().nullable(),
  verify: z.array(z.string()),
  status: z.enum(['active', 'draft', 'archived']),
  finalSale: z.boolean().optional(),
})

export const tieredPromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('tiered_percent_category'),
  appliesTo: z.object({ categories: z.array(slug), excludeSlugs: z.array(slug).optional() }),
  tiers: z
    .array(
      z.object({ minQty: z.number().int().positive(), percentOff: z.number().positive().max(100) }),
    )
    .min(1),
  badge: z.string(),
  active: z.boolean(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
})

export const bxgyPromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('buy_x_get_y_cheapest_free'),
  appliesTo: z.object({ categories: z.array(slug), excludeSlugs: z.array(slug).optional() }),
  buyQty: z.number().int().positive(),
  getQty: z.number().int().positive(),
  badge: z.string(),
  active: z.boolean(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
})

export const catalogSchema = z
  .object({
    store: z.object({
      name: z.string(),
      currency: z.literal('CAD'),
      locale: z.string(),
      country: z.literal('CA'),
    }),
    departments: z.array(
      z.object({ slug, title: z.string(), order: z.number().int(), blurb: z.string() }),
    ),
    categories: z.array(z.object({ slug, title: z.string(), department: slug })),
    collections: z.array(z.object({ slug, title: z.string(), rule: z.string() })),
    promotions: z.array(z.discriminatedUnion('type', [tieredPromotionSchema, bxgyPromotionSchema])),
    promoCodes: z.array(
      z.object({
        code: z.string().regex(/^[A-Z0-9]+$/),
        type: z.literal('percent_off_order'),
        percentOff: z.number().positive().max(100),
        firstOrderOnly: z.boolean(),
        note: z.string().optional(),
        active: z.boolean(),
        expiresAt: z.string().nullable().optional(),
      }),
    ),
    shipping: z.object({
      country: z.literal('CA'),
      freeShippingThresholdCents: cents,
      methods: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          priceCents: cents,
          freeOverThreshold: z.boolean(),
          eta: z.string(),
          enabled: z.boolean().optional(),
        }),
      ),
    }),
    tax: z.object({
      defaultMode: z.string(),
      note: z.string(),
      ratesAsOf: z.string(),
      provinces: z.record(z.string(), z.record(z.string(), z.number())),
    }),
    products: z.array(catalogProductSchema),
  })
  .superRefine((cat, ctx) => {
    const departments = new Set(cat.departments.map((d) => d.slug))
    const categories = new Map(cat.categories.map((c) => [c.slug, c.department]))
    const skus = new Set<string>()
    const slugs = new Set<string>()
    cat.products.forEach((p, i) => {
      if (slugs.has(p.slug))
        ctx.addIssue({
          code: 'custom',
          path: ['products', i, 'slug'],
          message: `duplicate slug ${p.slug}`,
        })
      slugs.add(p.slug)
      if (!departments.has(p.department))
        ctx.addIssue({
          code: 'custom',
          path: ['products', i, 'department'],
          message: `unknown department ${p.department}`,
        })
      if (categories.get(p.category) !== p.department)
        ctx.addIssue({
          code: 'custom',
          path: ['products', i, 'category'],
          message: `category ${p.category} is not in ${p.department}`,
        })
      p.variants.forEach((v, j) => {
        if (skus.has(v.sku))
          ctx.addIssue({
            code: 'custom',
            path: ['products', i, 'variants', j, 'sku'],
            message: `duplicate sku ${v.sku}`,
          })
        skus.add(v.sku)
        for (const name of Object.keys(v.options)) {
          if (!p.optionNames.includes(name))
            ctx.addIssue({
              code: 'custom',
              path: ['products', i, 'variants', j, 'options'],
              message: `option ${name} not in optionNames`,
            })
        }
      })
    })
  })

export type CatalogFile = z.infer<typeof catalogSchema>
export type CatalogProduct = z.infer<typeof catalogProductSchema>
