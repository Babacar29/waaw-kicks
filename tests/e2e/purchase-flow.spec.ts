import { test, expect } from '@playwright/test'

test('client parcourt le catalogue, ajoute au panier, et arrive au checkout', async ({ page }) => {
  await page.goto('/catalogue?categorie=homme')
  // The catalogue page renders category nav links (also <a> tags) before the
  // product grid, so `a >> first` would click "Homme" instead of a product.
  // Target product card links specifically (they link to /produit/:id).
  const firstProduct = page.locator('a[href^="/produit/"]').first()
  await expect(firstProduct).toBeVisible()

  await firstProduct.click()
  await expect(page.locator('h1')).toBeVisible()

  await page.locator('button:has-text("·")').first().click()
  await page.locator('button:has-text("Ajouter au panier")').click()

  await page.goto('/panier')
  await expect(page.locator('text=Total')).toBeVisible()

  await page.locator('a:has-text("Passer commande")').click()
  await expect(page).toHaveURL(/checkout/)

  await page.fill('input[placeholder="Nom complet"]', 'Fatou Diop')
  await page.fill('input[placeholder="Téléphone"]', '771234567')
  await page.fill('input[placeholder="Adresse"]', 'Liberté 6, Dakar')
  await page.locator('button:has-text("Commander sur WhatsApp")').click()

  // wa.me redirects to api.whatsapp.com in a real browser (confirmed by
  // running this against the live network), so accept either host.
  await expect(page).toHaveURL(/(wa\.me|api\.whatsapp\.com)/, { timeout: 10000 })
})
