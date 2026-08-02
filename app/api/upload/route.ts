import { put } from '@vercel/blob'
import { requireAdmin } from '../../../lib/admin-auth'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'Aucun fichier reçu' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Format non supporté (jpg, png, webp uniquement)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Fichier trop volumineux (5 Mo max)' }, { status: 400 })
  }

  const blob = await put(`products/${Date.now()}-${file.name}`, file, { access: 'public' })
  return Response.json({ url: blob.url })
}
