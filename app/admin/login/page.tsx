'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { AdminInput, AdminButton, AdminAlert, Field } from '../../../components/admin/ui'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-waaw-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl uppercase tracking-wide text-white">
            Waaw<span className="text-waaw-yellow">Kicks</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/40">Espace administrateur</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-waaw-surface p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
        >
          <Field label="Mot de passe" htmlFor="admin-password">
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <AdminInput
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && <AdminAlert>{error}</AdminAlert>}

          <AdminButton type="submit" loading={loading} className="w-full">
            Se connecter
          </AdminButton>
        </form>
      </div>
    </main>
  )
}
