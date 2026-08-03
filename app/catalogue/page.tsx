import { CategoryNav } from '../../components/CategoryNav'
import { ProductCard } from '../../components/ProductCard'
import { sql } from '../../lib/db'
import type { Categorie, Product } from '../../lib/types'

async function getProducts(categorie?: string): Promise<Product[]> {
  const products = categorie
    ? await sql('SELECT * FROM products WHERE actif = true AND categorie = $1 ORDER BY created_at DESC', [categorie])
    : await sql('SELECT * FROM products WHERE actif = true ORDER BY created_at DESC')
  return products as unknown as Product[]
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>
}) {
  const { categorie } = await searchParams
  const products = await getProducts(categorie)

  return (
    <main className="min-h-screen bg-waaw-black px-4 py-8 text-white">
      <h1 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">Catalogue</h1>
      <p className="mt-1 text-sm text-white/50">{products.length} paire{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}</p>
      <div className="mt-5">
        <CategoryNav active={categorie as Categorie | undefined} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="mt-16 text-center text-white/50">Aucun produit dans cette catégorie.</p>
      )}
    </main>
  )
}
