'use client'

import { useEffect, useState } from 'react'
import { Phone, MapPin } from 'lucide-react'
import type { Order, StatutCommande } from '../../../../lib/types'
import { AdminPageHeader, AdminCard, AdminSelect, AdminBadge, AdminEmptyState } from '../../../../components/admin/ui'

const STATUSES: StatutCommande[] = ['nouvelle', 'confirmee', 'livree', 'annulee']

const STATUS_LABELS: Record<StatutCommande, string> = {
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  livree: 'Livrée',
  annulee: 'Annulée',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: number, statut: StatutCommande) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)))
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
  }

  return (
    <div>
      <AdminPageHeader
        title="Commandes"
        description={!loading ? `${orders.length} commande${orders.length > 1 ? 's' : ''}` : undefined}
      />

      {!loading && orders.length === 0 ? (
        <AdminEmptyState title="Aucune commande" description="Les nouvelles commandes apparaîtront ici." />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <AdminCard key={o.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-display text-lg uppercase tracking-wide text-white">{o.nom_client}</p>
                    <AdminBadge tone={o.statut}>{STATUS_LABELS[o.statut]}</AdminBadge>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1 text-sm text-white/50">
                    <a href={`tel:${o.telephone}`} className="flex items-center gap-1.5 hover:text-waaw-yellow">
                      <Phone size={13} />
                      {o.telephone}
                    </a>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {o.adresse}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-display text-xl text-waaw-yellow">{o.total.toLocaleString('fr-FR')} FCFA</p>
                  <AdminSelect
                    value={o.statut}
                    onChange={(e) => updateStatus(o.id, e.target.value as StatutCommande)}
                    className="w-40 py-2"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
              </div>

              {o.items?.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-white/5 pt-4">
                  {o.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between text-sm text-white/60">
                      <span>
                        {item.nom} <span className="text-white/30">— {item.pointure} · {item.couleur}</span>
                      </span>
                      <span className="text-white/40">
                        {item.quantite} × {item.prix.toLocaleString('fr-FR')} FCFA
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}
