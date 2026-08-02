import { sql } from '../../../lib/db'
import { requireAdmin } from '../../../lib/admin-auth'
import type { OrderItem } from '../../../lib/types'

export async function POST(request: Request) {
  const body = await request.json()
  const { nom_client, telephone, adresse, items } = body as {
    nom_client: string
    telephone: string
    adresse: string
    items: OrderItem[]
  }

  if (!nom_client || !telephone || !adresse || !items?.length) {
    return Response.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  for (const item of items) {
    const [variant] = (await sql('SELECT quantite_stock FROM variants WHERE id = $1', [
      item.variant_id,
    ])) as { quantite_stock: number }[]
    if (!variant || variant.quantite_stock < item.quantite) {
      return Response.json(
        { error: 'Stock insuffisant', variant_id: item.variant_id },
        { status: 409 }
      )
    }
  }

  for (const item of items) {
    await sql('UPDATE variants SET quantite_stock = quantite_stock - $1 WHERE id = $2', [
      item.quantite,
      item.variant_id,
    ])
  }

  const total = items.reduce((sum, i) => sum + i.prix * i.quantite, 0)

  const [order] = await sql(
    `INSERT INTO orders (nom_client, telephone, adresse, items, total)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nom_client, telephone, adresse, JSON.stringify(items), total]
  )

  return Response.json(order, { status: 201 })
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const orders = await sql('SELECT * FROM orders ORDER BY created_at DESC')
  return Response.json(orders)
}
