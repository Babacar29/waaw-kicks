import { CategoryNav } from '../../components/CategoryNav'
import { ProductCard } from '../../components/ProductCard'
import type { Categorie, Product } from '../../lib/types'

async function getProducts(categorie?: string): Promise<Product[]> {
  const url = new URL('/api/products', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
  if (categorie) url.searchParams.set('categorie', categorie)
  const res = await fetch(url, { cache: 'no-store' })
  return res.json()
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>
}) {
  const { categorie } = await searchParams
  const products = await getProducts(categorie)

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <CategoryNav active={categorie as Categorie | undefined} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="text-white/50 mt-8">Aucun produit dans cette catégorie.</p>}
    </main>
  )
}
