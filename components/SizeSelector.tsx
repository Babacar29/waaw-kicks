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
            className={`px-3 py-2 rounded border font-display text-sm ${
              disabled
                ? 'border-white/10 text-white/30 line-through cursor-not-allowed'
                : selectedId === v.id
                ? 'border-waaw-yellow bg-waaw-yellow text-waaw-black'
                : 'border-white/30 text-white'
            }`}
          >
            {v.pointure} · {v.couleur}
          </button>
        )
      })}
    </div>
  )
}
