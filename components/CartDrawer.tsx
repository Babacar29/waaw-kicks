'use client'

import Link from 'next/link'
import { useCartStore } from '../lib/cart-store'

export function CartDrawer() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())

  return (
    <div className="fixed bottom-4 right-4 bg-waaw-black text-white rounded-lg shadow-xl p-4 w-72 border border-white/10">
      <p className="font-display uppercase text-sm mb-2">Panier ({items.length})</p>
      <p className="text-waaw-yellow font-bold mb-3">{total.toLocaleString('fr-FR')} FCFA</p>
      <Link
        href="/panier"
        className="block text-center bg-waaw-yellow text-waaw-black font-display uppercase py-2 rounded"
      >
        Voir le panier
      </Link>
    </div>
  )
}
