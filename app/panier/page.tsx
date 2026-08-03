'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useCartStore } from '../../lib/cart-store'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <main className="min-h-screen bg-waaw-black px-4 py-8 pb-32 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl uppercase tracking-tight">Panier</h1>

        {items.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-white/50">Ton panier est vide.</p>
            <Link
              href="/catalogue"
              className="mt-4 inline-block font-display text-sm uppercase tracking-wide text-waaw-yellow"
            >
              Voir le catalogue →
            </Link>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.variant_id}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-waaw-surface p-3"
            >
              {item.photo && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-waaw-surface-2">
                  <Image src={item.photo} alt={item.nom} fill className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm uppercase tracking-wide">{item.nom}</p>
                <p className="text-xs text-white/50">
                  {item.pointure} · {item.couleur}
                </p>
                <p className="mt-1 font-display text-waaw-yellow">
                  {item.prix.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <input
                type="number"
                min={1}
                value={item.quantite}
                onChange={(e) => updateQuantity(item.variant_id, Number(e.target.value))}
                className="w-14 rounded-lg border border-white/10 bg-white/5 py-2 text-center"
              />
              <button
                type="button"
                onClick={() => removeItem(item.variant_id)}
                className="text-waaw-red transition-colors hover:text-white"
                aria-label="Retirer l'article"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-waaw-black/95 px-4 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/40">Total</p>
              <p className="font-display text-xl text-white">{total.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <Link
              href="/checkout"
              className="rounded-full bg-waaw-yellow px-8 py-3.5 font-display uppercase tracking-wide text-waaw-black shadow-[0_10px_30px_-8px_rgba(255,212,0,0.5)] transition-transform hover:scale-105"
            >
              Commander
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
