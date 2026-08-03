'use client'

import { useState } from 'react'
import { useCartStore } from '../../lib/cart-store'
import { buildWhatsAppMessage, buildWhatsAppLink } from '../../lib/whatsapp'

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const clear = useCartStore((s) => s.clear)
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.nom || !form.telephone || !form.adresse) {
      setError('Merci de remplir tous les champs.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_client: form.nom,
          telephone: form.telephone,
          adresse: form.adresse,
          items,
        }),
      })

      if (res.status === 409) {
        setError('Un article de ton panier n’est plus disponible en stock.')
        return
      }
      if (!res.ok) {
        setError('Une erreur est survenue, réessaie.')
        return
      }

      const message = buildWhatsAppMessage(items, total, {
        nom: form.nom,
        telephone: form.telephone,
        adresse: form.adresse,
      })
      const link = buildWhatsAppLink(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '', message)
      clear()
      window.location.href = link
    } catch {
      setError('Une erreur est survenue, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-waaw-black px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl uppercase tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-white/50">On te contacte sur WhatsApp pour confirmer.</p>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-waaw-surface px-4 py-3">
          <span className="text-sm text-white/50">Total à payer</span>
          <span className="font-display text-lg text-waaw-yellow">{total.toLocaleString('fr-FR')} FCFA</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-white/40">
              Nom complet
            </label>
            <input
              placeholder="Aminata Diop"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-white placeholder:text-white/25 outline-none transition-colors focus:border-waaw-yellow"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-white/40">
              Téléphone
            </label>
            <input
              placeholder="77 123 45 67"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-white placeholder:text-white/25 outline-none transition-colors focus:border-waaw-yellow"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-white/40">
              Adresse de livraison
            </label>
            <input
              placeholder="Sacré-Cœur 3, Dakar"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-white placeholder:text-white/25 outline-none transition-colors focus:border-waaw-yellow"
            />
          </div>
          {error && (
            <p className="rounded-xl border border-waaw-red/30 bg-waaw-red/10 px-4 py-3 text-sm text-waaw-red">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-waaw-yellow py-4 font-display uppercase tracking-wide text-waaw-black shadow-[0_10px_30px_-8px_rgba(255,212,0,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Envoi...' : 'Commander sur WhatsApp'}
          </button>
        </form>
      </div>
    </main>
  )
}
