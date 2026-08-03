import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CategoryNav } from '../components/CategoryNav'
import { ProductCard } from '../components/ProductCard'
import { sql } from '../lib/db'
import type { Product } from '../lib/types'

async function getProducts(): Promise<Product[]> {
  const products = await sql('SELECT * FROM products WHERE actif = true ORDER BY created_at DESC')
  return products as unknown as Product[]
}

export default async function HomePage() {
  const products = await getProducts()

  return (
    <main className="min-h-screen bg-waaw-black text-white">
      <section className="relative overflow-hidden px-4 pb-14 pt-20 sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,212,0,0.16),transparent)]"
        />
        <p className="text-center font-display text-sm uppercase tracking-[0.35em] text-waaw-yellow">
          Sénégal · Depuis 2024
        </p>
        <h1 className="mt-4 text-center font-display uppercase leading-[0.9] tracking-tight text-white text-[15vw] sm:text-7xl md:text-8xl">
          Waaw<span className="text-waaw-yellow">Kicks</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-center text-base text-white/60 sm:text-lg">
          Waaw, tu vas kiffer. Les meilleures sneakers Homme, Femme et Bébé, livrées chez toi.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/catalogue"
            className="group inline-flex items-center gap-2 rounded-full bg-waaw-yellow px-7 py-3.5 font-display uppercase tracking-wide text-waaw-black shadow-[0_10px_30px_-8px_rgba(255,212,0,0.5)] transition-transform hover:scale-105"
          >
            Voir le catalogue
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-10">
        <p className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-white/40">
          Parcourir par catégorie
        </p>
        <CategoryNav />
      </section>

      <section className="border-t border-white/10 px-4 py-10">
        <p className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-white/40">
          Nouveautés
        </p>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-center text-white/50">Aucun produit disponible.</p>
        )}
      </section>
    </main>
  )
}
