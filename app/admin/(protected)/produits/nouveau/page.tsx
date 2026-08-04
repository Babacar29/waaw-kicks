'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPageHeader, AdminCard, AdminInput, AdminTextarea, AdminSelect, AdminButton, AdminAlert, Field } from '../../../../../components/admin/ui'

export default function NewProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', description: '', categorie: 'homme', marque: '', prix: 0 })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setPreview(selected ? URL.createObjectURL(selected) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let photos: string[] = []

      if (file) {
        const uploadForm = new FormData()
        uploadForm.append('file', file)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm })
        if (!uploadRes.ok) {
          const body = await uploadRes.json()
          setError(body.error)
          return
        }
        const { url } = await uploadRes.json()
        photos = [url]
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photos }),
      })

      if (!res.ok) {
        setError('Erreur lors de la création du produit')
        return
      }
      router.push('/admin/produits')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <AdminPageHeader title="Nouveau produit" backHref="/admin/produits" backLabel="Retour aux produits" />

      <AdminCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nom" required>
              <AdminInput
                placeholder="Nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
            </Field>
            <Field label="Marque">
              <AdminInput
                placeholder="Marque"
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description">
            <AdminTextarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Catégorie">
              <AdminSelect
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
              >
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="enfant">Enfant</option>
                <option value="unisex">Unisex</option>
              </AdminSelect>
            </Field>
            <Field label="Prix (FCFA)" required>
              <AdminInput
                type="number"
                placeholder="Prix (FCFA)"
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })}
                required
                min={0}
              />
            </Field>
          </div>

          <Field label="Photo">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-waaw-surface-2">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob: object URL, not eligible for next/image optimization
                  <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] uppercase tracking-wide text-white/25">Aperçu</span>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-white/50 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-wide file:text-white hover:file:bg-white/15"
              />
            </div>
          </Field>

          {error && <AdminAlert>{error}</AdminAlert>}

          <AdminButton type="submit" loading={loading}>
            Créer
          </AdminButton>
        </form>
      </AdminCard>
    </div>
  )
}
