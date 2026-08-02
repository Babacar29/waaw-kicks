import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product] = await sql('SELECT * FROM products WHERE id = $1', [id])
  if (!product) {
    return Response.json({ error: 'Produit introuvable' }, { status: 404 })
  }
  const variants = await sql('SELECT * FROM variants WHERE product_id = $1', [id])
  return Response.json({ ...product, variants })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const { nom, description, categorie, marque, prix, photos, actif } = body

  if (!nom || !categorie || !prix) {
    return Response.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const [updated] = await sql(
    `UPDATE products SET nom = $1, description = $2, categorie = $3, marque = $4,
     prix = $5, photos = $6, actif = $7 WHERE id = $8 RETURNING *`,
    [nom, description, categorie, marque, prix, photos, actif, id]
  )

  if (!updated) {
    return Response.json({ error: 'Produit introuvable' }, { status: 404 })
  }
  return Response.json(updated)
}
