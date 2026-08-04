import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'

const VALID_CATEGORIES = ['homme', 'femme', 'bebe']

interface BulkProductInput {
  nom?: unknown
  description?: unknown
  categorie?: unknown
  marque?: unknown
  prix?: unknown
}

interface ValidationDetail {
  index: number
  errors: string[]
}

function validateProduct(input: BulkProductInput): string[] {
  const errors: string[] = []
  if (typeof input.nom !== 'string' || input.nom.trim() === '') {
    errors.push('nom requis')
  }
  if (typeof input.categorie !== 'string' || !VALID_CATEGORIES.includes(input.categorie)) {
    errors.push('categorie invalide')
  }
  if (typeof input.prix !== 'number' || !(input.prix > 0)) {
    errors.push('prix requis')
  }
  return errors
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const products = body.products

  if (!Array.isArray(products) || products.length === 0) {
    return Response.json({ error: 'Aucun produit à importer' }, { status: 400 })
  }

  const details: ValidationDetail[] = []
  products.forEach((p: BulkProductInput, index: number) => {
    const errors = validateProduct(p)
    if (errors.length > 0) {
      details.push({ index, errors })
    }
  })

  if (details.length > 0) {
    return Response.json({ error: 'Validation échouée', details }, { status: 400 })
  }

  const values: unknown[] = []
  const rows = products.map((p: BulkProductInput, i: number) => {
    const base = i * 5
    values.push(
      (p.nom as string).trim(),
      typeof p.description === 'string' ? p.description : '',
      p.categorie,
      typeof p.marque === 'string' ? p.marque : '',
      p.prix,
    )
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, ARRAY[]::text[], false)`
  })

  const created = await sql(
    `INSERT INTO products (nom, description, categorie, marque, prix, photos, actif)
     VALUES ${rows.join(', ')} RETURNING *`,
    values
  )

  return Response.json({ created, count: created.length }, { status: 201 })
}
