'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { AdminButton, AdminAlert } from './ui'

interface ValidationDetail {
  index: number
  errors: string[]
}

export function BulkImportButton() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<ValidationDetail[]>([])
  const [success, setSuccess] = useState<string | null>(null)

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    setDetails([])
    setSuccess(null)

    let products: unknown
    try {
      products = JSON.parse(await file.text())
    } catch {
      setError('Fichier JSON invalide')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      })
      const responseBody = await res.json()
      if (!res.ok) {
        setError(responseBody.error ?? "Erreur lors de l'import")
        setDetails(responseBody.details ?? [])
        return
      }
      setSuccess(`${responseBody.count} produit${responseBody.count > 1 ? 's' : ''} importé${responseBody.count > 1 ? 's' : ''}`)
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />
      <AdminButton
        type="button"
        variant="secondary"
        loading={loading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={16} />
        Importer JSON
      </AdminButton>

      {error && (
        <div className="absolute right-0 top-full z-10 mt-2 w-80">
          <AdminAlert>
            {error}
            {details.length > 0 && (
              <ul className="mt-1 list-disc pl-4">
                {details.map((d) => (
                  <li key={d.index}>
                    Produit {d.index + 1}: {d.errors.join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </AdminAlert>
        </div>
      )}

      {success && !error && (
        <p className="absolute right-0 top-full z-10 mt-2 w-80 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-300">
          {success}
        </p>
      )}
    </div>
  )
}
