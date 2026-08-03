'use client'

import { useEffect, useState } from 'react'
import type { Order, StatutCommande } from '../../../lib/types'

const STATUSES: StatutCommande[] = ['nouvelle', 'confirmee', 'livree', 'annulee']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetch('/api/orders').then((r) => r.json()).then(setOrders)
  }, [])

  async function updateStatus(id: number, statut: StatutCommande) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)))
  }

  return (
    <main className="p-6">
      <h1 className="font-bold text-xl mb-4">Commandes</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="border rounded p-3">
            <p className="font-bold">{o.nom_client} — {o.telephone}</p>
            <p className="text-sm text-neutral-600">{o.adresse}</p>
            <p className="mt-1">{o.total.toLocaleString('fr-FR')} FCFA</p>
            <select
              value={o.statut}
              onChange={(e) => updateStatus(o.id, e.target.value as StatutCommande)}
              className="mt-2 border rounded p-1"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </main>
  )
}
