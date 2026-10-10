import type { Metadata } from 'next'
import {
  getCollection,
  getDepartments,
  getHomePage,
  getProductCardsBySlugs,
  getSiteSettings,
} from '@/lib/data'
import { organizationJsonLd, pageMetadata, websiteJsonLd } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { JsonLd } from '@/components/content/json-ld'
import { TextLink } from '@/components/ui/text-link'
import { Hero } from '@/components/home/hero'
import { EditScroller } from '@/components/home/edit-scroller'
import { DepartmentMosaic } from '@/components/home/department-mosaic'
import { SectionHeading } from '@/components/home/section-heading'
import {
  BrandBand,
  GiftsRow,
  NewsletterBand,
  OffersBand,
  Spotlight,
  Story,
} from '@/components/home/sections'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    ...pageMetadata({ path: '/', description: settings.seo.description }),
    title: { absolute: settings.seo.title },
  }
}

export default async function HomePage() {
  const [home, departments, settings] = await Promise.all([
    getHomePage(),
    getDepartments(),
    getSiteSettings(),
  ])
  const [spotlightCollection, giftsCollection] = await Promise.all([
    getCollection(home.spotlight.collectionSlug),
    getCollection(home.gifts.collectionSlug),
  ])
  const [edit, spotlight, gifts] = await Promise.all([
    getProductCardsBySlugs(home.edit.productSlugs),
    getProductCardsBySlugs(spotlightCollection?.productSlugs.slice(0, 8) ?? []),
    getProductCardsBySlugs(giftsCollection?.productSlugs ?? []),
  ])
  const bySlug = new Map(departments.map((d) => [d.slug, d]))
  const mosaic = home.departmentMosaic.map((s) => bySlug.get(s)).filter((d) => d !== undefined)
  const extras = home.departmentExtras.map((s) => bySlug.get(s)).filter((d) => d !== undefined)
  // Gifts row: featured, well-photographed pieces first, and nothing already in the edit above.
  const editSlugs = new Set(edit.map((p) => p.slug))
  const giftPicks = [...gifts]
    .filter((p) => !editSlugs.has(p.slug) && !p.images[0].lowRes && !p.soldOut)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
  const spotlightPicks = spotlight.filter((p) => !p.soldOut && p.slug !== 'corduroy-baker-boy-cap')

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings.contactEmail), websiteJsonLd()]} />
      <Hero hero={home.hero} />

      <section aria-labelledby="edit-title" className="section-y border-t border-line">
        <EditScroller
          labelledBy="edit-title"
          products={edit}
          heading={
            <SectionHeading
              id="edit-title"
              eyebrow={home.edit.eyebrow}
              title={home.edit.title}
              action={
                <TextLink href="/collections/new-in" className="lg:hidden">
                  {t('home.editLink')}
                </TextLink>
              }
            />
          }
        />
      </section>

      <section aria-labelledby="departments-title" className="section-y pt-0 md:pt-0 lg:pt-0">
        <div className="container-x">
          <SectionHeading
            id="departments-title"
            eyebrow={t('home.departmentsEyebrow')}
            title={t('home.departmentsTitle')}
            className="mb-10 lg:mb-14"
          />
          <DepartmentMosaic departments={mosaic} extras={extras} />
        </div>
      </section>

      <BrandBand band={home.brandBand} />
      <Spotlight spotlight={home.spotlight} products={spotlightPicks} />
      <OffersBand offers={home.offers} />
      <GiftsRow gifts={home.gifts} products={giftPicks} />
      <Story story={home.story} />
      <NewsletterBand newsletter={home.newsletter} />
    </>
  )
}
