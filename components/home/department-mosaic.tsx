import Image from 'next/image'
import Link from 'next/link'
import type { Department } from '@/lib/data/types'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

/**
 * Shop by department (PRD 6.1.4): asymmetric mosaic. Desktop 5 x 2: Jewellery 2 x 2, Hats & Scarves 1 x 2,
 * then Bags, Hair, Socks, Charms. Mobile 2 columns: Jewellery full width, Hats tall.
 * Each tile: matted image, serif name, product count as an eyebrow.
 */
const PLACEMENT = [
  'col-span-2 aspect-[4/3] lg:col-span-2 lg:row-span-2 lg:aspect-auto',
  'row-span-2 lg:row-span-2',
  'aspect-square lg:aspect-auto',
  'aspect-square lg:aspect-auto',
  'aspect-square lg:aspect-auto',
  'aspect-square lg:aspect-auto',
]

export function DepartmentMosaic({
  departments,
  extras,
}: {
  departments: Department[]
  extras: Department[]
}) {
  return (
    <div>
      <ul className="grid grid-cols-2 gap-4 md:gap-5 lg:aspect-[5/2.35] lg:grid-cols-5 lg:grid-rows-2 lg:gap-6">
        {departments.map((d, i) => (
          <li
            key={d.slug}
            className={cx('min-h-0', PLACEMENT[i] ?? 'aspect-square lg:aspect-auto')}
          >
            <Link href={`/shop/${d.slug}`} className="group mat flex h-full flex-col">
              <div className="relative min-h-0 flex-1">
                {d.image ? (
                  <div
                    className={cx('absolute', i === 0 ? 'inset-[6%] lg:inset-[7%]' : 'inset-[8%]')}
                  >
                    <Image
                      src={d.image.src}
                      alt=""
                      fill
                      sizes={
                        i === 0
                          ? '(min-width: 1024px) 40vw, 92vw'
                          : '(min-width: 1024px) 20vw, 46vw'
                      }
                      placeholder={d.image.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={d.image.blurDataURL}
                      className="motion-transform object-contain transition-transform duration-900 ease-gallery group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex items-end justify-between gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
                <h3
                  className={cx(
                    'font-serif leading-none text-bone-50',
                    i === 0 ? 'text-[32px] lg:text-[44px]' : 'text-[24px] lg:text-[28px]',
                  )}
                >
                  {d.title}
                </h3>
                <p className="eyebrow tabular shrink-0 pb-0.5">
                  {t('home.productCount', { count: d.productCount })}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {extras.length ? (
        <p className="mt-6 text-[15px] text-bone-300">
          {t('home.also')}{' '}
          {extras.map((d, i) => (
            <span key={d.slug}>
              <Link href={`/shop/${d.slug}`} className="prose-link text-bone-50">
                {d.title}
              </Link>
              {i < extras.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}
