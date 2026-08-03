'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', description: '', categorie: 'homme', marque: '', prix: 0 })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
  }

  return (
    <main className="p-6 max-w-lg">
      <h1 className="font-bold text-xl mb-4">Nouveau produit</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full border rounded p-2" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded p-2" />
        <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="w-full border rounded p-2">
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
          <option value="bebe">Bébé</option>
        </select>
        <input placeholder="Marque" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} className="w-full border rounded p-2" />
        <input type="number" placeholder="Prix (FCFA)" value={form.prix} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })} className="w-full border rounded p-2" />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Créer</button>
      </form>
    </main>
  )
}
