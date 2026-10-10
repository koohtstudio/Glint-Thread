import { expect, test } from '@playwright/test'

/** Mobile checks (PRD 4.9): no horizontal scroll, menu sheet, sticky add-to-bag bar. */
test('no horizontal scroll on key pages at 390px', async ({ page }) => {
  for (const path of ['/', '/shop/jewellery', '/products/suede-touch-pyjama-set', '/about']) {
    await page.goto(path)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})

test('mobile menu opens from the left and lists departments', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('link', { name: 'Jewellery' }).first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
})

test('sticky add-to-bag bar appears once the main button scrolls away', async ({ page }) => {
  await page.goto('/products/classic-beret')
  const bar = page.getByTestId('sticky-bar')
  await expect(bar).toHaveAttribute('data-visible', 'false')
  await page.evaluate(() => window.scrollTo(0, 2200))
  await expect(bar).toHaveAttribute('data-visible', 'true')
  await expect(bar.getByRole('button', { name: 'Add to bag' })).toBeInViewport()
})
