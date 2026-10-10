import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Glint & Thread',
    short_name: 'Glint & Thread',
    description:
      'Gold-tone jewellery and everyday accessories, chosen in small batches and shipped across Canada.',
    start_url: '/',
    display: 'browser',
    background_color: '#0C0B0A',
    theme_color: '#0C0B0A',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
