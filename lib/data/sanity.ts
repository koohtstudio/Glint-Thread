import 'server-only'
import type { SanityClient } from '@sanity/client'
import { careGuides as defaultCare } from '@/content/care'
import { homeDefaults } from '@/content/home'
import { siteDefaults } from '@/content/site'
import { env } from '@/lib/env'
import type { PricingVariant, Promotion, PromoCode } from '@/lib/pricing/types'
import {
  colourFromLabel,
  deriveColours,
  deriveFinishes,
  isFinalSale,
  matchesCollectionRule,
  needsChildWarning,
  promotionFor,
  searchList,
  sortProducts,
  LOW_RES_WIDTH,
  publicDetails,
} from './derive'
import {
  CARE_GUIDES_QUERY,
  CATEGORIES_QUERY,
  COLLECTIONS_QUERY,
  DEPARTMENTS_QUERY,
  HOME_QUERY,
  PAGES_QUERY,
  PRODUCTS_QUERY,
  PROMOTIONS_QUERY,
  PROMO_CODES_QUERY,
  SETTINGS_QUERY,
  VARIANTS_BY_SKU_QUERY,
} from './queries'
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
  RichText,
  SiteSettings,
} from './types'

/**
 * Sanity adapter (DATA_SOURCE=sanity). Returns exactly the shapes of lib/data/types.ts, so the
 * contract tests in contract.ts apply unchanged (run them with SANITY_CONTRACT=1 against a seeded dataset).
 */

interface RawImage {
  alt?: string | null
  asset?: { _id: string; url: string; width?: number; height?: number; lqip?: string } | null
}

function toImage(raw: RawImage | null | undefined, fallbackAlt = ''): ImageRef | null {
  if (!raw?.asset?.url) return null
  const width = raw.asset.width ?? 1200
  return {
    src: raw.asset.url,
    width,
    height: raw.asset.height ?? 1500,
    alt: raw.alt || fallbackAlt,
    blurDataURL: raw.asset.lqip,
    lowRes: width < LOW_RES_WIDTH,
  }
}

interface RawVariant {
  title: string
  sku: string
  options: { name: string; value: string }[] | null
  priceCents: number
  stock: number | null
  image: RawImage | null
}

interface RawProduct {
  _createdAt: string
  slug: string
  sku: string
  title: string
  departmentSlug: string
  departmentTitle: string
  categorySlug: string
  categoryTitle: string
  priceCents: number
  compareAtPriceCents: number | null
  shortDescription: string | null
  description: RichText | null
  details: string[] | null
  careGuideSlug: string | null
  optionNames: string[] | null
  variants: RawVariant[] | null
  images: RawImage[] | null
  tags: string[] | null
  featured: boolean | null
  excludedFromPromotions: boolean | null
  finalSale: boolean | null
  seo: { title?: string; description?: string } | null
}

/** Null stock is "not counted": development uses DEV_DEFAULT_STOCK; production treats it as untracked. */
function resolveStock(stock: number | null): number | null {
  if (typeof stock === 'number') return stock
  return env.NODE_ENV === 'production' ? null : env.DEV_DEFAULT_STOCK
}

