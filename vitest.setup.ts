import dotenv from 'dotenv'

// Vitest does not auto-load .env.local like Next.js does, so load it
// explicitly here for integration tests that need DATABASE_URL etc.
dotenv.config({ path: '.env.local' })
