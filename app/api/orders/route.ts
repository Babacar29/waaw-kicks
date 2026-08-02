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

  // Stock check-and-decrement must be a single atomic statement per item —
  // a separate SELECT-then-UPDATE lets two concurrent requests both pass
  // validation before either decrements, overselling the variant (the
  // schema has no CHECK constraint blocking negative stock). The WHERE
  // clause here makes Postgres perform the check and the decrement as one
  // row-locked operation, so only one concurrent request can win per unit
  // of stock.
  //
  // The `@neondatabase/serverless` HTTP driver's `sql.transaction()` only
  // supports non-interactive transactions: every query must be prepared
  // up front, and a conditional UPDATE that matches zero rows does not
  // throw, so there is no way to inspect one item's result and decide
  // whether to include the next item's query (or the final INSERT) in the
  // same transaction. A real multi-item BEGIN/COMMIT/ROLLBACK is therefore
  // not available over this driver's HTTP mode. Instead, items are
  // decremented sequentially with atomic per-item UPDATEs, and if a later
  // item fails, the already-decremented earlier items are restored with
  // compensating UPDATEs before returning 409 — keeping the visible
  // end-state correct (no oversell, no partial order) without a true
  // cross-item transaction.
  const decremented: OrderItem[] = []

  for (const item of items) {
    const [result] = (await sql(
      `UPDATE variants SET quantite_stock = quantite_stock - $1
       WHERE id = $2 AND quantite_stock >= $1
       RETURNING quantite_stock`,
      [item.quantite, item.variant_id]
    )) as { quantite_stock: number }[]

    if (!result) {
      for (const restore of decremented) {
        await sql('UPDATE variants SET quantite_stock = quantite_stock + $1 WHERE id = $2', [
          restore.quantite,
          restore.variant_id,
        ])
      }
      return Response.json(
        { error: 'Stock insuffisant', variant_id: item.variant_id },
        { status: 409 }
      )
    }

    decremented.push(item)
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
