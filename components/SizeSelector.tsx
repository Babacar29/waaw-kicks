'use client'

import { useState } from 'react'
import type { Variant } from '../lib/types'

export function SizeSelector({
  variants,
  onSelect,
}: {
  variants: Variant[]
  onSelect: (variant: Variant) => void
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((v) => {
        const disabled = v.quantite_stock <= 0
        return (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              setSelectedId(v.id)
              onSelect(v)
            }}
            className={`rounded-xl border px-4 py-2.5 font-display text-sm transition-all ${
              disabled
                ? 'cursor-not-allowed border-white/10 text-white/25 line-through'
                : selectedId === v.id
                ? 'border-waaw-yellow bg-waaw-yellow text-waaw-black shadow-[0_0_16px_rgba(255,212,0,0.3)]'
                : 'border-white/15 text-white hover:border-white/40'
            }`}
          >
            {v.pointure} · {v.couleur}
          </button>
        )
      })}
    </div>
  )
}
