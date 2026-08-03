'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      setError('Mot de passe incorrect')
      return
    }
    router.push('/admin/produits')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80 space-y-3">
        <h1 className="font-bold text-lg">Admin Waaw Kicks</h1>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-black text-white rounded py-2">
          Se connecter
        </button>
      </form>
    </main>
  )
}
