'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { ProductTilt } from '../../../components/ProductTilt'
import { SizeSelector } from '../../../components/SizeSelector'
import { useCartStore } from '../../../lib/cart-store'
import type { Product, Variant } from '../../../lib/types'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [selected, setSelected] = useState<Variant | null>(null)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
  }, [id])

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-waaw-black text-white/50">
        Chargement...
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-waaw-black pb-28 text-white sm:pb-6">
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={15} />
          Retour
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-6">
        <div className="sm:grid sm:grid-cols-2 sm:items-center sm:gap-10">
          <div>
            {product.photos[activePhoto] ? (
              <ProductTilt src={product.photos[activePhoto]} alt={product.nom} />
            ) : (
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-waaw-surface-2" />
            )}
            {product.photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.photos.map((photo, i) => (
                  <button
                    key={photo}
                    type="button"
                    onClick={() => setActivePhoto(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-colors ${
                      activePhoto === i ? 'border-waaw-yellow' : 'border-white/10'
                    }`}
                  >
                    <Image src={photo} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-0">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-white/40">
              {product.marque}
            </span>
            <h1 className="mt-1 font-display text-2xl uppercase tracking-tight sm:text-3xl">
              {product.nom}
            </h1>
            <p className="mt-2 font-display text-2xl text-waaw-yellow">
              {product.prix.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="mt-4 leading-relaxed text-white/60">{product.description}</p>

            <div className="mt-6">
              <p className="mb-2 font-display text-xs uppercase tracking-widest text-white/40">
                Pointure · Couleur
              </p>
              <SizeSelector
                variants={product.variants ?? []}
                onSelect={(v) => {
                  setSelected(v)
                  setAdded(false)
                }}
              />
            </div>

            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                addItem({
                  product_id: product.id,
                  variant_id: selected.id,
                  nom: product.nom,
                  pointure: selected.pointure,
                  couleur: selected.couleur,
                  prix: product.prix,
                  photo: product.photos[0] ?? '',
                  quantite: 1,
                })
                setAdded(true)
              }}
              className="fixed inset-x-4 bottom-4 z-30 rounded-full bg-waaw-yellow py-4 font-display uppercase tracking-wide text-waaw-black shadow-[0_10px_30px_-8px_rgba(255,212,0,0.5)] transition-all disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none sm:static sm:mt-8 sm:w-full sm:rounded-2xl sm:py-4"
            >
              {added ? 'Ajouté ✓' : 'Ajouter au panier'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
