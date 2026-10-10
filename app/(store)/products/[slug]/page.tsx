import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getCareGuide,
  getProductBySlug,
  getProductCards,
  getProducts,
  getSiteSettings,
} from '@/lib/data'
import { toCard } from '@/lib/data/derive'
import type { Product, ProductCard as ProductCardData } from '@/lib/data/types'
import { pageMetadata, productJsonLd } from '@/lib/seo'
import { absoluteUrl } from '@/lib/public-env'
import { t } from '@/lib/i18n'
import { Breadcrumbs } from '@/components/content/breadcrumbs'
import { JsonLd } from '@/components/content/json-ld'
import { RichText } from '@/components/content/rich-text'
import { Accordion } from '@/components/ui/accordion'
import { ProductMain } from '@/components/product/product-main'
import { ProductCard } from '@/components/product/product-card'
import { RecentlyViewed } from '@/components/product/recently-viewed'

/** Every product is prerendered, so navigation may block on the cached page. */
export const instant = false

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return {}
  const img = p.images.find((i) => !i.lowRes) ?? p.images[0]
  return pageMetadata({
    title: p.seo.title ?? p.title,
    description: p.seo.description ?? p.shortDescription,
    path: `/products/${p.slug}`,
    images: [{ url: absoluteUrl(img.src), width: img.width, height: img.height, alt: img.alt }],
  })
}

/** "Pairs well with" (PRD 6.3): 4 products sharing tags, same department first. */
function pairsWellWith(product: Product, all: ProductCardData[]): ProductCardData[] {
  const generic = new Set(['gift', 'gift-under-15', 'set'])
  const tags = product.tags.filter((tag) => !generic.has(tag))
  return all
    .filter((p) => p.slug !== product.slug && !p.soldOut)
    .map((p) => ({
      p,
      score:
        p.tags.filter((tag) => tags.includes(tag)).length * 2 +
        (p.departmentSlug === product.departmentSlug ? 3 : 0) +
        (p.categorySlug === product.categorySlug ? -1 : 0) +
        (p.images[0].lowRes ? -2 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p)
}

function promoLine(product: Product): string | null {
  const promo = product.promotion
  if (!promo) return null
  if (promo.title.includes(':')) {
    const name = promo.title.split(':')[0].trim().toLowerCase()
    return `Part of the ${name} offer: ${promo.badge.charAt(0).toLowerCase()}${promo.badge.slice(1)}`
  }
  return `Part of ${promo.title.replace(/\s+socks$/i, '')}: ${promo.badge}`
}

export default async function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()
  const [settings, care, cards] = await Promise.all([
    getSiteSettings(),
    product.careGuideSlug ? getCareGuide(product.careGuideSlug) : Promise.resolve(null),
    getProductCards(),
  ])
  const pairs = pairsWellWith(product, cards)
  const crumbs = [
    { name: t('nav.home'), href: '/' },
    { name: product.departmentTitle, href: `/shop/${product.departmentSlug}` },
    {
      name: product.categoryTitle,
      href: `/shop/${product.departmentSlug}/${product.categorySlug}`,
    },
    { name: product.title, href: `/products/${product.slug}` },
  ]
  const notes = [
    product.finalSale ? t('product.finalSale') : null,
    product.childWarning ? t('product.childWarning') : null,
  ].filter((n): n is string => Boolean(n))
  const returns = settings.returnsSummary

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <div className="container-x pt-0 pb-20 sm:pt-6 lg:pt-10">
        <ProductMain
          product={{ ...toCard(product), images: product.images }}
          lowStockThreshold={settings.lowStockThreshold}
          promoLine={promoLine(product)}
          reassurance={
            product.finalSale ? t('product.reassuranceFinalSale') : t('product.reassurance')
          }
          notes={notes}
          header={
            <>
              <Breadcrumbs crumbs={crumbs} className="mt-6 lg:mt-0" />
              <p className="eyebrow mt-6 lg:mt-8">{product.categoryTitle}</p>
              <h1 className="t-h1 mt-3">{product.title}</h1>
            </>
          }
          intro={
            <p className="mt-6 max-w-[48ch] text-[16px] leading-relaxed text-bone-300">
              {product.shortDescription}
            </p>
          }
          details={
            <Accordion
              items={[
                {
                  id: 'description',
                  title: t('product.description'),
                  content: <RichText value={product.description} size="compact" />,
                },
                ...(product.details.length
                  ? [
                      {
                        id: 'details',
                        title: t('product.details'),
                        content: (
                          <ul className="space-y-1.5">
                            {product.details.map((d) => (
                              <li
                                key={d}
                                className="relative pl-5 before:absolute before:top-[0.75em] before:left-0 before:h-px before:w-2.5 before:bg-bone-500"
                              >
                                {d}
                              </li>
                            ))}
                          </ul>
                        ),
                      },
                    ]
                  : []),
                ...(care
                  ? [
                      {
                        id: 'care',
                        title: t('product.care'),
                        content: <RichText value={care.body} size="compact" />,
                      },
                    ]
                  : []),
                {
                  id: 'shipping',
                  title: t('product.shippingReturns'),
                  content: (
                    <div className="space-y-3">
                      {product.finalSale ? (
                        <p className="text-bone-50">{t('product.finalSale')}</p>
                      ) : null}
                      <ul className="space-y-1.5">
                        {returns.map((r) => (
                          <li
                            key={r}
                            className="relative pl-5 before:absolute before:top-[0.75em] before:left-0 before:h-px before:w-2.5 before:bg-bone-500"
                          >
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                },
              ]}
            />
          }
        />

        {pairs.length ? (
          <section
            aria-labelledby="pairs-title"
            className="mt-20 border-t border-line pt-16 lg:mt-32 lg:pt-24"
          >
            <h2 id="pairs-title" className="t-h3">
              {t('product.pairsWell')}
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5 lg:gap-x-6">
              {pairs.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} sizes="(min-width: 768px) 23vw, 46vw" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <div className="mt-20 lg:mt-32">
          <RecentlyViewed currentSlug={product.slug} />
        </div>
      </div>
    </>
  )
}
