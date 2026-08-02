// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST } from '../../app/api/products/route'
import { GET as GET_ONE } from '../../app/api/products/[id]/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'

describe('/api/products', () => {
  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
  })

  afterAll(async () => {
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
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
        nom: 'Air Waaw', description: 'Sneaker urbaine', categorie: 'homme',
        marque: 'Waaw Kicks', prix: 25000, photos: [],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created.nom).toBe('Air Waaw')
  })

  it('lists products filtered by categorie', async () => {
    const req = new Request('http://localhost/api/products?categorie=homme')
    const res = await GET(req)
    const products = await res.json()
    expect(products.length).toBeGreaterThan(0)
    expect(products[0].categorie).toBe('homme')
  })

  it('returns 404 for an unknown product id', async () => {
    const req = new Request('http://localhost/api/products/999999')
    const res = await GET_ONE(req, { params: Promise.resolve({ id: '999999' }) })
    expect(res.status).toBe(404)
  })
})
