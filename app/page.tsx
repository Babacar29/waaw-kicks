import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { CategoryNav } from '../components/CategoryNav'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { sql } from '../lib/db'
import type { Product } from '../lib/types'

async function getProducts(): Promise<Product[]> {
  const products = await sql('SELECT * FROM products WHERE actif = true ORDER BY created_at DESC')
  return products as unknown as Product[]
}

export default async function HomePage() {
  const products = await getProducts()
  const storyPhoto = products[0]?.photos[0]

  return (
    <main className="min-h-screen bg-waaw-black text-white">
      <section className="relative overflow-hidden px-4 pb-14 pt-20 sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,212,0,0.16),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-waaw-yellow/10 blur-3xl"
        />
        <Reveal>
          <p className="text-center font-display text-sm uppercase tracking-[0.35em] text-waaw-yellow">
            Sénégal · Depuis 2024
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-4 text-center font-display uppercase leading-[0.9] tracking-tight text-white text-[15vw] sm:text-7xl md:text-8xl">
            Waaw<span className="text-waaw-yellow">Kicks</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-md text-center text-base text-white/60 sm:text-lg">
            Waaw, tu vas kiffer. Les meilleures sneakers Homme, Femme et Enfant, livrées chez toi.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-8 flex justify-center">
            <Link
              href="/catalogue"
              className="group inline-flex items-center gap-2 rounded-full bg-waaw-yellow px-7 py-3.5 font-display uppercase tracking-wide text-waaw-black shadow-[0_14px_36px_-8px_rgba(255,212,0,0.55)] transition-transform hover:scale-105"
            >
              Voir le catalogue
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-white/10 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 sm:items-center sm:gap-12">
          <Reveal variant="left">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-waaw-surface-2">
              {storyPhoto ? (
                <Image src={storyPhoto} alt="" fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,212,0,0.25),rgba(10,10,10,0.9))]" />
              )}
            </div>
          </Reveal>
          <Reveal variant="right" delay={120}>
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-waaw-yellow">Notre histoire</p>
              <p className="mt-3 text-xl leading-relaxed text-white sm:text-2xl">
                Née à Dakar, WaawKicks sélectionne les sneakers qui comptent vraiment.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Chaque paire est choisie pour sa qualité et son style, homme, femme ou enfant, puis livrée
                directement chez toi, où que tu sois au Sénégal.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-4">
            <p className="shrink-0 font-display text-xs uppercase tracking-[0.3em] text-white/40">
              Parcourir par catégorie
            </p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>
        <Reveal delay={80}>
          <CategoryNav />
        </Reveal>
      </section>

      <section className="border-t border-white/10 px-4 py-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-4">
            <p className="shrink-0 font-display text-xs uppercase tracking-[0.3em] text-white/40">
              Nouveautés
            </p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 50, 400)}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-white/50">Aucun produit disponible.</p>
        )}
      </section>
    </main>
  )
}
