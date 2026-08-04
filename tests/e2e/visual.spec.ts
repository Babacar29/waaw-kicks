import { test, expect } from '@playwright/test'

const pages = ['/', '/catalogue', '/checkout']

for (const path of pages) {
  test(`visual snapshot of ${path}`, async ({ page }) => {
    await page.goto(path)
    // Force reduced-motion so Reveal-wrapped sections (which only ever become
    // visible via prefers-reduced-motion or an IntersectionObserver
    // intersection that never fires during a full-page screenshot) render
    // fully visible instead of stuck at opacity-0.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(page).toHaveScreenshot(`${path.replace(/\//g, '_') || 'home'}.png`, {
      fullPage: true,
    })
  })
}

test('visual snapshot of a product page', async ({ page }) => {
  await page.goto('/catalogue')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('a[href^="/produit/"]').first().click()
  await page.waitForURL('**/produit/**')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page).toHaveScreenshot('produit.png', { fullPage: true })
})
