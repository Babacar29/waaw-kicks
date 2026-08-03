'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import type { Product, Variant } from '../../../../../lib/types'
import {
  AdminPageHeader,
  AdminCard,
  AdminInput,
  AdminButton,
  AdminAlert,
  AdminBadge,
  AdminEmptyState,
  Field,
} from '../../../../../components/admin/ui'

const LOW_STOCK_THRESHOLD = 3

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ pointure: '', couleur: '', quantite_stock: 0 })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

  async function reload() {
    const res = await fetch(`/api/products/${id}`)
    setProduct(await res.json())
  }

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProduct(data)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function addVariant(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
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
      await reload()
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStock(variantId: number, quantite_stock: number) {
    await fetch(`/api/variants/${variantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantite_stock }),
    })
    reload()
  }

  async function toggleStatus() {
    if (!product) return
    setTogglingStatus(true)
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: product.nom,
          description: product.description,
          categorie: product.categorie,
          marque: product.marque,
          prix: product.prix,
          photos: product.photos,
          actif: !product.actif,
        }),
      })
      if (res.ok) setProduct(await res.json())
    } finally {
      setTogglingStatus(false)
    }
  }

  if (!product) {
    return <p className="text-sm text-white/40">Chargement…</p>
  }

  const variants = product.variants ?? []

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title={product.nom}
        description="Gestion des variantes et du stock"
        backHref="/admin/produits"
        backLabel="Retour aux produits"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-waaw-surface-2">
              {product.photos[0] && <Image src={product.photos[0]} alt={product.nom} fill className="object-cover" />}
            </div>
            <p className="font-display text-lg text-waaw-yellow">{product.prix.toLocaleString('fr-FR')} FCFA</p>
            <AdminBadge tone={product.actif ? 'actif' : 'inactif'}>
              {product.actif ? 'Actif' : 'Inactif'}
            </AdminBadge>
            <AdminButton
              variant="secondary"
              loading={togglingStatus}
              onClick={toggleStatus}
              className="py-1.5"
            >
              {product.actif ? 'Désactiver' : 'Activer'}
            </AdminButton>
          </div>
        }
      />

      <AdminCard className="mb-6 overflow-hidden">
        {variants.length === 0 ? (
          <div className="p-6">
            <AdminEmptyState title="Aucune variante" description="Ajoutez une pointure et une couleur ci-dessous." />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-medium">Pointure</th>
                <th className="px-4 py-3 font-medium">Couleur</th>
                <th className="px-4 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v: Variant) => (
                <tr key={v.id} className="border-b border-white/5 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-white">{v.pointure}</td>
                  <td className="px-4 py-3 text-white/70">{v.couleur}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AdminInput
                        type="number"
                        min={0}
                        defaultValue={v.quantite_stock}
                        onBlur={(e) => updateStock(v.id, Number(e.target.value))}
                        className="w-20 py-1.5"
                      />
                      {v.quantite_stock <= LOW_STOCK_THRESHOLD && (
                        <AdminBadge tone="stock">{v.quantite_stock === 0 ? 'Épuisé' : 'Stock bas'}</AdminBadge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </AdminCard>

      <AdminCard className="p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-wide text-white/70">Ajouter une variante</h2>
        <form onSubmit={addVariant} className="grid gap-4 sm:grid-cols-3">
          <Field label="Pointure">
            <AdminInput
              placeholder="Pointure"
              value={form.pointure}
              onChange={(e) => setForm({ ...form, pointure: e.target.value })}
              required
            />
          </Field>
          <Field label="Couleur">
            <AdminInput
              placeholder="Couleur"
              value={form.couleur}
              onChange={(e) => setForm({ ...form, couleur: e.target.value })}
              required
            />
          </Field>
          <Field label="Stock">
            <AdminInput
              type="number"
              min={0}
              placeholder="Stock"
              value={form.quantite_stock}
              onChange={(e) => setForm({ ...form, quantite_stock: Number(e.target.value) })}
              required
            />
          </Field>
          {error && (
            <div className="sm:col-span-3">
              <AdminAlert>{error}</AdminAlert>
            </div>
          )}
          <div className="sm:col-span-3">
            <AdminButton type="submit" loading={submitting}>
              <Plus size={16} />
              Ajouter
            </AdminButton>
          </div>
        </form>
      </AdminCard>
    </div>
  )
}
