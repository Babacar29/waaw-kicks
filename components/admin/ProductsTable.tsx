'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ChevronRight, ChevronDown } from 'lucide-react'
import type { Product, Variant } from '../../lib/types'
import { AdminInput, AdminBadge, AdminEmptyState } from './ui'

interface ProductsTableProps {
  products: Product[]
  variantsByProduct: Record<number, Variant[]>
}

export function ProductsTable({ products, variantsByProduct }: ProductsTableProps) {
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.nom.toLowerCase().includes(q) || p.marque.toLowerCase().includes(q))
  }, [products, query])

  if (products.length === 0) {
    return <AdminEmptyState title="Aucun produit" description="Créez votre premier produit pour commencer à vendre." />
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <AdminInput
          placeholder="Rechercher un produit…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState title="Aucun résultat" description={`Rien ne correspond à "${query}".`} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-waaw-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const variants = variantsByProduct[p.id] ?? []
                const isExpanded = expandedId === p.id
                return (
                  <Fragment key={p.id}>
                    <tr className="group border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/5">
                      <td className="px-4 py-3">
                        <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-waaw-surface-2">
                            {p.photos[0] && <Image src={p.photos[0]} alt={p.nom} fill className="object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{p.nom}</p>
                            <p className="truncate text-xs text-white/40">{p.marque}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-white/70">{p.categorie}</td>
                      <td className="px-4 py-3 font-display text-waaw-yellow">
                        {p.prix.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <AdminBadge tone={p.actif ? 'actif' : 'inactif'}>{p.actif ? 'Actif' : 'Inactif'}</AdminBadge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : p.id)}
                          className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-white/40 transition-colors hover:text-waaw-yellow"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          {variants.length} variant{variants.length > 1 ? 's' : ''}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/produits/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-white/30 transition-colors group-hover:text-waaw-yellow"
                        >
                          Gérer
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-white/5 bg-black/20 last:border-b-0">
                        <td colSpan={6} className="px-4 py-3">
                          {variants.length === 0 ? (
                            <p className="text-xs text-white/40">Aucun variant pour ce produit.</p>
                          ) : (
                            <table className="w-full max-w-lg text-left text-xs">
                              <thead>
                                <tr className="text-white/40">
                                  <th className="py-1 pr-4 font-medium">Pointure</th>
                                  <th className="py-1 pr-4 font-medium">Couleur</th>
                                  <th className="py-1 font-medium">Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {variants.map((v) => (
                                  <tr key={v.id} className="text-white/70">
                                    <td className="py-1 pr-4">{v.pointure}</td>
                                    <td className="py-1 pr-4">{v.couleur}</td>
                                    <td className="py-1">
                                      <span className={v.quantite_stock === 0 ? 'text-red-400' : ''}>
                                        {v.quantite_stock}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
