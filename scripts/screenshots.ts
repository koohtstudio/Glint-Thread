/**
 * Design QA screenshots (PRD 14.2).
 *
 *   npm run build && npx next start --port 3100   (in another terminal)
 *   npm run shots -- pass-1                       writes screenshots/pass-1/*.png
 *
 * Captures Home, Jewellery, Earrings, a single-variant PDP, a multi-option PDP, the bag drawer with a sock
 * bundle and earrings, the search overlay, the menu, 404 and About at 390, 768, 1280 and 1440 px.
 * Pages are full-page; overlays are viewport shots. BASE_URL overrides the server (default :3100).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const pass = process.argv[2] ?? 'pass-1'
const outDir = path.join(process.cwd(), 'screenshots', pass)
const WIDTHS = (process.env.WIDTHS ?? '390,768,1280,1440').split(',').map(Number)
const ONLY = process.env.ONLY?.split(',')

const BAG = {
  state: {
    lines: [
      {
        sku: 'GT-SOK-004-BUN',
        qty: 3,
        addedAt: 1,
        productSlug: 'critter-crew-socks',
        title: 'Critter Crew Socks',
        variantTitle: 'Pink Bunny',
        unitPriceCents: 699,
        image: null,
      },
      {
        sku: 'GT-EAR-001',
        qty: 1,
        addedAt: 2,
        productSlug: 'golden-hour-textured-hoops',
        title: 'Golden Hour Textured Hoops',
        variantTitle: 'Default',
        unitPriceCents: 1199,
        image: null,
      },
      {
        sku: 'GT-EAR-004',
        qty: 1,
        addedAt: 3,
        productSlug: 'oversized-open-heart-earrings',
        title: 'Oversized Open Heart Earrings',
        variantTitle: 'Default',
        unitPriceCents: 1499,
        image: null,
      },
      {
        sku: 'GT-EAR-005',
        qty: 1,
        addedAt: 4,
        productSlug: 'puffy-teardrop-studs',
        title: 'Puffy Teardrop Studs',
        variantTitle: 'Default',
        unitPriceCents: 1199,
        image: null,
      },
    ],
    promoCode: null,
    email: null,
  },
  version: 1,
}

/** Scroll through the page so reveal-on-scroll sections reach their final state before capture. */
async function revealAll(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.7))
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 90))
    }
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 300))
  })
  await page.waitForLoadState('networkidle').catch(() => {})
}

interface Shot {
  name: string
  path: string
  fullPage?: boolean
  setup?: (page: Page, width: number) => Promise<void>
}

const SHOTS: Shot[] = [
  { name: 'home', path: '/', fullPage: true },
  { name: 'jewellery', path: '/shop/jewellery', fullPage: true },
  { name: 'earrings', path: '/shop/jewellery/earrings', fullPage: true },
  { name: 'pdp-single', path: '/products/oversized-open-heart-earrings', fullPage: true },
  { name: 'pdp-multi', path: '/products/suede-touch-pyjama-set', fullPage: true },
  {
    name: 'bag-drawer',
    path: '/shop/socks',
    setup: async (page) => {
      await page.evaluate(
        (bag) => window.localStorage.setItem('gt-bag-v1', JSON.stringify(bag)),
        BAG,
      )
      await page.reload()
      await page.getByRole('banner').getByRole('button', { name: /^Bag/ }).click()
      await page.getByTestId('bag-savings').waitFor({ timeout: 10_000 })
      await page.waitForTimeout(500)
    },
  },
  {
    name: 'search',
    path: '/',
    setup: async (page, width) => {
      if (width < 640) {
        await page.getByRole('button', { name: 'Open menu' }).click()
        await page.locator('#mobile-search').fill('hoops')
        await page.waitForTimeout(400)
        return
      }
      await page.getByRole('banner').getByRole('button', { name: 'Search' }).click()
      await page.locator('#search-overlay-input').fill('hoops')
      await page.waitForTimeout(800)
    },
  },
  {
    name: 'menu',
    path: '/',
    setup: async (page, width) => {
      if (width >= 1280) {
        await page.getByRole('banner').getByRole('button', { name: 'Jewellery' }).hover()
        await page.waitForTimeout(700)
        return
      }
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.waitForTimeout(600)
    },
  },
  { name: '404', path: '/this-page-does-not-exist', fullPage: true },
  { name: 'about', path: '/about', fullPage: true },
]

async function main() {
  try {
    const res = await fetch(BASE)
    if (!res.ok) throw new Error(String(res.status))
  } catch {
    console.error(
      `[shots] ${BASE} is not reachable. Start the app first: npm run build && npx next start --port 3100`,
    )
    process.exit(1)
  }
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch()
  let count = 0
  for (const width of WIDTHS) {
    const height = width < 768 ? 844 : width < 1280 ? 1024 : 900
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      isMobile: width < 768,
      hasTouch: width < 768,
    })
    for (const shot of SHOTS) {
      if (ONLY && !ONLY.includes(shot.name)) continue
      const page = await context.newPage()
      await page.goto(BASE + shot.path, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      if (shot.setup) await shot.setup(page, width)
      if (shot.fullPage) await revealAll(page)
      const file = path.join(outDir, `${shot.name}-${width}.png`)
      await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) })
      // Reset the bag so later shots start empty.
      await page.evaluate(() => window.localStorage.removeItem('gt-bag-v1'))
      await page.close()
      count++
      console.log(`[shots] ${path.relative(process.cwd(), file)}`)
    }
    await context.close()
  }
  await browser.close()
  console.log(`[shots] ${count} screenshots in ${path.relative(process.cwd(), outDir)}`)
}

main().catch((err) => {
  console.error('[shots] failed', err)
  process.exit(1)
})
