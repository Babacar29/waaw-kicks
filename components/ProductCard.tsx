import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '../lib/types'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produit/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-waaw-surface text-white transition-all duration-300 hover:-translate-y-1 hover:border-waaw-yellow/60 hover:shadow-[0_16px_40px_-12px_rgba(255,212,0,0.25)]"
    >
      <div className="relative aspect-square overflow-hidden bg-waaw-surface-2">
        {product.photos[0] && (
          <Image
            src={product.photos[0]}
            alt={product.nom}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-display uppercase tracking-widest text-white/80 backdrop-blur-sm">
          {product.marque}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate font-display text-base uppercase tracking-wide">{product.nom}</p>
        <div className="mt-1 flex items-baseline justify-between">
          <p className="font-display text-lg text-waaw-yellow">
            {product.prix.toLocaleString('fr-FR')} FCFA
          </p>
          <span className="text-xs uppercase tracking-wide text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
            Voir →
          </span>
        </div>
      </div>
    </Link>
  )
}
