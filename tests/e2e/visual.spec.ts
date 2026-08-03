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
