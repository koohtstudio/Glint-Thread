import Link from 'next/link'
import type { HomePage } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { TextLink } from '@/components/ui/text-link'
import { BleedImage } from '@/components/product/mat-image'

/**
 * Hero, split editorial (PRD 6.1.2). One DOM, reordered by grid:
 * desktop: image 7/12 full-bleed to the left viewport edge (88vh max, 560px min), text 5/12 right,
 * vertically centred and left-aligned. Mobile: headline, then the image at 4:5, then the sub and CTAs.
 */
export function Hero({ hero }: { hero: HomePage['hero'] }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[1fr_auto_auto_1fr]"
    >
      <div className="container-x pt-10 pb-8 sm:pt-14 lg:col-start-2 lg:row-start-2 lg:max-w-none lg:pt-0 lg:pr-[max(40px,calc((100vw-1440px)/2+40px))] lg:pb-0 lg:pl-12 xl:pl-20">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1 id="hero-title" className="t-hero mt-5 lg:mt-6">
          <span className="hero-line">{hero.headline}</span>
          <span className="hero-line italic" style={{ animationDelay: '70ms' }}>
            {hero.headlineItalic}
          </span>
        </h1>
      </div>

      <div className="overflow-hidden lg:col-start-1 lg:row-span-4 lg:row-start-1">
        <BleedImage
          image={hero.image}
          sizes="(min-width: 1024px) 58vw, 100vw"
          preload
          className="hero-settle aspect-[4/5] w-full sm:aspect-[16/15] lg:aspect-auto lg:h-[88vh] lg:max-h-[1000px] lg:min-h-[560px]"
          // Crop in the gaps between card rows: rows 1 to 3 stay whole.
          imageClassName="object-[50%_29%]"
        />
      </div>

      <div className="container-x pt-8 pb-16 lg:col-start-2 lg:row-start-3 lg:max-w-none lg:pt-8 lg:pr-[max(40px,calc((100vw-1440px)/2+40px))] lg:pb-0 lg:pl-12 xl:pl-20">
        <p className="t-lede max-w-[34ch]">{hero.sub}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 lg:mt-10">
          <Button asChild>
            <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
          </Button>
          <TextLink href={hero.secondaryCta.href}>{hero.secondaryCta.label}</TextLink>
        </div>
      </div>
    </section>
  )
}
