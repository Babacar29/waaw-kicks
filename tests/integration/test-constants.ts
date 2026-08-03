// Shared identifiers for Vitest integration tests, so each suite can scope
// its DELETE/SELECT queries to rows it created instead of wiping or reading
// the entire products/variants/orders tables — those tables are the same
// ones the dev server and admin panel write to (see lib/db.ts, there is no
// separate test database), so unscoped queries here would corrupt or read
// real data.
export const PRODUCTS_TEST_PRODUCT_NAME = 'Vitest Products API Test Sneaker'
export const VARIANTS_TEST_PRODUCT_NAME = 'Vitest Variants API Test Sneaker'
export const ORDERS_TEST_PRODUCT_NAME = 'Vitest Orders API Test Sneaker'
export const ORDERS_TEST_CLIENT_NAME = 'Vitest Orders API Test Client'
