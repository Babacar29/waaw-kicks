# Home Page Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Waaw Kicks home page (`app/page.tsx`) to an editorial/scrollytelling premium feel — depth in the hero, a new storytelling section, editorial section headers, and scroll-reveal motion throughout — using a reusable, dependency-free `Reveal` component.

**Architecture:** One new client component (`components/Reveal.tsx`) wraps children in an `IntersectionObserver`-driven fade/slide-in effect, respecting `prefers-reduced-motion` and failing open when unsupported. `app/page.tsx` (server component, unchanged data fetching) wraps each section/element in `Reveal` and gains a new storytelling section between the hero and the category nav.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4, `@testing-library/react` + Vitest (unit), Playwright (visual regression). No new dependencies.

## Global Constraints

- No animation library (GSAP etc.) — CSS transitions + native `IntersectionObserver` only.
- Must respect `prefers-reduced-motion: reduce` — content renders fully visible, no transform/opacity transition, when active.
- `Reveal` must fail open (render children visible) if `IntersectionObserver` is unavailable.
- No new data queries — storytelling section image reuses the already-fetched `products` array's first element.
- Existing tests (`tests/integration/*`, other unit tests) must keep passing untouched.

---

### Task 1: `Reveal` scroll-reveal component

**Files:**
- Create: `components/Reveal.tsx`
- Test: `tests/unit/reveal.test.ts`

**Interfaces:**
- Produces: `Reveal` — named export from `components/Reveal.tsx`. Props: `{ children: ReactNode; className?: string; delay?: number; variant?: 'up' | 'left' | 'right' }`. Renders a `<div>` wrapping `children`. `delay` defaults to `0` (milliseconds, applied as CSS `transition-delay`). `variant` defaults to `'up'` and controls the hidden-state transform (`'up'` → translate down 1rem, `'left'` → translate right from a point 1rem to the left, `'right'` → translate left from a point 1rem to the right). Later tasks (2 and 3) consume this component and this exact prop shape.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/reveal.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { Reveal } from '../../components/Reveal'

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function mockIntersectionObserver() {
  let capturedCallback: IntersectionObserverCallback = () => {}

  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      capturedCallback = callback
    }
    observe = vi.fn()
    disconnect = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = [0.1]
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

  return {
    trigger: (isIntersecting: boolean) =>
      act(() => {
        capturedCallback(
          [{ isIntersecting } as IntersectionObserverEntry],
          new MockIntersectionObserver(() => {}) as unknown as IntersectionObserver,
        )
      }),
  }
}

