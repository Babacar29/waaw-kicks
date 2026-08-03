'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '../lib/cart-store'

export function Header() {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantite, 0))

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-waaw-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display uppercase text-2xl tracking-wide text-white">
          Waaw<span className="text-waaw-yellow">Kicks</span>
        </Link>
        <Link
          href="/panier"
          className="relative flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-white transition-colors hover:border-waaw-yellow"
        >
          <ShoppingBag size={18} />
          <span className="font-display text-sm uppercase hidden sm:inline">Panier</span>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-waaw-yellow px-1 text-xs font-bold text-waaw-black">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
