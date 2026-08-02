'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { SizeSelector } from '../../../components/SizeSelector'
import { useCartStore } from '../../../lib/cart-store'
import type { Product, Variant } from '../../../lib/types'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [selected, setSelected] = useState<Variant | null>(null)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
  }, [id])

  if (!product) return <p className="text-white p-4">Chargement...</p>

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <div className="aspect-square relative bg-neutral-900 rounded-lg overflow-hidden">
        {product.photos[0] && <Image src={product.photos[0]} alt={product.nom} fill className="object-cover" />}
      </div>
      <h1 className="font-display uppercase text-2xl mt-4">{product.nom}</h1>
      <p className="text-waaw-yellow font-bold text-xl">{product.prix.toLocaleString('fr-FR')} FCFA</p>
      <p className="text-white/70 mt-2">{product.description}</p>

      <div className="mt-4">
        <SizeSelector variants={product.variants ?? []} onSelect={setSelected} />
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
        }}
        className="mt-6 w-full bg-waaw-yellow disabled:bg-white/20 disabled:text-white/50 text-waaw-black font-display uppercase py-3 rounded"
      >
        Ajouter au panier
      </button>
    </main>
  )
}
