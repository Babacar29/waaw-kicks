import Link from 'next/link'
import type { Categorie } from '../lib/types'

const CATEGORIES: { value: Categorie; label: string }[] = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'bebe', label: 'Bébé' },
]

export function CategoryNav({ active }: { active?: Categorie }) {
  return (
    <nav className="flex gap-2 overflow-x-auto py-3">
      {CATEGORIES.map((c) => (
        <Link
          key={c.value}
          href={`/catalogue?categorie=${c.value}`}
          className={`px-4 py-2 rounded-full font-display uppercase text-sm whitespace-nowrap ${
            active === c.value ? 'bg-waaw-yellow text-waaw-black' : 'bg-white/10 text-white'
          }`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  )
}
