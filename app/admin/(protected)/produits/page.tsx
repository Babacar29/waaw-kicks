import Link from 'next/link'
import { sql } from '../../../../lib/db'
import type { Product } from '../../../../lib/types'

export default async function AdminProductsPage() {
  const products = (await sql('SELECT * FROM products ORDER BY created_at DESC')) as unknown as Product[]

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-xl">Produits</h1>
        <Link href="/admin/produits/nouveau" className="bg-black text-white px-4 py-2 rounded">
          + Nouveau produit
        </Link>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b"><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Actif</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.nom}</td>
              <td>{p.categorie}</td>
              <td>{p.prix.toLocaleString('fr-FR')} FCFA</td>
              <td>{p.actif ? 'Oui' : 'Non'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
