import { Instrument_Serif, Manrope } from 'next/font/google'

/** The only two families (PRD 4.3), self-hosted by next/font with metric-matched fallbacks (no layout shift). */
export const serif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-serif',
})

export const sans = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})

export const fontVariables = `${serif.variable} ${sans.variable}`
