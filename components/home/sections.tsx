import Link from 'next/link'
import type { HomePage, ProductCard as ProductCardData } from '@/lib/data/types'
import { t } from '@/lib/i18n'
import { TextLink } from '@/components/ui/text-link'
import { Reveal, RevealItem } from '@/components/ui/motion'
import { BleedImage } from '@/components/product/mat-image'
import { ProductCard } from '@/components/product/product-card'
import { NewsletterForm } from '@/components/content/newsletter-form'
import { SectionHeading } from './section-heading'

/** 5. Brand band (PRD 6.1.5): bone-50 section, the brand line at H1 size, three short paragraphs, no icons. */
export function BrandBand({ band }: { band: HomePage['brandBand'] }) {
  return (
    <section aria-labelledby="brand-band" className="light-section on-light section-y">
      <div className="container-x">
        <Reveal stagger className="grid-editorial gap-y-12">
          <RevealItem className="col-span-4 md:col-span-6 lg:col-span-10">
            <p className="eyebrow">{t('home.brandBandEyebrow')}</p>
            <h2 id="brand-band" className="t-h1 mt-6 max-w-[22ch]">
              {band.line}
            </h2>
          </RevealItem>
          <div className="col-span-4 grid gap-10 md:col-span-6 md:grid-cols-3 md:gap-5 lg:col-span-9 lg:col-start-4 lg:gap-6 lg:pt-8">
            {band.points.map((p) => (
              <RevealItem key={p.title} className="border-t border-ink-950/15 pt-5">
                <h3 className="font-serif text-[24px] leading-tight">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-bone-700">{p.body}</p>
              </RevealItem>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/** 6. Collection spotlight (PRD 6.1.6): image left, H2 and two lines right, then 4 products. */
export function Spotlight({
  spotlight,
  products,
}: {
  spotlight: HomePage['spotlight']
  products: ProductCardData[]
}) {
  const href = `/collections/${spotlight.collectionSlug}`
  return (
    <section aria-labelledby="spotlight-title" className="section-y">
      <div className="container-x grid-editorial gap-y-10">
        <Reveal className="col-span-4 md:col-span-6 lg:col-span-5 lg:row-span-2">
          <Link href={href} className="group block" tabIndex={-1} aria-hidden="true">
            <BleedImage
              image={spotlight.image}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="aspect-[4/5] w-full lg:sticky lg:top-28"
              imageClassName="transition-transform duration-900 ease-gallery group-hover:scale-[1.03] motion-transform"
            />
          </Link>
        </Reveal>
        <Reveal className="col-span-4 md:col-span-5 lg:col-span-6 lg:col-start-7 lg:pt-6">
          <p className="eyebrow">{spotlight.eyebrow}</p>
          <h2 id="spotlight-title" className="t-h2 mt-4">
            {spotlight.title}
          </h2>
          <p className="t-lede mt-6 max-w-[46ch]">{spotlight.body}</p>
          <TextLink href={href} className="mt-6">
            {t('home.spotlightCta')}
          </TextLink>
        </Reveal>
        <Reveal
          stagger
          as="ul"
          className="col-span-4 grid grid-cols-2 gap-x-4 gap-y-10 md:col-span-6 md:gap-x-5 lg:col-span-6 lg:col-start-7 lg:gap-x-6"
        >
          {products.slice(0, 4).map((p) => (
            <RevealItem as="li" key={p.slug}>
              <ProductCard product={p} sizes="(min-width: 1024px) 22vw, 46vw" />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/** 7. Offers band (PRD 6.1.7): two typographic panels, hairlines and space. No banners or coloured boxes. */
export function OffersBand({ offers }: { offers: HomePage['offers'] }) {
  return (
    <section aria-label={t('home.offersEyebrow')} className="border-y border-line">
      <div className="container-x grid md:grid-cols-2">
        {offers.map((o, i) => (
          <Reveal
            key={o.title}
            className={
              i === 0
                ? 'border-b border-line py-14 md:border-r md:border-b-0 md:py-20 md:pr-10 lg:py-28 lg:pr-16'
                : 'py-14 md:py-20 md:pl-10 lg:py-28 lg:pl-16'
            }
          >
            <p className="eyebrow">{o.eyebrow}</p>
            <h2 className="t-h2 mt-5">
              {o.title} <em className="italic">{o.titleItalic}</em>
            </h2>
            <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-bone-300">{o.body}</p>
            <TextLink href={o.link.href} className="mt-6">
              {o.link.label}
            </TextLink>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/** 8. Gifts under $15 (PRD 6.1.8): a product row. */
export function GiftsRow({
  gifts,
  products,
}: {
  gifts: HomePage['gifts']
  products: ProductCardData[]
}) {
  return (
    <section aria-labelledby="gifts-title" className="section-y">
      <div className="container-x">
        <SectionHeading
          id="gifts-title"
          eyebrow={gifts.eyebrow}
          title={gifts.title}
          action={
            <TextLink href={`/collections/${gifts.collectionSlug}`}>{t('home.giftsLink')}</TextLink>
          }
        />
        <Reveal
          stagger
          as="ul"
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-5 lg:mt-14 lg:gap-x-6"
        >
          {products.slice(0, 4).map((p) => (
            <RevealItem as="li" key={p.slug}>
              <ProductCard product={p} sizes="(min-width: 768px) 23vw, 46vw" />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/** 9. Talismans story (PRD 6.1.9): full-bleed pendant image, a short paragraph on the nazar, two links. */
export function Story({ story }: { story: HomePage['story'] }) {
  return (
    <section
      aria-labelledby="story-title"
      className="grid border-t border-line lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="container-x order-2 flex flex-col justify-center py-14 lg:order-1 lg:max-w-none lg:py-24 lg:pr-12 lg:pl-[max(40px,calc((100vw-1440px)/2+40px))] xl:pr-20">
        <Reveal>
          <p className="eyebrow">{story.eyebrow}</p>
          <h2 id="story-title" className="t-h2 mt-4 max-w-[16ch]">
            {story.title}
          </h2>
          <div className="mt-6 max-w-[48ch] space-y-4 text-[16px] leading-relaxed text-bone-300">
            {story.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <ul className="mt-8 flex flex-col items-start gap-1">
            {story.links.map((l) => (
              <li key={l.href}>
                <TextLink href={l.href}>{l.label}</TextLink>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <div className="order-1 overflow-hidden lg:order-2">
        <BleedImage
          image={story.image}
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="aspect-[4/5] w-full sm:aspect-[4/3] lg:aspect-auto lg:h-[88vh] lg:max-h-[960px] lg:min-h-[560px]"
          imageClassName="object-[50%_45%]"
        />
      </div>
    </section>
  )
}

/** 10. Newsletter (PRD 6.1.10, 9.7) on bone-50 with CASL consent. */
export function NewsletterBand({ newsletter }: { newsletter: HomePage['newsletter'] }) {
  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      className="light-section on-light section-y scroll-mt-24"
    >
      <div className="container-x grid-editorial gap-y-10">
        <div className="col-span-4 md:col-span-6 lg:col-span-6">
          <p className="eyebrow">{newsletter.eyebrow}</p>
          <h2 id="newsletter-title" className="t-h1 mt-5 max-w-[14ch]">
            {newsletter.title}
          </h2>
        </div>
        <div className="col-span-4 md:col-span-6 lg:col-span-5 lg:col-start-8 lg:pt-4">
          <p className="max-w-[48ch] text-[16px] leading-relaxed text-bone-700">
            {newsletter.body}
          </p>
          <div className="mt-8">
            <NewsletterForm tone="light" source="home" />
          </div>
        </div>
      </div>
    </section>
  )
}
