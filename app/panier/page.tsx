'use client'

import Link from 'next/link'
import { useCartStore } from '../../lib/cart-store'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <h1 className="font-display uppercase text-2xl mb-4">Panier</h1>
      {items.length === 0 && <p className="text-white/50">Ton panier est vide.</p>}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.variant_id} className="flex items-center gap-3 border border-white/10 rounded-lg p-3">
            <div className="flex-1">
              <p className="font-display uppercase text-sm">{item.nom}</p>
              <p className="text-white/60 text-xs">{item.pointure} · {item.couleur}</p>
              <p className="text-waaw-yellow font-bold">{item.prix.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantite}
              onChange={(e) => updateQuantity(item.variant_id, Number(e.target.value))}
              className="w-14 bg-white/10 text-center rounded"
            />
            <button type="button" onClick={() => removeItem(item.variant_id)} className="text-waaw-red">
              Retirer
            </button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="mt-6">
          <p className="font-bold text-lg">Total: {total.toLocaleString('fr-FR')} FCFA</p>
          <Link
            href="/checkout"
            className="block text-center mt-3 bg-waaw-yellow text-waaw-black font-display uppercase py-3 rounded"
          >
            Passer commande
          </Link>
        </div>
      )}
    </main>
  )
}
