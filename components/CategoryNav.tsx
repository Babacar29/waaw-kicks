import Link from 'next/link'
import type { Categorie } from '../lib/types'

const CATEGORIES: { value: Categorie; label: string }[] = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'bebe', label: 'Bébé' },
]

export function CategoryNav({ active }: { active?: Categorie }) {
  return (
    <nav className="flex gap-2 overflow-x-auto py-1">
      {CATEGORIES.map((c) => (
        <Link
          key={c.value}
          href={`/catalogue?categorie=${c.value}`}
          className={`shrink-0 rounded-full px-5 py-2.5 font-display text-sm uppercase tracking-wide transition-all ${
            active === c.value
              ? 'bg-waaw-yellow text-waaw-black shadow-[0_0_20px_rgba(255,212,0,0.35)]'
              : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  )
}
