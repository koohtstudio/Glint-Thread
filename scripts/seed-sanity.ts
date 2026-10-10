/**
 * Seeds Sanity from catalog/products.json and content/ (PRD 10).
 *
 *   npm run seed -- --dry-run     build every document and print a summary (no keys needed)
 *   npm run seed                  create documents that don't exist yet (safe to re-run)
 *   npm run seed -- --force       replace seeded documents (overwrites owner edits, careful)
 *
 * Idempotent: deterministic IDs (product-<slug>, department-<slug>, ...) and createIfNotExists by default,
 * so re-running never clobbers prices, stock or copy the owner changed in the Studio. Images are uploaded
 * once per file per run; Sanity dedupes identical files by content hash.
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient, type SanityClient } from '@sanity/client'
import { careGuides } from '../content/care'
import { homeDefaults } from '../content/home'
import { collectionEditorial, departmentEditorial } from '../content/merch'
import { pageSeeds } from '../content/pages'
import { siteDefaults } from '../content/site'
import { markdownToPortableText } from '../lib/content/portable'
import { parseCollectionRule } from '../lib/data/derive'
import { loadCatalog } from '../lib/data/local'
import { skuKey } from '../lib/order-number'

type Doc = { _id: string; _type: string; [k: string]: unknown }

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const force = args.has('--force')

function loadEnvFile() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#\n]*)"?\s*(#.*)?$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  }
}

const key = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 60)
const ref = (id: string, k?: string) => ({
  _type: 'reference',
  _ref: id,
  ...(k ? { _key: k } : {}),
})
const withKeys = <T extends object>(items: T[], prefix: string) =>
  items.map((item, i) => ({ _key: `${prefix}${i}`, ...item }))

async function main() {
  loadEnvFile()
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_WRITE_TOKEN

  let client: SanityClient | null = null
  if (!dryRun) {
    if (!projectId || !token) {
      console.error(
        'Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (or run with --dry-run).',
      )
      process.exit(1)
    }
    client = createClient({
      projectId,
      dataset,
      token,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-01',
      useCdn: false,
    })
  }

  const catalog = loadCatalog()
  const imageDir = path.join(process.cwd(), 'catalog')
  const altByFile = new Map<string, string>()
  for (const p of catalog.products)
    for (const img of p.images) if (!altByFile.has(img.file)) altByFile.set(img.file, img.alt)

  // ---------- Images ----------
  const uploaded = new Map<string, string>()
  let uploads = 0
  async function asset(file: string): Promise<string> {
    const cached = uploaded.get(file)
    if (cached) return cached
    let id = `image-dryrun-${key(path.basename(file))}`
    if (client) {
      const res = await client.assets.upload('image', createReadStream(path.join(imageDir, file)), {
        filename: path.basename(file),
      })
      id = res._id
    }
    uploads++
    uploaded.set(file, id)
    return id
  }
  const altImage = async (file: string, alt?: string, k?: string) => ({
    _type: 'altImage',
    ...(k ? { _key: k } : {}),
    alt: alt ?? altByFile.get(file) ?? '',
    asset: ref(await asset(file)),
  })

  const docs: Doc[] = []

  // ---------- Taxonomy ----------
  for (const d of catalog.departments) {
    const ed = departmentEditorial[d.slug]
    docs.push({
      _id: `department-${d.slug}`,
      _type: 'department',
      title: d.title,
      slug: { _type: 'slug', current: d.slug },
      order: d.order,
      blurb: d.blurb,
      ...(ed
        ? {
            heroImage: await altImage(ed.image),
            editorialTile: { image: await altImage(ed.tileImage), line: ed.line },
          }
        : {}),
    })
  }
  catalog.categories.forEach((c, i) =>
    docs.push({
      _id: `category-${c.slug}`,
      _type: 'category',
      title: c.title,
      slug: { _type: 'slug', current: c.slug },
      department: ref(`department-${c.department}`),
      order: i,
    }),
  )

  // ---------- Care guides ----------
  for (const g of careGuides)
    docs.push({
      _id: `careGuide-${g.slug}`,
      _type: 'careGuide',
      title: g.title,
      slug: { _type: 'slug', current: g.slug },
      body: markdownToPortableText(g.body, `${g.slug}-`),
    })

  // ---------- Products ----------
  for (const p of catalog.products) {
    docs.push({
      _id: `product-${p.slug}`,
      _type: 'product',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      sku: p.sku,
      status: p.status,
      department: ref(`department-${p.department}`),
      category: ref(`category-${p.category}`),
      price: p.priceCents,
      ...(p.compareAtPriceCents !== null ? { compareAtPrice: p.compareAtPriceCents } : {}),
      shortDescription: p.shortDescription,
      description: markdownToPortableText(p.description, `${p.slug}-`),
      details: p.details,
      ...(p.careGuide ? { careGuide: ref(`careGuide-${p.careGuide}`) } : {}),
      optionNames: p.optionNames,
      variants: await Promise.all(
        p.variants.map(async (v) => ({
          _type: 'variant',
          _key: skuKey(v.sku),
          title: v.title,
          sku: v.sku,
          options: Object.entries(v.options).map(([name, value], i) => ({
            _type: 'option',
            _key: `o${i}`,
            name,
            value,
          })),
          ...(v.priceCents !== p.priceCents ? { price: v.priceCents } : {}),
          ...(v.stock !== null ? { stock: v.stock } : {}),
          ...(v.image ? { image: await altImage(v.image) } : {}),
        })),
      ),
      images: await Promise.all(p.images.map((img, i) => altImage(img.file, img.alt, `img${i}`))),
      tags: p.tags,
      featured: p.featured,
      excludedFromPromotions: p.excludedFromPromotions,
      ...(typeof p.finalSale === 'boolean' ? { finalSale: p.finalSale } : {}),
      ...(p.photoNote ? { photoNote: p.photoNote } : {}),
      verify: p.verify,
    })
  }

  // ---------- Collections ----------
  for (const c of catalog.collections) {
    const rule = parseCollectionRule(c.rule)
    const ed = collectionEditorial[c.slug]
    docs.push({
      _id: `collection-${c.slug}`,
      _type: 'collection',
      title: c.title,
      slug: { _type: 'slug', current: c.slug },
      mode: 'rule',
      rule: {
        tags: rule.tags,
        ...(rule.maxPriceCents !== null ? { maxPrice: rule.maxPriceCents } : {}),
        sort: rule.sort,
        departments: rule.departments.map((d, i) => ref(`department-${d}`, `d${i}`)),
      },
      ...(ed ? { blurb: ed.blurb, heroImage: await altImage(ed.image) } : {}),
    })
  }

  // ---------- Promotions and codes ----------
  for (const pr of catalog.promotions) {
    docs.push({
      _id: `promotion-${pr.id}`,
      _type: 'promotion',
      promotionId: pr.id,
      title: pr.title,
      type: pr.type,
      active: pr.active,
      badge: pr.badge,
      appliesTo: {
        categories: pr.appliesTo.categories.map((c, i) => ref(`category-${c}`, `c${i}`)),
        exclude: (pr.appliesTo.excludeSlugs ?? []).map((s, i) => ref(`product-${s}`, `x${i}`)),
      },
      ...(pr.type === 'tiered_percent_category'
        ? {
            tiers: withKeys(
              pr.tiers.map((t) => ({ _type: 'tier', ...t })),
              't',
            ),
          }
        : { buyQty: pr.buyQty, getQty: pr.getQty }),
    })
  }
  for (const code of catalog.promoCodes)
    docs.push({
      _id: `promoCode-${code.code}`,
      _type: 'promoCode',
      code: code.code,
      type: code.type,
      percentOff: code.percentOff,
      firstOrderOnly: code.firstOrderOnly,
      active: code.active,
      note: code.note,
    })

  // ---------- Settings and home page singletons ----------
  docs.push({
    _id: 'siteSettings',
    _type: 'siteSettings',
    storeName: siteDefaults.storeName,
    legalName: siteDefaults.legalName,
    businessAddress: siteDefaults.businessAddress,
    contactEmail: siteDefaults.contactEmail,
    freeShippingThreshold: catalog.shipping.freeShippingThresholdCents,
    shippingMethods: catalog.shipping.methods.map((m) => ({
      _type: 'shippingMethod',
      _key: m.id,
      ...m,
      enabled: m.enabled ?? true,
    })),
    lowStockThreshold: siteDefaults.lowStockThreshold,
    returnsSummary: siteDefaults.returnsSummary,
    seo: siteDefaults.seo,
    footerSignOff: siteDefaults.footerSignOff,
  })
  const h = homeDefaults
  const bySlug = new Map(catalog.products.map((p) => [p.slug, p]))
  const featured = h.edit.productSlugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p) && p!.status === 'active')
  docs.push({
    _id: 'homePage',
    _type: 'homePage',
    announcements: h.announcements,
    hero: {
      eyebrow: h.hero.eyebrow,
      headline: h.hero.headline,
      headlineItalic: h.hero.headlineItalic,
      sub: h.hero.sub,
      image: await altImage(h.hero.image, h.hero.imageAlt),
      primaryCta: { _type: 'link', ...h.hero.primaryCta },
      secondaryCta: { _type: 'link', ...h.hero.secondaryCta },
    },
    edit: {
      eyebrow: h.edit.eyebrow,
      title: h.edit.title,
      products: featured.map((p, i) => ref(`product-${p.slug}`, `e${i}`)),
    },
    departmentMosaic: h.departmentMosaic.map((s, i) => ref(`department-${s}`, `m${i}`)),
    departmentExtras: h.departmentExtras.map((s, i) => ref(`department-${s}`, `x${i}`)),
    brandBand: {
      line: h.brandBand.line,
      points: withKeys(
        h.brandBand.points.map((p) => ({ _type: 'point', ...p })),
        'p',
      ),
    },
    spotlight: {
      eyebrow: h.spotlight.eyebrow,
      title: h.spotlight.title,
      body: h.spotlight.body,
      collection: ref(`collection-${h.spotlight.collectionSlug}`),
      image: await altImage(h.spotlight.image, h.spotlight.imageAlt),
    },
    offers: withKeys(
      h.offers.map((o) => ({ _type: 'offer', ...o, link: { _type: 'link', ...o.link } })),
      'o',
    ),
    gifts: {
      eyebrow: h.gifts.eyebrow,
      title: h.gifts.title,
      collection: ref(`collection-${h.gifts.collectionSlug}`),
    },
    story: {
      eyebrow: h.story.eyebrow,
      title: h.story.title,
      body: h.story.body,
      image: await altImage(h.story.image, h.story.imageAlt),
      links: withKeys(
        h.story.links.map((l) => ({ _type: 'link', ...l })),
        'l',
      ),
    },
    newsletter: h.newsletter,
  })

  // ---------- Pages ----------
  for (const p of pageSeeds)
    docs.push({
      _id: `page-${p.slug}`,
      _type: 'page',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      eyebrow: p.eyebrow,
      ...(p.intro ? { intro: p.intro } : {}),
      body: markdownToPortableText(p.body, `${p.slug}-`),
      faqs: (p.faqs ?? []).map((f, i) => ({
        _type: 'faq',
        _key: `f${i}`,
        question: f.question,
        answer: markdownToPortableText(f.answer, `${p.slug}-f${i}-`),
      })),
      ...(p.seo ? { seo: p.seo } : {}),
    })

  // ---------- Write ----------
  const counts = docs.reduce<Record<string, number>>(
    (acc, d) => ({ ...acc, [d._type]: (acc[d._type] ?? 0) + 1 }),
    {},
  )
  const variants = docs
    .filter((d) => d._type === 'product')
    .reduce((n, d) => n + (d.variants as unknown[]).length, 0)
  console.log(
    `[seed] ${dryRun ? 'DRY RUN, nothing written. ' : ''}${docs.length} documents, ${variants} variants, ${uploads} image files`,
  )
  console.table(counts)

  if (dryRun || !client) {
    const sample = docs.find((d) => d._id === 'product-golden-hour-textured-hoops')
    console.log('[seed] sample document:', JSON.stringify(sample, null, 2).slice(0, 1500))
    return
  }

  const BATCH = 40
  for (let i = 0; i < docs.length; i += BATCH) {
    const tx = client.transaction()
    for (const d of docs.slice(i, i + BATCH)) {
      if (force) tx.createOrReplace(d)
      else tx.createIfNotExists(d)
    }
    await tx.commit({ visibility: 'async' })
    console.log(`[seed] wrote ${Math.min(i + BATCH, docs.length)} / ${docs.length}`)
  }
  console.log(
    `[seed] done${force ? ' (replaced existing documents)' : ' (existing documents were left untouched; use --force to replace)'}`,
  )
}

main().catch((err) => {
  console.error('[seed] failed:', err)
  process.exit(1)
})
