// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST } from '../../app/api/products/route'
import { GET as GET_ONE, PUT } from '../../app/api/products/[id]/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'
import { PRODUCTS_TEST_PRODUCT_NAME } from './test-constants'

// These tests hit the same DATABASE_URL as the dev server and admin panel
// (lib/db.ts, no separate test database) — every query here must be scoped
// to PRODUCTS_TEST_PRODUCT_NAME so it never touches real catalogue data.
describe('/api/products', () => {
  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql(
      `DELETE FROM variants WHERE product_id IN (SELECT id FROM products WHERE nom = $1)`,
      [PRODUCTS_TEST_PRODUCT_NAME]
    )
    await sql('DELETE FROM products WHERE nom = $1', [PRODUCTS_TEST_PRODUCT_NAME])
  })

  afterAll(async () => {
    await sql(
      `DELETE FROM variants WHERE product_id IN (SELECT id FROM products WHERE nom = $1)`,
      [PRODUCTS_TEST_PRODUCT_NAME]
    )
    await sql('DELETE FROM products WHERE nom = $1', [PRODUCTS_TEST_PRODUCT_NAME])
  })

  it('rejects creation without admin session', async () => {
    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({ nom: 'X', categorie: 'homme', prix: 1000 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates a product with a valid admin session', async () => {
    const token = await signSession()
    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({
        nom: PRODUCTS_TEST_PRODUCT_NAME, description: 'Sneaker urbaine', categorie: 'homme',
        marque: 'Waaw Kicks', prix: 25000, photos: [],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created.nom).toBe(PRODUCTS_TEST_PRODUCT_NAME)
  })

  it('lists products filtered by categorie', async () => {
    const req = new Request('http://localhost/api/products?categorie=homme')
    const res = await GET(req)
    const products = await res.json()
    const created = products.find((p: { nom: string }) => p.nom === PRODUCTS_TEST_PRODUCT_NAME)
    expect(created).toBeDefined()
    expect(created.categorie).toBe('homme')
  })

  it('returns 404 for an unknown product id', async () => {
    const req = new Request('http://localhost/api/products/999999')
    const res = await GET_ONE(req, { params: Promise.resolve({ id: '999999' }) })
    expect(res.status).toBe(404)
  })

  it('rejects PUT with a missing required field', async () => {
    const token = await signSession()
    const listReq = new Request('http://localhost/api/products?categorie=homme')
    const products = await (await GET(listReq)).json()
    const existing = products.find((p: { nom: string }) => p.nom === PRODUCTS_TEST_PRODUCT_NAME)

    const req = new Request(`http://localhost/api/products/${existing.id}`, {
      method: 'PUT',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({
        description: 'Sans nom', categorie: 'homme', marque: 'Waaw Kicks', prix: 30000, photos: [],
      }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: String(existing.id) }) })
    expect(res.status).toBe(400)
  })
})
