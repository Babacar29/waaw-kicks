import dotenv from 'dotenv'
import { beforeEach, vi } from 'vitest'

// Vitest does not auto-load .env.local like Next.js does, so load it
// explicitly here for integration tests that need DATABASE_URL etc.
dotenv.config({ path: '.env.local' })

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

beforeEach(() => {
  window.localStorage.clear()
})
