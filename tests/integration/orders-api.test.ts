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

  it('prevents overselling when two concurrent orders race for the same limited stock', async () => {
    // Dedicated variant with just enough stock for one of the two orders,
    // not both (3 in stock, two concurrent requests for 2 each = 4 demand).
    const [variant] = (await sql(
      `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
       VALUES ($1, '43', 'Blanc', 3) RETURNING id`,
      [productId]
    )) as { id: number }[]
    const raceVariantId = variant.id

    const makeRequest = () =>
      POST(
        new Request('http://localhost/api/orders', {
          method: 'POST',
          body: JSON.stringify({
            nom_client: 'Concurrent',
            telephone: '77xxx',
            adresse: 'Dakar',
            items: [
              {
                product_id: productId,
                variant_id: raceVariantId,
                nom: 'Air Waaw',
                pointure: '43',
                couleur: 'Blanc',
                prix: 25000,
                quantite: 2,
              },
            ],
          }),
        })
      )

    const [resA, resB] = await Promise.all([makeRequest(), makeRequest()])
    const statuses = [resA.status, resB.status].sort()

    // Exactly one of the two concurrent requests must succeed; the other
    // must be rejected for insufficient stock. Both succeeding would mean
    // the variant oversold (stock would go negative); both failing would
    // mean the atomic UPDATE incorrectly rejected a request that should
    // have won the race.
    expect(statuses).toEqual([201, 409])

    const [finalVariant] = (await sql('SELECT quantite_stock FROM variants WHERE id = $1', [
      raceVariantId,
    ])) as { quantite_stock: number }[]
    // Only the winning request's decrement should have applied: 3 - 2 = 1.
    // Never negative (oversold) and never unchanged (both rejected).
    expect(finalVariant.quantite_stock).toBe(1)
  })

  it('restores already-decremented stock when a later item in the same order fails', async () => {
    const [okVariant] = (await sql(
      `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
       VALUES ($1, '44', 'Rouge', 5) RETURNING id`,
      [productId]
    )) as { id: number }[]
    const [shortVariant] = (await sql(
      `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
       VALUES ($1, '45', 'Vert', 1) RETURNING id`,
      [productId]
    )) as { id: number }[]

    const [{ count: countBefore }] = (await sql('SELECT COUNT(*) AS count FROM orders')) as {
      count: string
    }[]

    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        nom_client: 'Fatou',
        telephone: '77xxx',
        adresse: 'Dakar',
        items: [
          {
            product_id: productId,
            variant_id: okVariant.id,
            nom: 'Air Waaw',
            pointure: '44',
            couleur: 'Rouge',
            prix: 25000,
            quantite: 3,
          },
          {
            product_id: productId,
            variant_id: shortVariant.id,
            nom: 'Air Waaw',
            pointure: '45',
            couleur: 'Vert',
            prix: 25000,
            quantite: 5, // exceeds the 1 in stock — this item must fail
          },
        ],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(409)

    const [restoredVariant] = (await sql('SELECT quantite_stock FROM variants WHERE id = $1', [
      okVariant.id,
    ])) as { quantite_stock: number }[]
    // The first item's decrement (5 - 3 = 2) must have been rolled back to
    // its original value of 5, since the order as a whole was rejected.
    expect(restoredVariant.quantite_stock).toBe(5)

    const [untouchedShortVariant] = (await sql(
      'SELECT quantite_stock FROM variants WHERE id = $1',
      [shortVariant.id]
    )) as { quantite_stock: number }[]
    expect(untouchedShortVariant.quantite_stock).toBe(1)

    const [{ count: countAfter }] = (await sql('SELECT COUNT(*) AS count FROM orders')) as {
      count: string
    }[]
    // No order row should have been inserted for this rejected attempt.
    expect(Number(countAfter)).toBe(Number(countBefore))
  })
})
