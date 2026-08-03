import dotenv from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

// Playwright does not auto-load .env.local like Next.js does. Load it here
// (before workers are forked, so they inherit it) for globalSetup/Teardown
// and specs that need DATABASE_URL or ADMIN_PASSWORD directly.
dotenv.config({ path: '.env.local' })

export default defineConfig({
  testDir: './tests/e2e',
  // The suite shares one live Neon database across specs (no separate E2E
  // database): global-setup seeds one product, admin-flow.spec.ts creates
  // and deletes its own product mid-run, and purchase-flow.spec.ts decrements
  // real stock and places a real order. Running fully in parallel would race
  // those mutations (e.g. visual.spec.ts's /catalogue screenshot capturing
  // admin-flow's product only sometimes). Force one worker so specs run
  // strictly in sequence and the DB state each spec observes is deterministic.
  fullyParallel: false,
  workers: 1,
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-320', use: { viewport: { width: 320, height: 800 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
  ],
})
