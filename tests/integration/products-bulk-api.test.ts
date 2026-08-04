// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '../../app/api/products/bulk/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'
import { BULK_TEST_PRODUCT_NAME_PREFIX } from './test-constants'

// These tests hit the same DATABASE_URL as the dev server and admin panel
// (lib/db.ts, no separate test database) — every query here must be scoped
// to BULK_TEST_PRODUCT_NAME_PREFIX so it never touches real catalogue data.
describe('/api/products/bulk', () => {
  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql('DELETE FROM products WHERE nom LIKE $1', [`${BULK_TEST_PRODUCT_NAME_PREFIX}%`])
  })

  afterAll(async () => {
    await sql('DELETE FROM products WHERE nom LIKE $1', [`${BULK_TEST_PRODUCT_NAME_PREFIX}%`])
  })

  it('rejects import without admin session', async () => {
    const req = new Request('http://localhost/api/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products: [{ nom: `${BULK_TEST_PRODUCT_NAME_PREFIX} X`, categorie: 'homme', prix: 1000 }] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates all products in a valid batch, inactive and without photos', async () => {
    const token = await signSession()
    const req = new Request('http://localhost/api/products/bulk', {
      method: 'POST',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({
        products: [
          { nom: `${BULK_TEST_PRODUCT_NAME_PREFIX} A`, categorie: 'homme', prix: 25000, marque: 'Waaw Kicks' },
          { nom: `${BULK_TEST_PRODUCT_NAME_PREFIX} B`, categorie: 'femme', prix: 30000, description: 'Sneaker urbaine' },
        ],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.count).toBe(2)
    expect(body.created).toHaveLength(2)
    for (const created of body.created) {
      expect(created.actif).toBe(false)
      expect(created.photos).toEqual([])
    }

    const rows = await sql('SELECT * FROM products WHERE nom LIKE $1 ORDER BY nom', [`${BULK_TEST_PRODUCT_NAME_PREFIX} %`])
    expect(rows).toHaveLength(2)
  })

  it('rejects the whole batch when one entry is invalid, creating nothing', async () => {
    const token = await signSession()
    const req = new Request('http://localhost/api/products/bulk', {
      method: 'POST',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({
        products: [
          { nom: `${BULK_TEST_PRODUCT_NAME_PREFIX} C`, categorie: 'homme', prix: 25000 },
          { nom: `${BULK_TEST_PRODUCT_NAME_PREFIX} D`, categorie: 'invalide', prix: 30000 },
        ],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.details).toEqual([{ index: 1, errors: ['categorie invalide'] }])

    const rows = await sql('SELECT * FROM products WHERE nom LIKE $1', [`${BULK_TEST_PRODUCT_NAME_PREFIX} C%`])
    expect(rows).toHaveLength(0)
    const rowsD = await sql('SELECT * FROM products WHERE nom LIKE $1', [`${BULK_TEST_PRODUCT_NAME_PREFIX} D%`])
    expect(rowsD).toHaveLength(0)
  })

  it('rejects a request with a missing or empty products array', async () => {
    const token = await signSession()
    const req = new Request('http://localhost/api/products/bulk', {
      method: 'POST',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ products: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