describe('Reveal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders visible immediately when prefers-reduced-motion is active', () => {
    mockMatchMedia(true)
    mockIntersectionObserver()

    render(React.createElement(Reveal, {}, React.createElement('p', {}, 'Hello')))

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-100')
  })

  it('starts hidden and becomes visible once IntersectionObserver reports intersection', () => {
    mockMatchMedia(false)
    const { trigger } = mockIntersectionObserver()

    render(React.createElement(Reveal, {}, React.createElement('p', {}, 'Hello')))

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-0')

    trigger(true)

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-100')
  })

  it('renders visible immediately when IntersectionObserver is unavailable', () => {
    mockMatchMedia(false)
    vi.stubGlobal('IntersectionObserver', undefined)

    render(React.createElement(Reveal, {}, React.createElement('p', {}, 'Hello')))

    expect(screen.getByText('Hello').parentElement?.className).toContain('opacity-100')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/reveal.test.ts`
Expected: FAIL — `components/Reveal.tsx` does not exist yet (module resolution error).

- [ ] **Step 3: Implement `Reveal`**

Create `components/Reveal.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type RevealVariant = 'up' | 'left' | 'right'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: RevealVariant
}

const hiddenClasses: Record<RevealVariant, string> = {
  up: 'translate-y-4 opacity-0',
  left: '-translate-x-4 opacity-0',
  right: 'translate-x-4 opacity-0',
}

export function Reveal({ children, className = '', delay = 0, variant = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-x-0 translate-y-0 opacity-100' : hiddenClasses[variant]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/reveal.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/Reveal.tsx tests/unit/reveal.test.ts
git commit -m "feat: add Reveal scroll-reveal component"
```

---

### Task 2: Hero depth + storytelling section

**Files:**
- Modify: `app/page.tsx:1-41` (imports, hero section)

**Interfaces:**
- Consumes: `Reveal` from `components/Reveal.tsx` (Task 1) — `<Reveal>`, `<Reveal delay={ms}>`, `<Reveal variant="left" delay={ms}>`, `<Reveal variant="right" delay={ms}>`.
- Consumes: `Image` from `next/image` (already used elsewhere in the codebase, e.g. `components/ProductCard.tsx`).
- Produces: `storyPhoto` local variable (`products[0]?.photos[0]`) — only used within this task's section, not consumed elsewhere.

- [ ] **Step 1: Replace imports and hero section**

In `app/page.tsx`, replace lines 1-41 with:

```tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { CategoryNav } from '../components/CategoryNav'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { sql } from '../lib/db'
import type { Product } from '../lib/types'

async function getProducts(): Promise<Product[]> {
  const products = await sql('SELECT * FROM products WHERE actif = true ORDER BY created_at DESC')
  return products as unknown as Product[]
}

export default async function HomePage() {
  const products = await getProducts()
  const storyPhoto = products[0]?.photos[0]

  return (
    <main className="min-h-screen bg-waaw-black text-white">
      <section className="relative overflow-hidden px-4 pb-14 pt-20 sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,212,0,0.16),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-waaw-yellow/10 blur-3xl"
        />
        <Reveal>
          <p className="text-center font-display text-sm uppercase tracking-[0.35em] text-waaw-yellow">
            Sénégal · Depuis 2024
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-4 text-center font-display uppercase leading-[0.9] tracking-tight text-white text-[15vw] sm:text-7xl md:text-8xl">
            Waaw<span className="text-waaw-yellow">Kicks</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-md text-center text-base text-white/60 sm:text-lg">
            Waaw, tu vas kiffer. Les meilleures sneakers Homme, Femme et Bébé, livrées chez toi.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-8 flex justify-center">
            <Link
              href="/catalogue"
              className="group inline-flex items-center gap-2 rounded-full bg-waaw-yellow px-7 py-3.5 font-display uppercase tracking-wide text-waaw-black shadow-[0_14px_36px_-8px_rgba(255,212,0,0.55)] transition-transform hover:scale-105"
            >
              Voir le catalogue
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-white/10 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 sm:items-center sm:gap-12">
          <Reveal variant="left">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-waaw-surface-2">
              {storyPhoto ? (
                <Image src={storyPhoto} alt="" fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,212,0,0.25),rgba(10,10,10,0.9))]" />
              )}
            </div>
          </Reveal>
          <Reveal variant="right" delay={120}>
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-waaw-yellow">Notre histoire</p>
              <p className="mt-3 text-xl leading-relaxed text-white sm:text-2xl">
                Née à Dakar, WaawKicks sélectionne les sneakers qui comptent vraiment.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Chaque paire est choisie pour sa qualité et son style, homme, femme ou bébé, puis livrée
                directement chez toi, où que tu sois au Sénégal.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
```

Note: the rest of the file (Catégories and Nouveautés sections, plus the closing `</main>` / `)` / `}`) stays as-is for this step — Task 3 replaces it.

- [ ] **Step 2: Verify the dev server renders the page without errors**

Run: `npm run dev` (if not already running), then open `http://localhost:3000/` in a browser.
Expected: page loads, hero fades in, new storytelling section visible below hero with either a product photo or the gradient fallback panel, no console errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add hero depth and storytelling section to home page"
```

---

### Task 3: Editorial section headers + staggered product grid

**Files:**
- Modify: `app/page.tsx` (Catégories and Nouveautés sections — the two `<section>` blocks after the storytelling section added in Task 2)

**Interfaces:**
- Consumes: `Reveal` from `components/Reveal.tsx` (Task 1).
- Consumes: `CategoryNav` (`components/CategoryNav.tsx`) and `ProductCard` (`components/ProductCard.tsx`) — unchanged, already imported.

- [ ] **Step 1: Replace the Catégories and Nouveautés sections**

Replace the two remaining `<section>` blocks (Catégories and Nouveautés) plus the closing tags with:

```tsx
      <section className="border-t border-white/10 px-4 py-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-4">
            <p className="shrink-0 font-display text-xs uppercase tracking-[0.3em] text-white/40">
              Parcourir par catégorie
            </p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>
        <Reveal delay={80}>
          <CategoryNav />
        </Reveal>
      </section>

      <section className="border-t border-white/10 px-4 py-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-4">
            <p className="shrink-0 font-display text-xs uppercase tracking-[0.3em] text-white/40">
              Nouveautés
            </p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </Reveal>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 50, 400)}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-white/50">Aucun produit disponible.</p>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify the dev server renders the page without errors**

