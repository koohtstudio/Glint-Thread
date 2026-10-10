import type { Metadata } from 'next'
import type { Faq, Product } from '@/lib/data/types'
import { portableTextToPlain } from '@/lib/content/portable'
import { absoluteUrl, publicEnv } from '@/lib/public-env'

export const SITE_NAME = 'Glint & Thread'

export interface Crumb {
  name: string
  href: string
}

/** Per-page metadata with canonical URL and Open Graph defaults (PRD 13). */
export function pageMetadata({
  title,
  description,
  path,
  images,
  noindex,
}: {
  title?: string
  description?: string
  path: string
  images?: { url: string; width?: number; height?: number; alt?: string }[]
  noindex?: boolean
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_CA',
      url: path,
      title: title ?? SITE_NAME,
      description,
      ...(images ? { images } : {}),
    },
    twitter: { card: 'summary_large_image', title: title ?? SITE_NAME, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href),
    })),
  }
}

export function productJsonLd(product: Product) {
  const url = absoluteUrl(`/products/${product.slug}`)
  const offers = product.variants.map((v) => ({
    '@type': 'Offer',
    sku: v.sku,
    name: v.title === 'Default' ? product.title : `${product.title}, ${v.title}`,
    price: (v.priceCents / 100).toFixed(2),
    priceCurrency: 'CAD',
    availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    url,
    seller: { '@type': 'Organization', name: SITE_NAME },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CA' },
    },
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription,
    sku: product.sku,
    url,
    image: product.images.map((i) => absoluteUrl(i.src)),
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: `${product.departmentTitle} > ${product.categoryTitle}`,
    offers:
      offers.length === 1
        ? offers[0]
        : {
            '@type': 'AggregateOffer',
            priceCurrency: 'CAD',
            lowPrice: (product.minPriceCents / 100).toFixed(2),
            highPrice: (product.maxPriceCents / 100).toFixed(2),
            offerCount: offers.length,
            offers,
          },
  }
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: portableTextToPlain(f.answer).replace(/\[\[[^\]]+\]\]\s*/g, ''),
      },
    })),
  }
}

export function organizationJsonLd(contactEmail?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: publicEnv.siteUrl,
    logo: absoluteUrl('/icon.svg'),
    areaServed: 'CA',
    ...(contactEmail && !contactEmail.includes('[[') ? { email: contactEmail } : {}),
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: publicEnv.siteUrl,
    inLanguage: 'en-CA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${publicEnv.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
