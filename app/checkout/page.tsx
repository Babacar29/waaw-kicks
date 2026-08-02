'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '../../lib/cart-store'
import { buildWhatsAppMessage, buildWhatsAppLink } from '../../lib/whatsapp'

export default function CheckoutPage() {
  const router = useRouter()
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
    setLoading(false)

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
    router.push(link)
  }

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <h1 className="font-display uppercase text-2xl mb-4">Checkout</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Nom complet"
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          className="w-full bg-white/10 rounded p-3"
        />
        <input
          placeholder="Téléphone"
          value={form.telephone}
          onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          className="w-full bg-white/10 rounded p-3"
        />
        <input
          placeholder="Adresse"
          value={form.adresse}
          onChange={(e) => setForm({ ...form, adresse: e.target.value })}
          className="w-full bg-white/10 rounded p-3"
        />
        {error && <p className="text-waaw-red">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-waaw-yellow text-waaw-black font-display uppercase py-3 rounded disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Commander sur WhatsApp'}
        </button>
      </form>
    </main>
  )
}
