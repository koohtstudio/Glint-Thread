import type { Metadata, Viewport } from 'next'
import { fontVariables } from '@/lib/fonts'
import { publicEnv } from '@/lib/public-env'
import { t } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${t('brand.name')}: fashion jewellery and accessories, shipped across Canada`,
    template: `%s | ${t('brand.name')}`,
  },
  description: t('home.heroSub'),
  applicationName: t('brand.name'),
  formatDetection: { telephone: false, address: false, email: false },
}

export const viewport: Viewport = {
  themeColor: '#0C0B0A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-CA" className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
