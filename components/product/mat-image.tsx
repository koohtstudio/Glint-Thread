import Image from 'next/image'
import type { ReactNode } from 'react'
import type { ImageRef } from '@/lib/data/types'
import { cx } from '@/lib/cx'

interface MatImageProps {
  image: ImageRef
  /** Exact `sizes` for the mat's rendered width. Low-res images are capped at their natural width. */
  sizes: string
  /** Aspect of the mat. Images always sit object-contain inside it. */
  aspect?: '4/5' | '1/1' | '3/4'
  preload?: boolean
  className?: string
  imageClassName?: string
  /** Rendered inside the mat above the image (badges, quick add). */
  children?: ReactNode
  /** Second image that crossfades in on hover (pointer devices). */
  hoverLayer?: ReactNode
  /** Mat padding override: 'tight' for thumbnails. */
  inset?: 'default' | 'tight'
}

const aspectClass = { '4/5': 'aspect-[4/5]', '1/1': 'aspect-square', '3/4': 'aspect-[3/4]' }

/**
 * The mat (PRD 4.5): ink-800 surround, 8% inner padding (4% on mobile), 1px hairline, image
 * object-contain and centred, so photos on slightly different blacks read as a framed series.
 */
export function MatImage({
  image,
  sizes,
  aspect = '4/5',
  preload = false,
  className,
  imageClassName,
  children,
  hoverLayer,
  inset = 'default',
}: MatImageProps) {
  return (
    <div className={cx('mat', aspectClass[aspect], className)}>
      <div
        className={cx(
          inset === 'tight' ? 'absolute inset-[6%]' : 'mat-inner',
          'flex items-center justify-center',
        )}
      >
        <div
          className="relative h-full w-full"
          style={image.lowRes ? { maxWidth: image.width, maxHeight: image.height } : undefined}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={image.lowRes ? `${image.width}px` : sizes}
            preload={preload}
            loading={preload ? 'eager' : 'lazy'}
            placeholder={image.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={image.blurDataURL}
            className={cx('object-contain', imageClassName)}
          />
          {hoverLayer}
        </div>
      </div>
      {children}
    </div>
  )
}

/** Unmatted full-bleed editorial image (PRD 4.5: heroes and editorial tiles may skip the mat). */
export function BleedImage({
  image,
  sizes,
  preload = false,
  className,
  imageClassName,
  fit = 'cover',
}: {
  image: ImageRef
  sizes: string
  preload?: boolean
  className?: string
  imageClassName?: string
  fit?: 'cover' | 'contain'
}) {
  return (
    <div className={cx('relative overflow-hidden bg-ink-950', className)}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        preload={preload}
        loading={preload ? 'eager' : 'lazy'}
        fetchPriority={preload ? 'high' : undefined}
        placeholder={image.blurDataURL ? 'blur' : 'empty'}
        blurDataURL={image.blurDataURL}
        className={cx(fit === 'cover' ? 'object-cover' : 'object-contain', imageClassName)}
      />
    </div>
  )
}
