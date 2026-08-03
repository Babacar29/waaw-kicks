'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Product, Variant } from '../../../../../lib/types'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ pointure: '', couleur: '', quantite_stock: 0 })
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    const res = await fetch(`/api/products/${id}`)
    setProduct(await res.json())
  }

  useEffect(() => {
    reload()
  }, [id])

  async function addVariant(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`/api/products/${id}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error)
      return
    }
    setForm({ pointure: '', couleur: '', quantite_stock: 0 })
    reload()
  }

  async function updateStock(variantId: number, quantite_stock: number) {
    await fetch(`/api/variants/${variantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantite_stock }),
    })
    reload()
  }

  if (!product) return <p className="p-6">Chargement...</p>

  return (
    <main className="p-6 max-w-lg">
      <h1 className="font-bold text-xl mb-4">{product.nom} — Variantes</h1>

      <table className="w-full text-left border-collapse mb-6">
        <thead>
          <tr className="border-b"><th>Pointure</th><th>Couleur</th><th>Stock</th></tr>
        </thead>
        <tbody>
          {(product.variants ?? []).map((v: Variant) => (
            <tr key={v.id} className="border-b">
              <td className="py-2">{v.pointure}</td>
              <td>{v.couleur}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  defaultValue={v.quantite_stock}
                  onBlur={(e) => updateStock(v.id, Number(e.target.value))}
                  className="w-20 border rounded p-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="font-bold mb-2">Ajouter une variante</h2>
      <form onSubmit={addVariant} className="space-y-3">
        <input placeholder="Pointure" value={form.pointure} onChange={(e) => setForm({ ...form, pointure: e.target.value })} className="w-full border rounded p-2" />
        <input placeholder="Couleur" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className="w-full border rounded p-2" />
        <input type="number" min={0} placeholder="Stock" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: Number(e.target.value) })} className="w-full border rounded p-2" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Ajouter</button>
      </form>
    </main>
  )
}
