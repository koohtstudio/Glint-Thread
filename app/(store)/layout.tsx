import { Analytics } from '@vercel/analytics/next'
import {
  getCategories,
  getDepartments,
  getHomePage,
  getProductCards,
  getSiteSettings,
} from '@/lib/data'
import { buildNav } from '@/lib/nav'
import { env, features } from '@/lib/env'
import { t } from '@/lib/i18n'
import { sortProducts } from '@/lib/data/derive'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { StoreProviders } from '@/components/layout/store-providers'
import { publicEnv } from '@/lib/public-env'

export default async function StoreLayout({ children }: LayoutProps<'/'>) {
  const [departments, categories, home, settings, cards] = await Promise.all([
    getDepartments(),
    getCategories(),
    getHomePage(),
    getSiteSettings(),
    getProductCards(),
  ])
  const nav = buildNav(departments, categories)
  // "Under $10 add-ons" for the bag: small, giftable, in stock, best-looking first.
  const addOns = sortProducts(
    cards.filter((p) => p.maxPriceCents < 1000 && !p.soldOut && !p.images[0].lowRes),
    'featured',
  ).slice(0, 8)

  return (
    <>
      <a
        href="#main"
        className="btn-label fixed top-2 left-2 z-[70] -translate-y-24 bg-bone-50 px-4 py-3 text-ink-950 focus:translate-y-0"
      >
        {t('a11y.skipToContent')}
      </a>
      <StoreProviders
        nav={nav}
        bag={{
          checkoutEnabled: features.stripe && Boolean(publicEnv.stripePublishableKey),
          taxMode: env.TAX_MODE,
          freeShippingThresholdCents: settings.freeShippingThresholdCents,
          addOns,
        }}
      >
        <AnnouncementBar messages={home.announcements} />
        <Header nav={nav} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer nav={nav} settings={settings} />
      </StoreProviders>
      {process.env.VERCEL ? <Analytics /> : null}
    </>
  )
}
