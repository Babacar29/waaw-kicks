import Link from 'next/link'
import { CategoryNav } from '../components/CategoryNav'

export default function HomePage() {
  return (
    <main className="bg-waaw-black min-h-screen text-white">
      <section className="px-4 py-16 text-center">
        <h1 className="font-display uppercase text-5xl leading-tight">
          Waaw<span className="text-waaw-yellow">Kicks</span>
        </h1>
        <p className="mt-3 text-white/70">Waaw, tu vas kiffer. Sneakers Homme, Femme, Bébé.</p>
        <Link
          href="/catalogue"
          className="inline-block mt-6 bg-waaw-yellow text-waaw-black font-display uppercase px-6 py-3 rounded"
        >
          Voir le catalogue
        </Link>
      </section>
      <div className="px-4">
        <CategoryNav />
      </div>
    </main>
  )
}
