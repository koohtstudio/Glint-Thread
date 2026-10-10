import type { ProductCard, Variant } from '@/lib/data/types'
import type { CartLineSnapshot } from './store'

export function snapshotFor(
  product: Pick<ProductCard, 'slug' | 'title' | 'images'>,
  variant: Variant,
): CartLineSnapshot {
  const image = variant.image ?? product.images[0] ?? null
  return {
    productSlug: product.slug,
    title: product.title,
    variantTitle: variant.title,
    unitPriceCents: variant.priceCents,
    image: image
      ? {
          src: image.src,
          alt: image.alt,
          width: image.width,
          height: image.height,
          blurDataURL: image.blurDataURL,
        }
      : null,
  }
}
