// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '../../app/api/products/[id]/variants/route'
import { PATCH } from '../../app/api/variants/[id]/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'

describe('variants API', () => {
  let productId: number

  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
    const [product] = await sql(
      `INSERT INTO products (nom, categorie, prix) VALUES ('Air Waaw', 'homme', 25000) RETURNING id`
    )
    productId = product.id as number
  })

  afterAll(async () => {
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
  })

  it('rejects variant creation without admin session', async () => {
    const req = new Request(`http://localhost/api/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify({ pointure: '42', couleur: 'Noir', quantite_stock: 5 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: String(productId) }) })
    expect(res.status).toBe(401)
  })

  it('creates a variant with a valid admin session', async () => {
    const token = await signSession()
    const req = new Request(`http://localhost/api/products/${productId}/variants`, {
      method: 'POST',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ pointure: '42', couleur: 'Noir', quantite_stock: 5 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: String(productId) }) })
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created.quantite_stock).toBe(5)
  })

  it('updates a variant stock with a valid admin session', async () => {
    const [variant] = await sql('SELECT id FROM variants LIMIT 1')
    const token = await signSession()
    const req = new Request(`http://localhost/api/variants/${variant.id}`, {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ quantite_stock: 10 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: String(variant.id) }) })
    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.quantite_stock).toBe(10)
  })

  it('returns 404 when updating an unknown variant', async () => {
    const token = await signSession()
    const req = new Request('http://localhost/api/variants/999999', {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ quantite_stock: 1 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '999999' }) })
    expect(res.status).toBe(404)
  })
})