Refresh `http://localhost:3000/` in a browser.
Expected: category section and product grid have a thin rule line next to their labels, product cards fade in with a staggered delay when scrolled into view, no console errors.

- [ ] **Step 3: Verify reduced-motion behavior manually**

In Chrome DevTools: Command/Ctrl+Shift+P → "Rendering" → set "Emulate CSS media feature prefers-reduced-motion" to `reduce`, then reload `http://localhost:3000/`.
Expected: all sections (hero, storytelling, categories, product grid) are fully visible immediately with no fade/slide-in animation.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add editorial section headers and staggered product grid to home page"
```

---

### Task 4: Update visual regression baselines

**Files:**
- Modify (regenerated, not hand-edited): `tests/e2e/visual.spec.ts-snapshots/--chromium-darwin.png`, `tests/e2e/visual.spec.ts-snapshots/--mobile-320-darwin.png`, `tests/e2e/visual.spec.ts-snapshots/--tablet-768-darwin.png`, `tests/e2e/visual.spec.ts-snapshots/--desktop-1440-darwin.png`

**Interfaces:**
- None — this task only regenerates existing Playwright snapshot baselines for the home page (`/`) test in `tests/e2e/visual.spec.ts`; it does not change `visual.spec.ts` itself (the existing `pages = ['/', '/catalogue', '/checkout']` loop already covers home page across all four configured projects).

- [ ] **Step 1: Run the existing home page visual test to confirm it now fails against the old baseline**

Run: `npx playwright test tests/e2e/visual.spec.ts -g "visual snapshot of /$"`
Expected: FAIL — screenshot mismatch against the pre-redesign baseline (confirms the redesign changed the page's visual output as intended).

- [ ] **Step 2: Regenerate the home page baselines**

Run: `npx playwright test tests/e2e/visual.spec.ts -g "visual snapshot of /$" --update-snapshots`
Expected: PASS, and the four home-page PNG files listed above are rewritten under `tests/e2e/visual.spec.ts-snapshots/`.

- [ ] **Step 3: Run the full visual suite to confirm no other page regressed**

Run: `npx playwright test tests/e2e/visual.spec.ts`
Expected: PASS for all pages (`/`, `/catalogue`, `/checkout`, produit) across all four projects — catalogue/checkout/produit baselines are untouched since this plan only modifies `app/page.tsx`.

- [ ] **Step 4: Run the unit test suite to confirm no regressions**

Run: `npx vitest run`
Expected: PASS (all existing unit/integration tests plus the new `tests/unit/reveal.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/visual.spec.ts-snapshots/
git commit -m "test: update home page visual regression baselines for editorial redesign"
```
