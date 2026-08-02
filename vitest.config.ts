import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    // Integration tests share live Neon tables (products/variants/orders)
    // and truncate them in beforeAll/afterAll. Running test files in
    // parallel (Vitest's default) races those truncations across files,
    // causing intermittent failures. Force sequential file execution so
    // shared-table integration tests never overlap.
    fileParallelism: false,
  },
})
