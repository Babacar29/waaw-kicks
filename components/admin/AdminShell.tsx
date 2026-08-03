'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, Package, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/admin/produits', label: 'Produits', icon: Package },
  { href: '/admin/commandes', label: 'Commandes', icon: LayoutGrid },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-waaw-black">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-waaw-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin/produits" className="font-display uppercase text-xl tracking-wide text-white">
            Waaw<span className="text-waaw-yellow">Kicks</span>
            <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] tracking-widest text-white/40">
              Admin
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                    active ? 'bg-waaw-yellow text-waaw-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 font-display text-sm uppercase tracking-wide text-white/60 transition-colors hover:border-waaw-red/60 hover:text-waaw-red"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
