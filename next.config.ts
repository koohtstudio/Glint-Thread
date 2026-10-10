import type { NextConfig } from 'next'

/**
 * Content Security Policy (PRD 13). Pages are statically generated, so scripts use 'unsafe-inline'
 * instead of per-request nonces (nonces would force every page to render dynamically).
 * Stripe.js (Payment Element, Express Checkout Element) needs the origins listed in Stripe's CSP guide;
 * Firebase Auth's client SDK talks to Google's identity endpoints (and apis.google.com for the Google popup).
 * Sanity hosts are allowed for images and the embedded Studio. With the Firebase emulators on, local
 * auth/Firestore hosts are allowed in development only.
 */
const isDev = process.env.NODE_ENV !== 'production'
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://')
const emulatorHosts = isDev ? ' http://localhost:9099 http://127.0.0.1:9099 ws://localhost:9099' : ''

const storefrontCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://js.stripe.com https://*.js.stripe.com https://maps.googleapis.com https://apis.google.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io https://*.stripe.com",
  "font-src 'self' data:",
  `connect-src 'self' https://*.api.sanity.io https://*.apicdn.sanity.io wss://*.api.sanity.io https://api.stripe.com https://maps.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://vitals.vercel-insights.com https://va.vercel-scripts.com${emulatorHosts}`,
  'frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com https://accounts.google.com',
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  ...(isHttps ? ['upgrade-insecure-requests'] : []),
].join('; ')

// The Studio needs eval for its plugin runtime and talks to many Sanity hosts.
const studioCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sanity.io https://core.sanity-cdn.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.sanity.io https://*.sanity.io https://lh3.googleusercontent.com https://*.gravatar.com",
  "font-src 'self' data: https://*.sanity.io",
  "connect-src 'self' https://*.sanity.io wss://*.sanity.io https://*.sanity-cdn.com https://*.sanity.work",
  "frame-src 'self' https://*.sanity.io",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
].join('; ')

const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://js.stripe.com" "https://*.js.stripe.com" "https://hooks.stripe.com")',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  ...(isHttps
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig: NextConfig = {
  // Lets QA run a second server (own env, own build output) beside `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75, 85],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [72, 96, 128, 160, 240, 320],
    localPatterns: [{ pathname: '/catalog/images/**' }, { pathname: '/brand/**' }],
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' }],
    minimumCacheTTL: 2678400,
  },
  serverExternalPackages: ['sharp'],
  async headers() {
    return [
      {
        source: '/((?!studio).*)',
        headers: [...baseHeaders, { key: 'Content-Security-Policy', value: storefrontCsp }],
      },
      {
        source: '/studio/:path*',
        headers: [
          ...baseHeaders.filter((h) => h.key !== 'X-Frame-Options'),
          { key: 'Content-Security-Policy', value: studioCsp },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/dev/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // Stripe's iframes load Manrope from here (cross-origin font requests need CORS).
        source: '/fonts/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/catalog/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
