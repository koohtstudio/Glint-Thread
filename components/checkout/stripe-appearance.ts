import type { Appearance, StripeElementsOptions } from '@stripe/stripe-js'

/**
 * Stripe Elements styled to the Glint & Thread tokens (PRD 4.2, 4.6): ink surfaces, bone text, underline inputs,
 * 2px radius, no shadows, champagne focus. Stripe renders inside its own iframes, so the colours are the literal
 * token values. Manrope reaches the iframes through Stripe's `fonts` option (see `stripeFonts`).
 */
export const stripeAppearance: Appearance = {
  theme: 'night',
  labels: 'above',
  variables: {
    colorPrimary: '#C9A96E',
    colorBackground: '#141311',
    colorText: '#F4EFE7',
    colorTextSecondary: '#CFC7BA',
    colorTextPlaceholder: '#9A9184',
    colorDanger: '#D07A6E',
    colorSuccess: '#7FA37A',
    fontFamily: 'Manrope, sans-serif',
    fontSizeBase: '16px',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    borderRadius: '2px',
    spacingUnit: '4px',
    gridRowSpacing: '20px',
    gridColumnSpacing: '20px',
  },
  rules: {
    '.Label': {
      fontSize: '11px',
      fontWeight: '500',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#CFC7BA',
    },
    '.Input': {
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '1px solid rgba(244, 239, 231, 0.28)',
      borderRadius: '0',
      boxShadow: 'none',
      padding: '12px 0',
    },
    '.Input:focus': {
      borderBottom: '2px solid #C9A96E',
      boxShadow: 'none',
      outline: 'none',
    },
    '.Input--invalid': { borderBottom: '1px solid #D07A6E', boxShadow: 'none' },
    '.Error': { fontSize: '13px' },
    '.Tab': {
      backgroundColor: '#1B1916',
      border: '1px solid rgba(244, 239, 231, 0.10)',
      boxShadow: 'none',
    },
    '.Tab:hover': { backgroundColor: '#2A2723' },
    '.Tab--selected, .Tab--selected:hover': {
      backgroundColor: '#1B1916',
      border: '1px solid #F4EFE7',
      boxShadow: 'none',
      color: '#F4EFE7',
    },
    '.TabLabel': { fontWeight: '500' },
    '.Block': {
      backgroundColor: '#1B1916',
      border: '1px solid rgba(244, 239, 231, 0.10)',
      boxShadow: 'none',
    },
  },
}

/** Manrope for the Stripe iframes, served from /public/fonts (CORS enabled in next.config.ts), so no font CDN is contacted. */
export function stripeFonts(origin: string): StripeElementsOptions['fonts'] {
  return [
    {
      family: 'Manrope',
      src: `url(${origin}/fonts/manrope-latin.woff2)`,
      weight: '200 800',
      style: 'normal',
      display: 'swap',
    },
  ]
}