export function createSanityAdapter(client?: SanityClient): DataAdapter {
  let clientPromise: Promise<SanityClient> | null = client ? Promise.resolve(client) : null
  const sanity = () =>
    (clientPromise ??= import('@/sanity/lib/server-client').then((m) => m.sanityReadClient()))
  const fresh = () => import('@/sanity/lib/server-client').then((m) => m.sanityWriteClient())
  const query = async <T>(q: string, params: Record<string, unknown> = {}) =>
    (await sanity()).fetch<T>(q, params)

  const loadPromotions = () =>
    query<Promotion[]>(PROMOTIONS_QUERY).then((rows) =>
      rows.map((p) => ({ ...p, startsAt: p.startsAt ?? null, endsAt: p.endsAt ?? null })),
    )

  const products = async (): Promise<Product[]> => {
    const [rows, promotions] = await Promise.all([
      query<RawProduct[]>(PRODUCTS_QUERY),
      loadPromotions(),
    ])
    return rows
      .filter((r) => r.slug && r.variants?.length)
      .map((r, index): Product => {
        const variants = (r.variants ?? []).map((v) => {
          const stock = resolveStock(v.stock)
          return {
            sku: v.sku,
            title: v.title,
            options: Object.fromEntries((v.options ?? []).map((o) => [o.name, o.value])),
            priceCents: v.priceCents,
            stock,
            available: stock === null || stock > 0,
            image: toImage(v.image, r.title),
            colour: v.title === 'Default' ? null : colourFromLabel(v.title),
          }
        })
        const prices = variants.map((v) => v.priceCents)
        const tags = r.tags ?? []
        const promo = promotionFor(
          {
            slug: r.slug,
            categorySlug: r.categorySlug,
            excludedFromPromotions: Boolean(r.excludedFromPromotions),
          },
          promotions,
        )
        return {
          slug: r.slug,
          sku: r.sku,
          title: r.title,
          departmentSlug: r.departmentSlug,
          departmentTitle: r.departmentTitle,
          categorySlug: r.categorySlug,
          categoryTitle: r.categoryTitle,
          priceCents: r.priceCents,
          compareAtPriceCents: r.compareAtPriceCents ?? null,
          minPriceCents: Math.min(...prices),
          maxPriceCents: Math.max(...prices),
          shortDescription: r.shortDescription ?? '',
          description: r.description ?? [],
          details: publicDetails(r.details ?? []),
          careGuideSlug: r.careGuideSlug ?? null,
          optionNames: r.optionNames ?? [],
          variants,
          images: (r.images ?? [])
            .map((i) => toImage(i, r.title))
            .filter((i): i is ImageRef => Boolean(i)),
          tags,
          featured: Boolean(r.featured),
          excludedFromPromotions: Boolean(r.excludedFromPromotions),
          finishes: deriveFinishes(
            tags,
            variants.map((v) => v.title),
          ),
          colours: deriveColours(
            r.title,
            variants.map((v) => v.title),
          ),
          soldOut: variants.every((v) => !v.available),
          promotion: promo ? { id: promo.id, title: promo.title, badge: promo.badge } : null,
          finalSale: isFinalSale({ categorySlug: r.categorySlug, tags, finalSale: r.finalSale }),
          childWarning: needsChildWarning(tags),
          newness: index,
          seo: r.seo ?? {},
        }
      })
      .filter((p) => p.images.length > 0)
  }

  const departments = async (): Promise<Department[]> => {
    type Row = {
      slug: string
      title: string
      order: number
      blurb: string | null
      heroImage: RawImage | null
      editorialTile: { line?: string; image?: RawImage } | null
    }
    const [rows, all] = await Promise.all([query<Row[]>(DEPARTMENTS_QUERY), products()])
    return rows.map((d) => {
      const tileImage = toImage(d.editorialTile?.image, d.title)
      return {
        slug: d.slug,
        title: d.title,
        order: d.order,
        blurb: d.blurb ?? '',
        productCount: all.filter((p) => p.departmentSlug === d.slug).length,
        image:
          toImage(d.heroImage, d.title) ??
          all.find((p) => p.departmentSlug === d.slug)?.images[0] ??
          null,
        editorialTile:
          tileImage && d.editorialTile?.line
            ? { image: tileImage, line: d.editorialTile.line }
            : null,
      }
    })
  }

  const categories = async (): Promise<Category[]> => {
    type Row = {
      slug: string
      title: string
      order: number | null
      blurb: string | null
      departmentSlug: string
    }
    const [rows, all, depts] = await Promise.all([
      query<Row[]>(CATEGORIES_QUERY),
      products(),
      query<{ slug: string; blurb: string | null }[]>(
        `*[_type == "department"]{ "slug": slug.current, blurb }`,
      ),
    ])
    return rows.map((c, i) => ({
      slug: c.slug,
      title: c.title,
      departmentSlug: c.departmentSlug,
      order: c.order ?? i,
      blurb: c.blurb || depts.find((d) => d.slug === c.departmentSlug)?.blurb || '',
      productCount: all.filter((p) => p.categorySlug === c.slug).length,
    }))
  }

  const collections = async (): Promise<Collection[]> => {
    type Row = {
      slug: string
      title: string
      blurb: string | null
      mode: 'rule' | 'manual' | null
      rule: {
        tags?: string[]
        maxPrice?: number
        sort?: 'featured' | 'newest'
        departments?: string[]
      } | null
      productSlugs: string[] | null
      heroImage: RawImage | null
    }
    const [rows, all] = await Promise.all([query<Row[]>(COLLECTIONS_QUERY), products()])
    return rows.map((c) => {
      const rule =
        c.mode === 'manual'
          ? null
          : {
              tags: c.rule?.tags ?? [],
              maxPriceCents: c.rule?.maxPrice ?? null,
              departments: c.rule?.departments ?? [],
              sort: c.rule?.sort ?? ('featured' as const),
            }
      const slugs = rule
        ? sortProducts(
            all.filter((p) => matchesCollectionRule(p, rule)),
            rule.sort,
          ).map((p) => p.slug)
        : (c.productSlugs ?? []).filter((s) => all.some((p) => p.slug === s))
      return {
        slug: c.slug,
        title: c.title,
        blurb: c.blurb ?? '',
        mode: c.mode ?? 'rule',
        rule,
        image: toImage(c.heroImage, c.title),
        productSlugs: slugs,
      }
    })
  }

  const settings = async (): Promise<SiteSettings> => {
    type Row = Partial<SiteSettings> & {
      freeShippingThreshold?: number
      seo?: { title?: string; description?: string }
    }
    const s = await query<Row | null>(SETTINGS_QUERY)
    return {
      storeName: s?.storeName ?? siteDefaults.storeName,
      legalName: s?.legalName ?? siteDefaults.legalName,
      businessAddress: s?.businessAddress ?? siteDefaults.businessAddress,
      contactEmail: s?.contactEmail ?? siteDefaults.contactEmail,
      freeShippingThresholdCents: s?.freeShippingThreshold ?? 6000,
      shippingMethods: (s?.shippingMethods ?? []).map((m) => ({
        ...m,
        enabled: m.enabled ?? true,
      })),
      pickupAddress: s?.pickupAddress ?? null,
      lowStockThreshold: s?.lowStockThreshold ?? siteDefaults.lowStockThreshold,
      returnsSummary: s?.returnsSummary ?? siteDefaults.returnsSummary,
      social: s?.social ?? [],
      seo: {
        title: s?.seo?.title ?? siteDefaults.seo.title,
        description: s?.seo?.description ?? siteDefaults.seo.description,
      },
      footerSignOff: s?.footerSignOff ?? siteDefaults.footerSignOff,
    }
  }

  const home = async (): Promise<HomePage> => {
    type RawHome = Omit<HomePage, 'hero' | 'spotlight' | 'story'> & {
      hero: Omit<HomePage['hero'], 'image'> & { image: RawImage }
      spotlight: Omit<HomePage['spotlight'], 'image'> & { image: RawImage }
      story: Omit<HomePage['story'], 'image'> & { image: RawImage }
    }
    const [h, all] = await Promise.all([query<Partial<RawHome> | null>(HOME_QUERY), products()])
    const fallbackImage = all[0]?.images[0]
    const img = (raw: RawImage | undefined, alt: string) => toImage(raw, alt) ?? fallbackImage!
    const d = homeDefaults
    return {
      announcements: h?.announcements?.length ? h.announcements : d.announcements,
      hero: { ...d.hero, ...(h?.hero ?? {}), image: img(h?.hero?.image, d.hero.imageAlt) },
      edit: {
        eyebrow: h?.edit?.eyebrow ?? d.edit.eyebrow,
        title: h?.edit?.title ?? d.edit.title,
        productSlugs: h?.edit?.productSlugs?.length
          ? h.edit.productSlugs
          : all
              .filter((p) => p.featured)
              .slice(0, 8)
              .map((p) => p.slug),
      },
      departmentMosaic: h?.departmentMosaic?.length ? h.departmentMosaic : d.departmentMosaic,
      departmentExtras: h?.departmentExtras ?? d.departmentExtras,
      brandBand: h?.brandBand?.line ? h.brandBand : d.brandBand,
      spotlight: {
        ...d.spotlight,
        ...(h?.spotlight ?? {}),
        image: img(h?.spotlight?.image, d.spotlight.imageAlt),
      },
      offers: h?.offers?.length ? h.offers : d.offers,
      gifts: { ...d.gifts, ...(h?.gifts ?? {}) },
      story: { ...d.story, ...(h?.story ?? {}), image: img(h?.story?.image, d.story.imageAlt) },
      newsletter: { ...d.newsletter, ...(h?.newsletter ?? {}) },
    }
  }

  const pages = async (): Promise<Page[]> => {
    type Row = {
      slug: string
      title: string
      eyebrow: string | null
      intro: string | null
      body: RichText | null
      faqs: { question: string; answer: RichText }[] | null
      seo: Page['seo'] | null
      _updatedAt: string
    }
    const rows = await query<Row[]>(PAGES_QUERY)
    return rows.map((p) => ({
      slug: p.slug,
      title: p.title,
      eyebrow: p.eyebrow ?? '',
      intro: p.intro,
      body: p.body ?? [],
      faqs: p.faqs ?? [],
      seo: p.seo ?? {},
      updatedAt: p._updatedAt,
    }))
  }

  const guides = async (): Promise<CareGuide[]> => {
    const rows = await query<CareGuide[]>(CARE_GUIDES_QUERY)
    return rows.length ? rows : defaultCare.map((g) => ({ slug: g.slug, title: g.title, body: [] }))
  }

  return {
    getProducts: products,
    async getProductBySlug(slug) {
      return (await products()).find((p) => p.slug === slug) ?? null
    },
    getDepartments: departments,
    async getDepartment(slug) {
      return (await departments()).find((d) => d.slug === slug) ?? null
    },
    getCategories: categories,
    async getCategory(departmentSlug, categorySlug) {
      return (
        (await categories()).find(
          (c) => c.slug === categorySlug && c.departmentSlug === departmentSlug,
        ) ?? null
      )
    },
    getCollections: collections,
    async getCollection(slug) {
      return (await collections()).find((c) => c.slug === slug) ?? null
    },
    async searchProducts(q) {
      return searchList(await products(), q)
    },
    getSiteSettings: settings,
    getHomePage: home,
    async getPage(slug) {
      return (await pages()).find((p) => p.slug === slug) ?? null
    },
    getPages: pages,
    async getCareGuide(slug) {
      return (await guides()).find((g) => g.slug === slug) ?? null
    },
    getCareGuides: guides,
    /** Always fresh (no CDN, no cache): quote and checkout must never see stale price or stock. */
    async getVariantsBySku(skus) {
      type Row = {
        slug: string
        title: string
        status: string
        excludedFromPromotions: boolean | null
        categorySlug: string
        departmentSlug: string
        firstImage: RawImage | null
        variants: RawVariant[]
      }
      const c = env.SANITY_API_WRITE_TOKEN ? await fresh() : await sanity()
      const rows = await c.fetch<Row[]>(VARIANTS_BY_SKU_QUERY, { skus })
      const out: Record<string, PricingVariant> = {}
      for (const p of rows)
        for (const v of p.variants) {
          const img = toImage(v.image ?? p.firstImage, p.title)
          out[v.sku] = {
            sku: v.sku,
            productSlug: p.slug,
            productTitle: p.title,
            variantTitle: v.title,
            priceCents: v.priceCents,
            stock: resolveStock(v.stock),
            categorySlug: p.categorySlug,
            departmentSlug: p.departmentSlug,
            excludedFromPromotions: Boolean(p.excludedFromPromotions),
            active: p.status === 'active',
            image: img
              ? { src: img.src, alt: img.alt, width: img.width, height: img.height }
              : null,
          }
        }
      return out
    },
    getPromotions: loadPromotions,
    async getPromoCodes() {
      return (await query<PromoCode[]>(PROMO_CODES_QUERY)).map((c) => ({
        ...c,
        code: c.code.toUpperCase(),
        expiresAt: c.expiresAt ?? null,
      }))
    },
  }
}
