'use client'

import { useEffect, useState } from 'react'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

/**
 * Announcement bar (PRD 4.6): 36px, ink-900, eyebrow type, centred. Messages crossfade every 5s
 * (no marquee) and pause on hover and focus. All messages stay in the DOM for screen readers.
 */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || messages.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000)
    return () => clearInterval(id)
  }, [paused, messages.length])

  if (!messages.length) return null
  return (
    <section
      aria-label={t('a11y.announcements')}
      className="relative z-50 h-9 bg-ink-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ul className="relative mx-auto h-full max-w-[1440px] px-4">
        {messages.map((m, i) => (
          <li
            key={m}
            tabIndex={i === index ? 0 : -1}
            aria-hidden={i === index ? undefined : true}
            className={cx(
              'eyebrow absolute inset-0 flex items-center justify-center px-4 text-center text-bone-300 transition-opacity duration-700 ease-gallery',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          >
            <span className="truncate">{m}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
