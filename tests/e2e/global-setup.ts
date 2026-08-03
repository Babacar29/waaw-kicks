import { sql } from '../../lib/db'
import { SEED_PRODUCT_NAME, ADMIN_CREATED_PRODUCT_NAME } from './seed-constants'

// Seeds one active product with one in-stock variant directly via the DB
// layer (bypassing the app) so purchase-flow.spec.ts has something to click
// on `/catalogue?categorie=homme` before the app itself is exercised.
//
// Runs against the same DATABASE_URL as the dev server the Playwright
// webServer boots (.env.local) — there is no separate E2E database. We also
// proactively remove any leftover rows from a previous failed run before
// seeding, so re-runs never accumulate duplicates.
export default async function globalSetup(): Promise<void> {
  await sql(
    `DELETE FROM variants WHERE product_id IN (
       SELECT id FROM products WHERE nom IN ($1, $2)
     )`,
    [SEED_PRODUCT_NAME, ADMIN_CREATED_PRODUCT_NAME]
  )
  await sql('DELETE FROM products WHERE nom IN ($1, $2)', [SEED_PRODUCT_NAME, ADMIN_CREATED_PRODUCT_NAME])

  const [product] = await sql(
    `INSERT INTO products (nom, description, categorie, marque, prix, photos, actif)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [SEED_PRODUCT_NAME, 'Produit de seed pour les tests E2E', 'homme', 'Waaw Kicks', 25000, [], true]
  )

  await sql(
    `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
     VALUES ($1, $2, $3, $4)`,
    [(product as { id: number }).id, '42', 'Noir', 10]
  )
}
