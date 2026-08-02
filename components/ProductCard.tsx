import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '../lib/types'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produit/${product.id}`}
      className="group block bg-waaw-black text-white rounded-lg overflow-hidden border border-white/10 hover:border-waaw-yellow transition-colors"
    >
      <div className="aspect-square relative bg-neutral-900">
        {product.photos[0] && (
          <Image
            src={product.photos[0]}
            alt={product.nom}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        )}
      </div>
      <div className="p-3">
        <p className="font-display uppercase text-sm tracking-wide">{product.nom}</p>
        <p className="text-waaw-yellow font-bold">{product.prix.toLocaleString('fr-FR')} FCFA</p>
      </div>
    </Link>
  )
}
