// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { signSession, verifySession } from '../../lib/admin-auth'

describe('admin session', () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
  })

  it('signs and verifies a valid session token', async () => {
    const token = await signSession()
    expect(await verifySession(token)).toBe(true)
  })

  it('rejects a tampered token', async () => {
    const token = await signSession()
    expect(await verifySession(token + 'x')).toBe(false)
  })

  it('rejects garbage input', async () => {
    expect(await verifySession('not-a-token')).toBe(false)
  })
})
