// Shared identifiers for E2E test data so global-setup, global-teardown, and
// the specs that create their own data (admin-flow, purchase-flow) all agree
// on what counts as "ours" and can be safely deleted from the shared,
// live Neon database.

export const SEED_PRODUCT_NAME = 'E2E Seed Sneaker'
export const ADMIN_CREATED_PRODUCT_NAME = 'Test E2E Sneaker'
export const TEST_ORDER_CLIENT_NAME = 'Fatou Diop'
