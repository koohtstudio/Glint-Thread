'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import type { ImageRef } from '@/lib/data/types'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/icons'

const DESKTOP_SIZES = '(min-width: 1440px) 780px, (min-width: 1024px) 55vw, 100vw'

/**
 * PDP gallery (PRD 6.3): desktop is a vertical stack of matted images; mobile is a scroll-snap
 * carousel with a "1 / 4" counter. Click or tap opens the zoom viewer.
 */
export function Gallery({
  images,
  title,
  activeIndex = 0,
}: {
  images: ImageRef[]
  title: string
  activeIndex?: number
}) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null)
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLUListElement>(null)
  const stackRefs = useRef<(HTMLLIElement | null)[]>([])

  // Variant images swap the gallery to that image (PRD 4.6).
  useEffect(() => {
    if (activeIndex <= 0) return
    const track = trackRef.current
    if (track && track.offsetParent !== null)
      track.scrollTo({ left: track.clientWidth * activeIndex, behavior: 'smooth' })
    stackRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    setCurrent(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)))
  }

  return (
    <div>
      {/* Mobile and tablet: swipeable carousel */}
      <div className="relative lg:hidden">
        <ul
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          aria-label={title}
        >
          {images.map((img, i) => (
            <li key={`${img.src}-${i}`} className="w-full shrink-0 snap-center snap-always">
              <button
                type="button"
                className="block w-full cursor-zoom-in"
                onClick={() => setZoomIndex(i)}
                aria-label={t('a11y.openZoom', { current: i + 1 })}
              >
                <div className="mat aspect-[4/5]">
                  <div className="mat-inner flex items-center justify-center">
                    <div
                      className="relative h-full w-full"
                      style={
                        img.lowRes ? { maxWidth: img.width, maxHeight: img.height } : undefined
                      }
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes={img.lowRes ? `${img.width}px` : DESKTOP_SIZES}
                        preload={i === 0}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        placeholder={img.blurDataURL ? 'blur' : 'empty'}
                        blurDataURL={img.blurDataURL}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
        {images.length > 1 ? (
          <p
            className="tabular pointer-events-none absolute right-3 bottom-3 bg-ink-950/70 px-2 py-1 text-[11px] tracking-[0.12em] text-bone-50"
            aria-hidden="true"
          >
            {current + 1} / {images.length}
          </p>
        ) : null}
      </div>

      {/* Desktop: vertical stack, natural ratio inside a 4:5 mat */}
      <ul className="hidden flex-col gap-6 lg:flex">
        {images.map((img, i) => (
          <li
            key={`${img.src}-${i}`}
            ref={(el) => {
              stackRefs.current[i] = el
            }}
          >
            <button
              type="button"
              className="block w-full cursor-zoom-in"
              onClick={() => setZoomIndex(i)}
              aria-label={t('a11y.openZoom', { current: i + 1 })}
            >
              <div className="mat aspect-[4/5]">
                <div className="mat-inner flex items-center justify-center">
                  <div
                    className="relative h-full w-full"
                    style={img.lowRes ? { maxWidth: img.width, maxHeight: img.height } : undefined}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes={img.lowRes ? `${img.width}px` : DESKTOP_SIZES}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      placeholder={img.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={img.blurDataURL}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <ZoomViewer images={images} index={zoomIndex} onIndexChange={setZoomIndex} title={title} />
    </div>
  )
}

/**
 * Full-screen zoom viewer (PRD 6.3): pinch-zoom on touch (native), click to magnify on desktop,
 * arrow keys to navigate, Escape to close.
 */
function ZoomViewer({
  images,
  index,
  onIndexChange,
  title,
}: {
  images: ImageRef[]
  index: number | null
  onIndexChange: (i: number | null) => void
  title: string
}) {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const open = index !== null
  const img = index !== null ? images[index] : null

  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return
      setZoomed(false)
      onIndexChange((index + dir + images.length) % images.length)
    },
    [index, images.length, onIndexChange],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(1)
    if (e.key === 'ArrowLeft') go(-1)
  }

  const track = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin(
      `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
    )
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setZoomed(false)
          onIndexChange(null)
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-[80] bg-ink-950" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fade-in fixed inset-0 z-[80] flex flex-col bg-ink-950 outline-none"
          aria-describedby={undefined}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
            <Dialog.Title className="truncate text-[14px] text-bone-300">
              {title}
              {index !== null ? (
                <span className="tabular ml-3 text-bone-500">
                  {t('a11y.imageOf', { current: index + 1, total: images.length })}
                </span>
              ) : null}
            </Dialog.Title>
            <Dialog.Close
              className="flex size-11 items-center justify-center text-bone-300 hover:text-bone-50"
              aria-label={t('a11y.close')}
            >
              <CloseIcon />
            </Dialog.Close>
          </div>
          <div className="relative min-h-0 flex-1 touch-pinch-zoom">
            {img ? (
              <button
                type="button"
                onClick={(e) => {
                  track(e)
                  setZoomed((z) => !z)
                }}
                onMouseMove={zoomed ? track : undefined}
                className={cx(
                  'absolute inset-0 overflow-hidden',
                  zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in',
                )}
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={img.lowRes ? `${img.width}px` : '100vw'}
                  quality={85}
                  className="object-contain transition-transform duration-300 ease-gallery"
                  style={{
                    transform: zoomed ? 'scale(2.2)' : undefined,
                    transformOrigin: origin,
                    ...(img.lowRes ? { objectFit: 'scale-down' } : {}),
                  }}
                />
              </button>
            ) : null}
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-2 flex size-12 -translate-y-1/2 items-center justify-center rounded-xs bg-ink-900/80 text-bone-50 sm:left-6"
                  aria-label={t('a11y.previous')}
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-2 flex size-12 -translate-y-1/2 items-center justify-center rounded-xs bg-ink-900/80 text-bone-50 sm:right-6"
                  aria-label={t('a11y.next')}
                >
                  <ChevronRightIcon />
                </button>
              </>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
