import Link from 'next/link'
import { Plus } from 'lucide-react'
import { sql } from '../../../../lib/db'
import type { Product } from '../../../../lib/types'
import { AdminPageHeader, AdminButton } from '../../../../components/admin/ui'
import { ProductsTable } from '../../../../components/admin/ProductsTable'

export default async function AdminProductsPage() {
  const products = (await sql('SELECT * FROM products ORDER BY created_at DESC')) as unknown as Product[]

  return (
    <div>
      <AdminPageHeader
        title="Produits"
        description={`${products.length} produit${products.length > 1 ? 's' : ''} au catalogue`}
        actions={
          <Link href="/admin/produits/nouveau">
            <AdminButton>
              <Plus size={16} />
              Nouveau produit
            </AdminButton>
          </Link>
        }
      />
      <ProductsTable products={products} />
    </div>
  )
}
