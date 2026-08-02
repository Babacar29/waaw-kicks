import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { statut } = await request.json()

  const [updated] = await sql('UPDATE orders SET statut = $1 WHERE id = $2 RETURNING *', [statut, id])
  if (!updated) {
    return Response.json({ error: 'Commande introuvable' }, { status: 404 })
  }
  return Response.json(updated)
}
