/**
 * Local adapter (DATA_SOURCE=local): reads catalog/products.json plus the default copy in content/.
 * Validated with Zod at load. No Next.js imports, so contract tests and scripts can use it directly.
 */
import rawCatalog from '@/catalog/products.json'
import imageMeta from './generated/image-meta.json'
import { careGuides } from '@/content/care'
import { homeDefaults } from '@/content/home'
import { collectionEditorial, departmentEditorial } from '@/content/merch'
import { pageSeeds } from '@/content/pages'
import { siteDefaults } from '@/content/site'
import { defaultTaxTable } from '@/content/tax'
import { markdownToPortableText } from '@/lib/content/portable'
import type { PricingVariant, Promotion, PromoCode } from '@/lib/pricing/types'
import {
  deriveColours,
  deriveFinishes,
  isFinalSale,
  matchesCollectionRule,
  needsChildWarning,
  parseCollectionRule,
  promotionFor,
  searchList,
  sortProducts,
  colourFromLabel,
  LOW_RES_WIDTH,
  publicDetails,
} from './derive'

export { LOW_RES_WIDTH, publicDetails }
import { catalogSchema, type CatalogFile, type CatalogProduct } from './schema'
import type {
  CareGuide,
  Category,
  Collection,
  DataAdapter,
  Department,
  HomePage,
  ImageRef,
  Page,
  Product,
  SiteSettings,
} from './types'

const IMAGE_BASE = '/catalog/images/'

export interface LocalAdapterOptions {
  /** Stock used when a variant's stock is null ("not yet counted"). PRD 7.1: DEV_DEFAULT_STOCK. */
  defaultStock?: number
  /** Override the catalogue (tests). */
  catalog?: unknown
}

export function loadCatalog(source: unknown = rawCatalog): CatalogFile {
  const parsed = catalogSchema.safeParse(source)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`catalog/products.json failed validation:\n${issues}`)
  }
  return parsed.data
}

