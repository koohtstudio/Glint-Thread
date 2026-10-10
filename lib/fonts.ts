import localFont from 'next/font/local'

/** The only two type families (PRD 4.3), self-hosted for deterministic builds and no CDN dependency. */
export const serif = localFont({
  src: [
    { path: '../assets/fonts/InstrumentSerif-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../assets/fonts/InstrumentSerif-Italic.ttf', weight: '400', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-instrument-serif',
  fallback: ['Georgia', 'serif'],
})

export const sans = localFont({
  src: '../public/fonts/manrope-latin.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-manrope',
  fallback: ['Arial', 'sans-serif'],
})

export const fontVariables = `${serif.variable} ${sans.variable}`
