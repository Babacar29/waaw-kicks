import { sql } from '../../../lib/db'
import { requireAdmin } from '../../../lib/admin-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorie = searchParams.get('categorie')

  const products = categorie
    ? await sql('SELECT * FROM products WHERE actif = true AND categorie = $1 ORDER BY created_at DESC', [categorie])
    : await sql('SELECT * FROM products WHERE actif = true ORDER BY created_at DESC')

  return Response.json(products)
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const { nom, description = '', categorie, marque = '', prix, photos = [] } = body

  if (!nom || !categorie || !prix) {
    return Response.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const [created] = await sql(
    `INSERT INTO products (nom, description, categorie, marque, prix, photos)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nom, description, categorie, marque, prix, photos]
  )

  return Response.json(created, { status: 201 })
}
