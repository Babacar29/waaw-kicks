import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'
import type { StatutCommande } from '../../../../lib/types'

const VALID_STATUTS: StatutCommande[] = ['nouvelle', 'confirmee', 'livree', 'annulee']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { statut } = await request.json()

  if (!VALID_STATUTS.includes(statut)) {
    return Response.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const [updated] = await sql('UPDATE orders SET statut = $1 WHERE id = $2 RETURNING *', [statut, id])
  if (!updated) {
    return Response.json({ error: 'Commande introuvable' }, { status: 404 })
  }
  return Response.json(updated)
}
