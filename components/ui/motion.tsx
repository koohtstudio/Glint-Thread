'use client'

import { LazyMotion, MotionConfig, m, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

const loadFeatures = () => import('./motion-features').then((mod) => mod.default)
export const EASE = [0.22, 1, 0.36, 1] as const

/** Loads motion features lazily so the first paint ships only the tiny `m` core (PRD 13 JS budget). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06 } },
}

/**
 * Section reveal (PRD 4.7): opacity 0 to 1, y 16 to 0, 600ms, stagger children 60ms, once.
 * Reduced motion: opacity only, 150ms.
 */
export function Reveal({
  children,
  className,
  as = 'div',
  stagger = false,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'ul' | 'ol'
  stagger?: boolean
}) {
  const reduce = useReducedMotion()
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    shown: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.6, ease: EASE } },
  }
  const Comp = m[as]
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={stagger ? container : item}
    >
      {children}
    </Comp>
  )
}

/** A child of a staggered Reveal. */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  const reduce = useReducedMotion()
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    shown: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.6, ease: EASE } },
  }
  const Comp = m[as]
  return (
    <Comp className={className} variants={item}>
      {children}
    </Comp>
  )
}
