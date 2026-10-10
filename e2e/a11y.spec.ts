import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/** PRD 14.2: axe with zero serious or critical issues on Home, Earrings and a PDP (plus key pages). */
const PAGES = [
  '/',
  '/shop/jewellery/earrings',
  '/products/oversized-open-heart-earrings',
  '/products/suede-touch-pyjama-set',
  '/faq',
  '/bag',
  '/search?q=hoops',
]

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    // Reveal everything below the fold so animated sections are in their final state.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 60))
      }
      window.scrollTo(0, 0)
    })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    const summary = serious.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(' '))
          .join(' | ')}`,
    )
    expect(summary, summary.join('\n')).toEqual([])
  })
}
