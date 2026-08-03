import { sql } from '../../lib/db'
import { SEED_PRODUCT_NAME, ADMIN_CREATED_PRODUCT_NAME, TEST_ORDER_CLIENT_NAME } from './seed-constants'

// Removes everything the E2E suite could have left behind in the shared,
// live Neon database:
// - the product+variant seeded by global-setup.ts
// - "Test E2E Sneaker", in case admin-flow.spec.ts's own cleanup didn't run
//   (e.g. the test failed before reaching it)
// - the order placed by purchase-flow.spec.ts (matched by the test client
//   name, since orders have no other stable marker)
export default async function globalTeardown(): Promise<void> {
  await sql(
    `DELETE FROM variants WHERE product_id IN (
       SELECT id FROM products WHERE nom IN ($1, $2)
     )`,
    [SEED_PRODUCT_NAME, ADMIN_CREATED_PRODUCT_NAME]
  )
  await sql('DELETE FROM products WHERE nom IN ($1, $2)', [SEED_PRODUCT_NAME, ADMIN_CREATED_PRODUCT_NAME])
  await sql('DELETE FROM orders WHERE nom_client = $1', [TEST_ORDER_CLIENT_NAME])
}