export function createLocalAdapter(options: LocalAdapterOptions = {}): DataAdapter & {
  catalog: CatalogFile
} {
  const catalog = loadCatalog(options.catalog)
  const defaultStock = options.defaultStock ?? 10
  const meta = imageMeta as Record<string, { blurDataURL: string }>

  // Image dimensions and alt text, keyed by file, from wherever the file appears in the catalogue.
  const imageIndex = new Map<string, { width: number; height: number; alt: string }>()
  for (const p of catalog.products)
    for (const img of p.images)
      if (!imageIndex.has(img.file))
        imageIndex.set(img.file, { width: img.width, height: img.height, alt: img.alt })

  const toImage = (file: string, alt?: string): ImageRef => {
    const info = imageIndex.get(file)
    if (!info) throw new Error(`Image ${file} is not in the catalogue`)
    return {
      src: IMAGE_BASE + file.replace(/^images\//, ''),
      width: info.width,
      height: info.height,
      alt: alt ?? info.alt,
      blurDataURL: meta[file]?.blurDataURL,
      lowRes: info.width < LOW_RES_WIDTH,
    }
  }

  const promotions = catalog.promotions as Promotion[]
  const departmentsBySlug = new Map(catalog.departments.map((d) => [d.slug, d]))
  const categoriesBySlug = new Map(catalog.categories.map((c) => [c.slug, c]))
  const active = catalog.products.filter((p) => p.status === 'active')

  const buildProduct = (p: CatalogProduct, index: number): Product => {
    const variants = p.variants.map((v) => {
      const stock = v.stock ?? defaultStock
      return {
        sku: v.sku,
        title: v.title,
        options: v.options,
        priceCents: v.priceCents,
        stock,
        available: stock > 0,
        image: v.image ? toImage(v.image) : null,
        colour: v.title === 'Default' ? null : colourFromLabel(v.title),
      }
    })
    const prices = variants.map((v) => v.priceCents)
    const promo = promotionFor(
      { slug: p.slug, categorySlug: p.category, excludedFromPromotions: p.excludedFromPromotions },
      promotions,
    )
    return {
      slug: p.slug,
      sku: p.sku,
      title: p.title,
      departmentSlug: p.department,
      departmentTitle: departmentsBySlug.get(p.department)!.title,
      categorySlug: p.category,
      categoryTitle: categoriesBySlug.get(p.category)!.title,
      priceCents: p.priceCents,
      compareAtPriceCents: p.compareAtPriceCents,
      minPriceCents: Math.min(...prices),
      maxPriceCents: Math.max(...prices),
      shortDescription: p.shortDescription,
      description: markdownToPortableText(p.description, `${p.slug}-`),
      details: publicDetails(p.details),
      careGuideSlug: p.careGuide,
      optionNames: p.optionNames,
      variants,
      images: p.images.map((img) => toImage(img.file, img.alt)),
      tags: p.tags,
      featured: p.featured,
      excludedFromPromotions: p.excludedFromPromotions,
      finishes: deriveFinishes(
        p.tags,
        p.variants.map((v) => v.title),
      ),
      colours: deriveColours(
        p.title,
        p.variants.map((v) => v.title),
      ),
      soldOut: variants.every((v) => !v.available),
      promotion: promo ? { id: promo.id, title: promo.title, badge: promo.badge } : null,
      finalSale: isFinalSale({ categorySlug: p.category, tags: p.tags, finalSale: p.finalSale }),
      childWarning: needsChildWarning(p.tags),
      newness: index,
      seo: {},
    }
  }

  const products = active.map((p) => buildProduct(p, catalog.products.indexOf(p)))
  const productsBySlug = new Map(products.map((p) => [p.slug, p]))

  const departments: Department[] = [...catalog.departments]
    .sort((a, b) => a.order - b.order)
    .map((d) => {
      const editorial = departmentEditorial[d.slug]
      return {
        slug: d.slug,
        title: d.title,
        order: d.order,
        blurb: d.blurb,
        productCount: products.filter((p) => p.departmentSlug === d.slug).length,
        image: editorial
          ? toImage(editorial.image)
          : (products.find((p) => p.departmentSlug === d.slug)?.images[0] ?? null),
        editorialTile: editorial
          ? { image: toImage(editorial.tileImage), line: editorial.line }
          : null,
      }
    })

  const categories: Category[] = catalog.categories.map((c, i) => ({
    slug: c.slug,
    title: c.title,
    departmentSlug: c.department,
    order: i,
    blurb: '',
    productCount: products.filter((p) => p.categorySlug === c.slug).length,
  }))
  // Category blurbs fall back to the department blurb so listing headers always have a line.
  for (const c of categories) c.blurb = departmentsBySlug.get(c.departmentSlug)?.blurb ?? ''

  const collections: Collection[] = catalog.collections.map((c) => {
    const rule = parseCollectionRule(c.rule)
    const matched = sortProducts(
      products.filter((p) => matchesCollectionRule(p, rule)),
      rule.sort,
    )
    const editorial = collectionEditorial[c.slug]
    return {
      slug: c.slug,
      title: c.title,
      blurb: editorial?.blurb ?? '',
      mode: 'rule',
      rule,
      image: editorial ? toImage(editorial.image) : null,
      productSlugs: matched.map((p) => p.slug),
    }
  })

  const settings: SiteSettings = {
    storeName: siteDefaults.storeName,
    legalName: siteDefaults.legalName,
    businessAddress: siteDefaults.businessAddress,
    contactEmail: siteDefaults.contactEmail,
    freeShippingThresholdCents: catalog.shipping.freeShippingThresholdCents,
    shippingMethods: catalog.shipping.methods.map((m) => ({ ...m, enabled: m.enabled ?? true })),
    taxTable: defaultTaxTable,
    pickupAddress: siteDefaults.pickupAddress,
    lowStockThreshold: siteDefaults.lowStockThreshold,
    returnsSummary: siteDefaults.returnsSummary,
    social: siteDefaults.social,
    seo: siteDefaults.seo,
    footerSignOff: siteDefaults.footerSignOff,
  }

  const h = homeDefaults
  const home: HomePage = {
    announcements: h.announcements,
    hero: { ...h.hero, image: toImage(h.hero.image, h.hero.imageAlt) },
    edit: {
      ...h.edit,
      productSlugs: h.edit.productSlugs.length
        ? h.edit.productSlugs
        : products
            .filter((p) => p.featured)
            .slice(0, 8)
            .map((p) => p.slug),
    },
    departmentMosaic: h.departmentMosaic,
    departmentExtras: h.departmentExtras,
    brandBand: h.brandBand,
    spotlight: { ...h.spotlight, image: toImage(h.spotlight.image, h.spotlight.imageAlt) },
    offers: h.offers,
    gifts: h.gifts,
    story: { ...h.story, image: toImage(h.story.image, h.story.imageAlt) },
    newsletter: h.newsletter,
  }

  const pages: Page[] = pageSeeds.map((s) => ({
    slug: s.slug,
    title: s.title,
    eyebrow: s.eyebrow,
    intro: s.intro ?? null,
    body: markdownToPortableText(s.body, `${s.slug}-`),
    faqs: (s.faqs ?? []).map((f, i) => ({
      question: f.question,
      answer: markdownToPortableText(f.answer, `${s.slug}-faq${i}-`),
    })),
    seo: s.seo ?? {},
    updatedAt: null,
  }))

  const guides: CareGuide[] = careGuides.map((g) => ({
    slug: g.slug,
    title: g.title,
    body: markdownToPortableText(g.body, `${g.slug}-`),
  }))

  const pricingVariants: Record<string, PricingVariant> = {}
  for (const p of catalog.products) {
    const product = productsBySlug.get(p.slug)
    for (const v of p.variants) {
      const firstImage = p.images[0]
      pricingVariants[v.sku] = {
        sku: v.sku,
        productSlug: p.slug,
        productTitle: p.title,
        variantTitle: v.title,
        priceCents: v.priceCents,
        stock: v.stock ?? defaultStock,
        categorySlug: p.category,
        departmentSlug: p.department,
        excludedFromPromotions: p.excludedFromPromotions,
        active: p.status === 'active' && Boolean(product),
        image: firstImage
          ? {
              src: toImage(v.image ?? firstImage.file).src,
              alt: firstImage.alt,
              width: firstImage.width,
              height: firstImage.height,
            }
          : null,
      }
    }
  }

  return {
    catalog,
    async getProducts() {
      return products
    },
    async getProductBySlug(slug) {
      return productsBySlug.get(slug) ?? null
    },
    async getDepartments() {
      return departments
    },
    async getDepartment(slug) {
      return departments.find((d) => d.slug === slug) ?? null
    },
    async getCategories() {
      return categories
    },
    async getCategory(departmentSlug, categorySlug) {
      return (
        categories.find((c) => c.slug === categorySlug && c.departmentSlug === departmentSlug) ??
        null
      )
    },
    async getCollections() {
      return collections
    },
    async getCollection(slug) {
      return collections.find((c) => c.slug === slug) ?? null
    },
    async searchProducts(query) {
      return searchList(products, query)
    },
    async getSiteSettings() {
      return settings
    },
    async getHomePage() {
      return home
    },
    async getPage(slug) {
      return pages.find((p) => p.slug === slug) ?? null
    },
    async getPages() {
      return pages
    },
    async getCareGuide(slug) {
      return guides.find((g) => g.slug === slug) ?? null
    },
    async getCareGuides() {
      return guides
    },
    async getVariantsBySku(skus) {
      const out: Record<string, PricingVariant> = {}
      for (const sku of skus) if (pricingVariants[sku]) out[sku] = pricingVariants[sku]
      return out
    },
    async getPromotions() {
      return promotions
    },
    async getPromoCodes() {
      return catalog.promoCodes as PromoCode[]
    },
  }
}
