import { test, expect } from '@playwright/test'
import { sql } from '../../lib/db'
import { ADMIN_CREATED_PRODUCT_NAME } from './seed-constants'

test('admin se connecte, crée un produit, le produit apparaît au catalogue', async ({ page }) => {
  await page.goto('/admin/produits')
  await expect(page).toHaveURL(/login/)

  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD ?? 'test-admin-password')
  await page.click('button:has-text("Se connecter")')
  await expect(page).toHaveURL(/produits/)

  await page.click('text=Nouveau produit')
  await page.fill('input[placeholder="Nom"]', ADMIN_CREATED_PRODUCT_NAME)
  await page.fill('input[placeholder="Prix (FCFA)"]', '30000')
  await page.click('button:has-text("Créer")')

  await expect(page).toHaveURL(/admin\/produits$/)
  await expect(page.locator(`text=${ADMIN_CREATED_PRODUCT_NAME}`)).toBeVisible()

  await page.goto('/catalogue?categorie=homme')
  await expect(page.locator(`text=${ADMIN_CREATED_PRODUCT_NAME}`)).toBeVisible()

  // This test creates real data in the shared, live database via the UI.
  // Clean it up immediately so it doesn't leak into other specs (e.g.
  // purchase-flow clicking the first product in the catalogue) or
  // accumulate across suite re-runs. global-teardown.ts is a safety net
  // in case this cleanup itself doesn't run (e.g. the test fails above).
  await sql('DELETE FROM products WHERE nom = $1', [ADMIN_CREATED_PRODUCT_NAME])
})
