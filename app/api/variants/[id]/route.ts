import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()

  const [existing] = await sql('SELECT * FROM variants WHERE id = $1', [id])
  if (!existing) {
    return Response.json({ error: 'Variante introuvable' }, { status: 404 })
  }

  const pointure = body.pointure ?? existing.pointure
  const couleur = body.couleur ?? existing.couleur
  const quantite_stock = body.quantite_stock ?? existing.quantite_stock

  if (!Number.isInteger(quantite_stock) || quantite_stock < 0) {
    return Response.json({ error: 'Quantité invalide' }, { status: 400 })
  }

  const [updated] = await sql(
    `UPDATE variants SET pointure = $1, couleur = $2, quantite_stock = $3 WHERE id = $4 RETURNING *`,
    [pointure, couleur, quantite_stock, id]
  )

  return Response.json(updated)
}
