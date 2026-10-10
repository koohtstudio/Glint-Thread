import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/public-env'

/** PRD 13: keep Studio, API, bag, checkout and internal pages out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/studio', '/api', '/bag', '/checkout', '/dev', '/newsletter', '/search'],
      },
    ],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
    host: publicEnv.siteUrl,
  }
}
