import { test, expect } from '@playwright/test'

const pages = ['/', '/catalogue', '/checkout']

for (const path of pages) {
  test(`visual snapshot of ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveScreenshot(`${path.replace(/\//g, '_') || 'home'}.png`, {
      fullPage: true,
    })
  })
}

test('visual snapshot of a product page', async ({ page }) => {
  await page.goto('/catalogue')
  await page.locator('a[href^="/produit/"]').first().click()
  await page.waitForURL('**/produit/**')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page).toHaveScreenshot('produit.png', { fullPage: true })
})
