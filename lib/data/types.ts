/**
 * Storefront data types (PRD 8.2). Both adapters (local JSON and Sanity) return exactly these shapes.
 * Money is integer cents. Studio-only fields (photoNote, verify, unitCost) are deliberately absent.
 */
import type { PortableTextBlock } from '@portabletext/types'
import type { Promotion, PromoCode, ShippingMethod } from '@/lib/pricing/types'

export type { Promotion, PromoCode, ShippingMethod }

export type Cents = number

/** Portable Text, the rich text format used by Sanity. Local content is converted into it. */
export type RichText = PortableTextBlock[]

export interface ImageRef {
  src: string
  width: number
  height: number
  alt: string
  /** Tiny inline JPEG for `placeholder="blur"`. */
  blurDataURL?: string
  /** True when the source is a small crop that must never render wider than its natural width. */
  lowRes: boolean
}

export type Finish = 'gold-tone' | 'silver-tone' | 'two-tone' | 'stainless-steel'
export const FINISHES: Finish[] = ['gold-tone', 'silver-tone', 'two-tone', 'stainless-steel']

export type ColourFamily =
  | 'black'
  | 'white'
  | 'grey'
  | 'neutral'
  | 'brown'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'gold'
  | 'silver'
  | 'multi'

export interface ColourSwatch {
  family: ColourFamily
  /** The variant label the colour came from, for example "Mustard". */
  label: string
  hex: string | null
}

export interface Variant {
  sku: string
  title: string
  options: Record<string, string>
  priceCents: Cents
  /** null = untracked (only possible in Sanity mode before launch). */
  stock: number | null
  available: boolean
  image: ImageRef | null
  colour: ColourSwatch | null
}

export interface Product {
  slug: string
  sku: string
  title: string
  departmentSlug: string
  departmentTitle: string
  categorySlug: string
  categoryTitle: string
  priceCents: Cents
  compareAtPriceCents: Cents | null
  minPriceCents: Cents
  maxPriceCents: Cents
  shortDescription: string
  description: RichText
  details: string[]
  careGuideSlug: string | null
  optionNames: string[]
  variants: Variant[]
  images: ImageRef[]
  tags: string[]
  featured: boolean
  excludedFromPromotions: boolean
  finishes: Finish[]
  colours: ColourSwatch[]
  soldOut: boolean
  /** Badge of the automatic promotion this product qualifies for, if any. */
  promotion: { id: string; title: string; badge: string } | null
  finalSale: boolean
  childWarning: boolean
  /** Higher is newer. Local: catalogue position. Sanity: _createdAt rank. */
  newness: number
  seo: { title?: string; description?: string }
}

/** The slim shape sent to client components for cards, listings, search and quick add. */
export type ProductCard = Omit<
  Product,
  'description' | 'details' | 'careGuideSlug' | 'seo' | 'shortDescription'
> & {
  shortDescription?: string
}

export interface Department {
  slug: string
  title: string
  order: number
  blurb: string
  productCount: number
  image: ImageRef | null
  editorialTile: { image: ImageRef; line: string; position?: string } | null
}

export interface Category {
  slug: string
  title: string
  departmentSlug: string
  order: number
  blurb: string
  productCount: number
}

export interface CollectionRule {
  tags: string[]
  maxPriceCents: Cents | null
  departments: string[]
  sort: 'featured' | 'newest'
}

export interface Collection {
  slug: string
  title: string
  blurb: string
  mode: 'rule' | 'manual'
  rule: CollectionRule | null
  image: ImageRef | null
  productSlugs: string[]
}

export interface CareGuide {
  slug: string
  title: string
  body: RichText
}

export interface Link {
  label: string
  href: string
}

export interface SiteSettings {
  storeName: string
  legalName: string
  businessAddress: string
  contactEmail: string
  freeShippingThresholdCents: Cents
  shippingMethods: ShippingMethod[]
  pickupAddress: string | null
  lowStockThreshold: number
  returnsSummary: string[]
  social: Link[]
  seo: { title: string; description: string }
  footerSignOff: string
}

export interface HomePage {
  announcements: string[]
  hero: {
    eyebrow: string
    headline: string
    headlineItalic: string
    sub: string
    image: ImageRef
    primaryCta: Link
    secondaryCta: Link
  }
  edit: { eyebrow: string; title: string; productSlugs: string[] }
  departmentMosaic: string[]
  departmentExtras: string[]
  brandBand: { line: string; points: { title: string; body: string }[] }
  spotlight: {
    eyebrow: string
    collectionSlug: string
    title: string
    body: string
    image: ImageRef
  }
  offers: { eyebrow: string; title: string; titleItalic: string; body: string; link: Link }[]
  gifts: { eyebrow: string; title: string; collectionSlug: string }
  story: { eyebrow: string; title: string; body: string[]; image: ImageRef; links: Link[] }
  newsletter: { eyebrow: string; title: string; body: string }
}

export interface Faq {
  question: string
  answer: RichText
}

export interface Page {
  slug: string
  title: string
  eyebrow: string
  intro: string | null
  body: RichText
  faqs: Faq[]
  seo: { title?: string; description?: string }
  updatedAt: string | null
}

export interface ListingFilters {
  category?: string[]
  finish?: Finish[]
  colour?: ColourFamily[]
  price?: PriceBucket[]
  inStock?: boolean
  sort?: SortKey
}

export type PriceBucket = 'under-10' | '10-20' | '20-40' | '40-plus'
export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc'

/** Every adapter implements this interface; contract tests run the same assertions against each. */
export interface DataAdapter {
  getProducts(): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | null>
  getDepartments(): Promise<Department[]>
  getDepartment(slug: string): Promise<Department | null>
  getCategories(): Promise<Category[]>
  getCategory(departmentSlug: string, categorySlug: string): Promise<Category | null>
  getCollections(): Promise<Collection[]>
  getCollection(slug: string): Promise<Collection | null>
  searchProducts(query: string): Promise<Product[]>
  getSiteSettings(): Promise<SiteSettings>
  getHomePage(): Promise<HomePage>
  getPage(slug: string): Promise<Page | null>
  getPages(): Promise<Page[]>
  getCareGuide(slug: string): Promise<CareGuide | null>
  getCareGuides(): Promise<CareGuide[]>
  getVariantsBySku(
    skus: string[],
  ): Promise<Record<string, import('@/lib/pricing/types').PricingVariant>>
  getPromotions(): Promise<Promotion[]>
  getPromoCodes(): Promise<PromoCode[]>
}
