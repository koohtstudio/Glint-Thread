import { defineQuery } from 'groq'

/**
 * GROQ for the Sanity adapter (PRD 8.2). Projections deliberately omit unitCost, photoNote and verify,
 * so Studio-only fields can never reach the storefront.
 */
const image = `{ alt, "asset": asset->{ _id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "lqip": metadata.lqip } }`

export const PRODUCTS_QUERY =
  defineQuery(`*[_type == "product" && status == "active" && !(_id in path("drafts.**"))] | order(_createdAt asc) {
  _createdAt,
  "slug": slug.current,
  sku,
  title,
  "departmentSlug": department->slug.current,
  "departmentTitle": department->title,
  "categorySlug": category->slug.current,
  "categoryTitle": category->title,
  "priceCents": price,
  "compareAtPriceCents": compareAtPrice,
  shortDescription,
  description,
  details,
  "careGuideSlug": careGuide->slug.current,
  optionNames,
  "variants": variants[]{ title, sku, "options": options[]{ name, value }, "priceCents": coalesce(price, ^.price), stock, "image": image${image} },
  "images": images[]${image},
  tags,
  featured,
  excludedFromPromotions,
  finalSale,
  seo
}`)

export const DEPARTMENTS_QUERY = defineQuery(`*[_type == "department"] | order(order asc) {
  "slug": slug.current, title, order, blurb,
  "heroImage": heroImage${image},
  "editorialTile": editorialTile{ line, "image": image${image} }
}`)

export const CATEGORIES_QUERY = defineQuery(`*[_type == "category"] | order(order asc) {
  "slug": slug.current, title, order, blurb, "departmentSlug": department->slug.current
}`)

export const COLLECTIONS_QUERY = defineQuery(`*[_type == "collection"] | order(title asc) {
  "slug": slug.current, title, blurb, mode,
  "rule": rule{ tags, maxPrice, sort, "departments": departments[]->slug.current },
  "productSlugs": products[]->slug.current,
  "heroImage": heroImage${image}
}`)

export const PROMOTIONS_QUERY = defineQuery(`*[_type == "promotion"] {
  "id": promotionId, title, type, active, badge, tiers[]{ minQty, percentOff }, buyQty, getQty, startsAt, endsAt,
  "appliesTo": { "categories": coalesce(appliesTo.categories[]->slug.current, []), "excludeSlugs": coalesce(appliesTo.exclude[]->slug.current, []) }
}`)

export const PROMO_CODES_QUERY = defineQuery(
  `*[_type == "promoCode"] { code, type, percentOff, firstOrderOnly, active, expiresAt }`,
)

export const SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0] {
  storeName, legalName, businessAddress, contactEmail, freeShippingThreshold, pickupAddress, lowStockThreshold,
  returnsSummary, footerSignOff, seo, "social": social[]{ label, href },
  "shippingMethods": shippingMethods[]{ id, label, priceCents, freeOverThreshold, eta, enabled },
  "taxRows": taxTable[]{ province, "components": components[]{ code, ratePercent, appliesToShipping } }
}`)

export const HOME_QUERY = defineQuery(`*[_type == "homePage" && _id == "homePage"][0] {
  announcements,
  hero{ eyebrow, headline, headlineItalic, sub, "image": image${image}, primaryCta, secondaryCta },
  edit{ eyebrow, title, "productSlugs": products[]->slug.current },
  "departmentMosaic": departmentMosaic[]->slug.current,
  "departmentExtras": departmentExtras[]->slug.current,
  brandBand{ line, points[]{ title, body } },
  spotlight{ eyebrow, title, body, "collectionSlug": collection->slug.current, "image": image${image} },
  offers[]{ eyebrow, title, titleItalic, body, link },
  gifts{ eyebrow, title, "collectionSlug": collection->slug.current },
  story{ eyebrow, title, body, links, "image": image${image} },
  newsletter{ eyebrow, title, body }
}`)

const richText = `[]{ ..., _type == "image" => { ..., "url": asset->url } }`

export const PAGES_QUERY = defineQuery(`*[_type == "page"] {
  "slug": slug.current, title, eyebrow, intro, "body": body${richText}, "faqs": faqs[]{ question, "answer": answer${richText} }, seo, _updatedAt
}`)

export const CARE_GUIDES_QUERY = defineQuery(
  `*[_type == "careGuide"] | order(title asc) { "slug": slug.current, title, "body": body${richText} }`,
)

export const VARIANTS_BY_SKU_QUERY =
  defineQuery(`*[_type == "product" && !(_id in path("drafts.**")) && count(variants[sku in $skus]) > 0] {
  "slug": slug.current, title, status, excludedFromPromotions,
  "categorySlug": category->slug.current, "departmentSlug": department->slug.current,
  "firstImage": images[0]${image},
  "variants": variants[sku in $skus]{ title, sku, "priceCents": coalesce(price, ^.price), stock, "image": image${image} }
}`)
