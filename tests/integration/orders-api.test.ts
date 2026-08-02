// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST, GET } from '../../app/api/orders/route'
import { PATCH } from '../../app/api/orders/[id]/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'

describe('/api/orders', () => {
  let productId: number
  let variantId: number

  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql('DELETE FROM orders')
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
    const [product] = (await sql(
      `INSERT INTO products (nom, categorie, prix) VALUES ('Air Waaw', 'homme', 25000) RETURNING id`
    )) as { id: number }[]
    productId = product.id
    const [variant] = (await sql(
      `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
       VALUES ($1, '42', 'Noir', 2) RETURNING id`,
      [productId]
    )) as { id: number }[]
    variantId = variant.id
  })

  afterAll(async () => {
    await sql('DELETE FROM orders')
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
  })

  it('rejects an order exceeding available stock', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        nom_client: 'Fatou', telephone: '77xxx', adresse: 'Dakar',
        items: [{ product_id: productId, variant_id: variantId, nom: 'Air Waaw', pointure: '42', couleur: 'Noir', prix: 25000, quantite: 5 }],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('creates an order and decrements stock when stock is sufficient', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        nom_client: 'Fatou', telephone: '77xxx', adresse: 'Dakar',
        items: [{ product_id: productId, variant_id: variantId, nom: 'Air Waaw', pointure: '42', couleur: 'Noir', prix: 25000, quantite: 2 }],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const order = await res.json()
    expect(order.total).toBe(50000)

    const [variant] = await sql('SELECT quantite_stock FROM variants WHERE id = $1', [variantId])
    expect(variant.quantite_stock).toBe(0)
  })

  it('rejects listing orders without admin session', async () => {
    const res = await GET(new Request('http://localhost/api/orders'))
    expect(res.status).toBe(401)
  })

  it('updates order status with admin session', async () => {
    const [order] = await sql('SELECT id FROM orders LIMIT 1')
    const token = await signSession()
    const req = new Request(`http://localhost/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ statut: 'confirmee' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: String(order.id) }) })
    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.statut).toBe('confirmee')
  })
})
