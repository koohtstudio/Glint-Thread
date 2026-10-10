import { expect, test, type Page } from '@playwright/test'

/**
 * PRD M10 journey: home -> category -> filter -> PDP -> choose variant -> add to bag ->
 * bag shows the sock bundle discount and earring buy 2 get 1 -> checkout button state.
 */
test.describe('shopping journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
  })

  async function closeBag(page: Page) {
    const dialog = page.getByRole('dialog')
    if (await dialog.isVisible()) {
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
    }
  }

  test('home to bag with bundle and earring savings', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('All the glint.')

    // Home -> department via the mosaic
    await page
      .getByRole('link', { name: /^Socks/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/shop\/socks$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Socks')

    // Filter: Category = Crew Socks (URL param, no reload)
    await page.getByRole('button', { name: /^Category/ }).click()
    await page.getByText('Crew Socks', { exact: true }).click()
    await expect(page).toHaveURL(/category=crew-socks/)
    const cards = page.locator('main article')
    await expect(cards.first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Strawberry Ankle Socks' })).toHaveCount(0)

    // Category -> PDP
    await page.getByRole('link', { name: 'Critter Crew Socks' }).click()
    await expect(page).toHaveURL(/\/products\/critter-crew-socks/)

    // Choose a variant, set quantity 3, add to bag
    await page.getByRole('radio', { name: 'Pink Bunny' }).click()
    await expect(page.getByRole('radio', { name: 'Pink Bunny' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    const increase = page.getByRole('button', { name: 'Increase quantity' }).first()
    await increase.click()
    await increase.click()
    await page.getByTestId('add-to-bag').click()
    const bag = page.getByRole('dialog')
    await expect(bag).toBeVisible()
    await expect(bag.getByTestId('bag-line')).toHaveCount(1)
    await expect(bag.getByTestId('line-savings')).toContainText('−$4.19')
    await closeBag(page)

    // Three earrings: cheapest ($11.99) free
    for (const slug of [
      'golden-hour-textured-hoops',
      'oversized-open-heart-earrings',
      'puffy-teardrop-studs',
    ]) {
      await page.goto(`/products/${slug}`)
      await page.getByTestId('add-to-bag').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await closeBag(page)
    }

    await page.getByRole('banner').getByRole('button', { name: /^Bag, \d+ items/ }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByTestId('bag-line')).toHaveCount(4)
    // Socks 3 x $6.99 = $20.97, 20% = $4.19. Earrings $11.99 + $14.99 + $11.99, one $11.99 free.
    await expect(drawer.getByTestId('bag-savings')).toHaveText('−$16.18')
    await expect(drawer.getByTestId('bag-total')).toHaveText('$43.76')
    await expect(drawer.getByText(/You're \$16\.24 away from free shipping/)).toBeVisible()
    await expect(drawer.getByTestId('line-savings').filter({ hasText: 'Earrings' })).toContainText(
      '−$11.99',
    )

    // Checkout is enabled when Stripe is configured; without keys, explain that it is not ready.
    const checkout = drawer.getByTestId('checkout-button')
    const checkoutHref = await checkout.getAttribute('href')
    if (checkoutHref) {
      await expect(checkout).toHaveAttribute('href', '/checkout')
      await expect(checkout).toHaveText('Checkout')
    } else {
      await expect(checkout).toBeDisabled()
      await expect(checkout).toHaveText('Checkout opens soon')
    }

    // Invalid input is rejected before any pending order or PaymentIntent can be created.
    const res = await page.request.post('/api/checkout/session', {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('filters are shareable and back-button safe', async ({ page }) => {
    await page.goto('/shop/jewellery?finish=stainless-steel')
    await expect(page.locator('main article')).toHaveCount(1)
    await page.goto('/shop/jewellery')
    await page.getByRole('button', { name: /^Finish/ }).click()
    await page.getByText('Silver-tone', { exact: true }).click()
    await expect(page).toHaveURL(/finish=silver-tone/)
    await page.goBack()
    await expect(page).not.toHaveURL(/finish=/)
  })

  test('search overlay finds products', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search' }).click()
    await page.getByRole('searchbox', { name: 'Search the shop' }).fill('beret')
    await expect(page.getByRole('link', { name: /Classic Beret/ }).first()).toBeVisible()
  })

  test('branded 404', async ({ page }) => {
    const res = await page.goto('/this-does-not-exist')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'This page wandered off, like the other earring.',
    )
  })
})
