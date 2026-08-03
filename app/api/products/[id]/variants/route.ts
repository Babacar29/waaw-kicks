import { sql } from '../../../../../lib/db'
import { requireAdmin } from '../../../../../lib/admin-auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { pointure, couleur, quantite_stock } = await request.json()

  if (!pointure || !couleur || !Number.isInteger(quantite_stock) || quantite_stock < 0) {
    return Response.json({ error: 'Champs requis manquants ou invalides' }, { status: 400 })
  }

  const [variant] = await sql(
    `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, pointure, couleur, quantite_stock]
  )

  return Response.json(variant, { status: 201 })
}
