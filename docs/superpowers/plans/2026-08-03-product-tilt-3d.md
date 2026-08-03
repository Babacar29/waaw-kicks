# Aperçu 3D tilt sur la page produit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la photo hero de `/produit/[id]` réactive au mouvement (souris desktop, gyroscope ou glisser tactile mobile) pour donner l'impression d'un objet 3D réel, sans nouvel asset.

**Architecture:** Une fonction de calcul pure (`lib/tilt-math.ts`) convertit position pointeur / angles gyroscope en degrés de tilt clampés. Un hook client (`hooks/useTiltGesture.ts`) branche les listeners DOM (mouse/touch/deviceorientation) et écrit le résultat dans des custom properties CSS via `requestAnimationFrame` (pas de re-render React par frame). Un composant (`components/ProductTilt.tsx`) consomme ces custom properties pour piloter 3 couches CSS (halo, image inclinée, reflet spéculaire) et remplace le bloc image statique de la page produit.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, TypeScript strict, Tailwind CSS v4, Vitest + @testing-library/react (tests unitaires), Playwright (visual regression e2e).

## Global Constraints

- S'applique uniquement à la photo hero de `/produit/[id]` — pas aux `ProductCard` de la grille, pas aux miniatures.
- Aucun changement de schéma DB, aucun nouveau champ produit, aucun nouvel asset à uploader côté admin.
- Angle de tilt clampé à ±12° sur les deux axes.
- Seules les propriétés `transform`, `opacity`, `filter` sont animées (compositor-friendly).
- `prefers-reduced-motion: reduce` → tilt entièrement désactivé, image statique, aucun listener attaché.
- Sur iOS, la permission gyroscope (`DeviceOrientationEvent.requestPermission`) ne peut être demandée que depuis un geste utilisateur explicite (bouton "Activer vue 3D"), jamais automatiquement.
- Fallback : permission refusée ou API gyroscope indisponible → glisser tactile (touch-drag) pilote le tilt.
- Aucune nouvelle dépendance npm.
- Imports relatifs (`../../lib/...`), pas l'alias `@/*`, pour rester cohérent avec le reste du code base.
- Tests unitaires en `tests/unit/*.test.ts` (le include de `vitest.config.ts` ne couvre pas `.test.tsx` — pas de rendu JSX dans ces tests).

---

## Task 1: Fonctions de calcul de tilt (pures, testables)

**Files:**
- Create: `lib/tilt-math.ts`
- Test: `tests/unit/tilt-math.test.ts`

**Interfaces:**
- Produces: `MAX_TILT_DEG: number`, `clamp(value: number, min: number, max: number): number`, `computeTiltFromPointer(px: number, py: number): { x: number; y: number }`, `computeTiltFromOrientation(beta: number, gamma: number): { x: number; y: number }`, `getOrientationPermissionAPI(): { requestPermission: () => Promise<'granted' | 'denied'> } | null`. Task 2 (le hook) importe ces 5 exports directement de `lib/tilt-math.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/tilt-math.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { clamp, computeTiltFromPointer, computeTiltFromOrientation, MAX_TILT_DEG } from '../../lib/tilt-math'

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, -10, 10)).toBe(5)
  })

  it('clamps to the minimum', () => {
    expect(clamp(-20, -10, 10)).toBe(-10)
  })

  it('clamps to the maximum', () => {
    expect(clamp(20, -10, 10)).toBe(10)
  })
})

describe('computeTiltFromPointer', () => {
  it('returns zero tilt at the exact center', () => {
    expect(computeTiltFromPointer(0.5, 0.5)).toEqual({ x: 0, y: 0 })
  })

  it('tilts toward MAX_TILT_DEG/-MAX_TILT_DEG at the top-left corner', () => {
    const tilt = computeTiltFromPointer(0, 0)
    expect(tilt.x).toBe(MAX_TILT_DEG)
    expect(tilt.y).toBe(-MAX_TILT_DEG)
  })

  it('tilts toward -MAX_TILT_DEG/MAX_TILT_DEG at the bottom-right corner', () => {
    const tilt = computeTiltFromPointer(1, 1)
    expect(tilt.x).toBe(-MAX_TILT_DEG)
    expect(tilt.y).toBe(MAX_TILT_DEG)
  })

  it('clamps out-of-range fractions', () => {
    const tilt = computeTiltFromPointer(-1, -1)
    expect(tilt.x).toBe(MAX_TILT_DEG)
    expect(tilt.y).toBe(-MAX_TILT_DEG)
  })
})

describe('computeTiltFromOrientation', () => {
  it('returns zero tilt at the neutral holding angle (beta=45, gamma=0)', () => {
    expect(computeTiltFromOrientation(45, 0)).toEqual({ x: 0, y: 0 })
  })

  it('clamps extreme positive beta/gamma to MAX_TILT_DEG', () => {
    const tilt = computeTiltFromOrientation(200, 200)
    expect(tilt.x).toBe(MAX_TILT_DEG)
    expect(tilt.y).toBe(MAX_TILT_DEG)
  })

  it('clamps extreme negative beta/gamma to -MAX_TILT_DEG', () => {
    const tilt = computeTiltFromOrientation(-200, -200)
    expect(tilt.x).toBe(-MAX_TILT_DEG)
    expect(tilt.y).toBe(-MAX_TILT_DEG)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/tilt-math.test.ts`
Expected: FAIL with "Cannot find module '../../lib/tilt-math'"

- [ ] **Step 3: Write minimal implementation**

Create `lib/tilt-math.ts`:

```ts
export const MAX_TILT_DEG = 12

const ORIENTATION_NEUTRAL_BETA = 45
const ORIENTATION_RANGE_DEG = 45

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Converts a pointer position relative to an element's bounding box
 * (px/py as 0..1 fractions of width/height) into a clamped tilt angle.
 */
export function computeTiltFromPointer(px: number, py: number): { x: number; y: number } {
  const offsetX = px - 0.5
  const offsetY = py - 0.5
  return {
    x: clamp(offsetY * -2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG),
    y: clamp(offsetX * 2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG),
  }
}

/**
 * Converts raw DeviceOrientationEvent angles (degrees) into a clamped tilt
 * angle, treating a phone held upright (~45° beta) as neutral.
 */
export function computeTiltFromOrientation(beta: number, gamma: number): { x: number; y: number } {
  const normalizedBeta = clamp(beta - ORIENTATION_NEUTRAL_BETA, -ORIENTATION_RANGE_DEG, ORIENTATION_RANGE_DEG)
  const normalizedGamma = clamp(gamma, -ORIENTATION_RANGE_DEG, ORIENTATION_RANGE_DEG)
  return {
    x: (normalizedBeta / ORIENTATION_RANGE_DEG) * MAX_TILT_DEG,
    y: (normalizedGamma / ORIENTATION_RANGE_DEG) * MAX_TILT_DEG,
  }
}

interface OrientationPermissionAPI {
  requestPermission: () => Promise<'granted' | 'denied'>
}

/**
 * Returns the iOS 13+ DeviceOrientationEvent.requestPermission API when
 * present, or null on platforms where orientation access needs no explicit
 * permission (or isn't supported at all).
 */
export function getOrientationPermissionAPI(): OrientationPermissionAPI | null {
  const ctor = window.DeviceOrientationEvent as unknown as Partial<OrientationPermissionAPI> | undefined
  if (ctor && typeof ctor.requestPermission === 'function') {
    return ctor as OrientationPermissionAPI
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/tilt-math.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/tilt-math.ts tests/unit/tilt-math.test.ts
git commit -m "feat: add pure tilt angle calculation for product 3D preview"
```

---

## Task 2: Hook `useTiltGesture` (branchement DOM + gyroscope)

**Files:**
- Create: `hooks/useTiltGesture.ts`
- Test: `tests/unit/use-tilt-gesture.test.ts`

**Interfaces:**
- Consumes: `MAX_TILT_DEG`, `computeTiltFromPointer`, `computeTiltFromOrientation`, `getOrientationPermissionAPI` from `../lib/tilt-math` (Task 1).
- Produces: `useTiltGesture<T extends HTMLElement>(ref: RefObject<T | null>): { needsPermissionPrompt: boolean; requestPermission: () => void }`. Task 3 (le composant) importe `useTiltGesture` depuis `../hooks/useTiltGesture` et lit `--tilt-x`/`--tilt-y` (custom properties CSS écrites sur l'élément référencé par `ref`, valeurs numériques sans unité, ex. `"3.20"`).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/use-tilt-gesture.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { RefObject } from 'react'
import { useTiltGesture } from '../../hooks/useTiltGesture'

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function mockBoundingRect(el: HTMLElement) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0,
    toJSON: () => {},
  })
}

describe('useTiltGesture', () => {
  let rafCallbacks: FrameRequestCallback[]

  beforeEach(() => {
    rafCallbacks = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  function flushRaf() {
    const callbacks = rafCallbacks
    rafCallbacks = []
    callbacks.forEach((cb) => cb(0))
  }

  it('writes tilt custom properties on mousemove', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    renderHook(() => useTiltGesture(ref))

    act(() => {
      el.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 0, bubbles: true }))
    })
    flushRaf()

    expect(el.style.getPropertyValue('--tilt-x')).not.toBe('')
    expect(el.style.getPropertyValue('--tilt-y')).not.toBe('')
  })

  it('resets tilt to 0 on mouseleave', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    mockBoundingRect(el)
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    renderHook(() => useTiltGesture(ref))

    act(() => {
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    })
    flushRaf()

    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.00')
    expect(el.style.getPropertyValue('--tilt-y')).toBe('0.00')
  })

  it('does not attach any listener when prefers-reduced-motion is set', () => {
    mockMatchMedia(true)
    const el = document.createElement('div')
    document.body.appendChild(el)
    const addSpy = vi.spyOn(el, 'addEventListener')
    const ref = { current: el } as RefObject<HTMLDivElement | null>

    renderHook(() => useTiltGesture(ref))

    expect(addSpy).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/use-tilt-gesture.test.ts`
Expected: FAIL with "Cannot find module '../../hooks/useTiltGesture'"

- [ ] **Step 3: Write minimal implementation**

Create `hooks/useTiltGesture.ts`:

```ts
'use client'

import { useEffect, useState, type RefObject } from 'react'
import {
  computeTiltFromPointer,
  computeTiltFromOrientation,
  getOrientationPermissionAPI,
} from '../lib/tilt-math'

export interface UseTiltGestureResult {
  needsPermissionPrompt: boolean
  requestPermission: () => void
}

export function useTiltGesture<T extends HTMLElement>(ref: RefObject<T | null>): UseTiltGestureResult {
  const [needsPermissionPrompt, setNeedsPermissionPrompt] = useState(false)
  const [orientationEnabled, setOrientationEnabled] = useState(false)

  useEffect(() => {
    const permissionAPI = getOrientationPermissionAPI()
    if (permissionAPI) {
      setNeedsPermissionPrompt(true)
    } else if (typeof window.DeviceOrientationEvent !== 'undefined') {
      setOrientationEnabled(true)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafScheduled = false
    let pending = { x: 0, y: 0 }

    function writeTilt(x: number, y: number) {
      pending = { x, y }
      if (rafScheduled) return
      rafScheduled = true
      requestAnimationFrame(() => {
        el!.style.setProperty('--tilt-x', pending.x.toFixed(2))
        el!.style.setProperty('--tilt-y', pending.y.toFixed(2))
        rafScheduled = false
      })
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const tilt = computeTiltFromPointer(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height
      )
      writeTilt(tilt.x, tilt.y)
    }

    function handleMouseLeave() {
      writeTilt(0, 0)
    }

    function handleTouchMove(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch) return
      const rect = el!.getBoundingClientRect()
      const tilt = computeTiltFromPointer(
        (touch.clientX - rect.left) / rect.width,
        (touch.clientY - rect.top) / rect.height
      )
      writeTilt(tilt.x, tilt.y)
    }

    function handleTouchEnd() {
      writeTilt(0, 0)
    }

    function handleOrientation(e: DeviceOrientationEvent) {
      if (e.beta === null || e.gamma === null) return
      const tilt = computeTiltFromOrientation(e.beta, e.gamma)
      writeTilt(tilt.x, tilt.y)
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)
    if (orientationEnabled) {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      if (orientationEnabled) {
        window.removeEventListener('deviceorientation', handleOrientation)
      }
    }
  }, [ref, orientationEnabled])

  function requestPermission(): void {
    const permissionAPI = getOrientationPermissionAPI()
    if (!permissionAPI) return
    permissionAPI.requestPermission().then((state) => {
      setNeedsPermissionPrompt(false)
      if (state === 'granted') setOrientationEnabled(true)
    })
  }

  return { needsPermissionPrompt, requestPermission }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/use-tilt-gesture.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add hooks/useTiltGesture.ts tests/unit/use-tilt-gesture.test.ts
git commit -m "feat: add useTiltGesture hook for mouse/touch/gyroscope tilt"
```

---

## Task 3: Composant `ProductTilt` + intégration page produit

**Files:**
- Create: `components/ProductTilt.tsx`
- Modify: `app/produit/[id]/page.tsx:36-46`

**Interfaces:**
- Consumes: `useTiltGesture` from `../hooks/useTiltGesture` (Task 2).
- Produces: `ProductTilt({ src, alt }: { src: string; alt: string })` — default export not used, named export `ProductTilt`, importé par `app/produit/[id]/page.tsx` depuis `../../../components/ProductTilt`.

- [ ] **Step 1: Create the component**

Create `components/ProductTilt.tsx`:

```tsx
'use client'

import { useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { useTiltGesture } from '../hooks/useTiltGesture'

interface ProductTiltProps {
  src: string
  alt: string
}

const CONTAINER_STYLE = {
  perspective: '800px',
  '--tilt-x': '0',
  '--tilt-y': '0',
} as CSSProperties

export function ProductTilt({ src, alt }: ProductTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { needsPermissionPrompt, requestPermission } = useTiltGesture(containerRef)

  return (
    <div
      ref={containerRef}
      className="relative aspect-square overflow-hidden rounded-3xl bg-waaw-surface-2"
      style={CONTAINER_STYLE}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-full bg-waaw-yellow/20 blur-3xl"
        style={{
          transform: 'translate3d(calc(var(--tilt-y) * -3px), calc(var(--tilt-x) * 3px), 0)',
          transition: 'transform 150ms ease-out',
        }}
      />

      <div
        className="relative h-full w-full will-change-transform"
        style={{
          transform:
            'rotateX(calc(var(--tilt-x) * 1deg)) rotateY(calc(var(--tilt-y) * 1deg)) scale(1.02)',
          transformStyle: 'preserve-3d',
          transition: 'transform 150ms ease-out',
        }}
      >
        <Image src={src} alt={alt} fill priority className="object-cover" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-soft-light"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5), transparent 60%)',
          transform: 'translate3d(calc(var(--tilt-y) * -6px), calc(var(--tilt-x) * -6px), 0)',
          transition: 'transform 150ms ease-out',
        }}
      />

      {needsPermissionPrompt && (
        <button
          type="button"
          onClick={requestPermission}
          className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-display uppercase tracking-widest text-white/80 backdrop-blur-sm"
        >
          Activer vue 3D
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire it into the product page**

In `app/produit/[id]/page.tsx`, add the import next to the existing `SizeSelector` import (line 6):

```ts
import { ProductTilt } from '../../../components/ProductTilt'
```

Replace lines 36-46 (the static image block):

```tsx
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-waaw-surface-2">
            {product.photos[activePhoto] && (
              <Image
                src={product.photos[activePhoto]}
                alt={product.nom}
                fill
                priority
                className="object-cover"
              />
            )}
          </div>
```

with:

```tsx
          {product.photos[activePhoto] ? (
            <ProductTilt src={product.photos[activePhoto]} alt={product.nom} />
          ) : (
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-waaw-surface-2" />
          )}
```

- [ ] **Step 3: Verify no regressions in existing tests**

Run: `npx vitest run`
Expected: PASS (all existing + new unit tests, no failures)

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`, open a product page (e.g. `http://localhost:3000/produit/1`) in a browser.
Expected: moving the mouse over the hero photo tilts it smoothly with a visible yellow halo and a soft moving highlight; moving the mouse away returns it to flat; on a touch device (or Chrome DevTools device toolbar with touch emulation), dragging a finger over the photo tilts it the same way.

- [ ] **Step 5: Commit**

```bash
git add components/ProductTilt.tsx "app/produit/[id]/page.tsx"
git commit -m "feat: apply 3D tilt preview to product page hero photo"
```

---

## Task 4: Visual regression e2e coverage

**Files:**
- Modify: `tests/e2e/visual.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks directly — navigates through the real app UI like `tests/e2e/purchase-flow.spec.ts` already does (`page.locator('a[href^="/produit/"]').first()`).

- [ ] **Step 1: Add the product page visual snapshot test**

In `tests/e2e/visual.spec.ts`, append after the existing `for (const path of pages)` block:

```ts
test('visual snapshot of a product page', async ({ page }) => {
  await page.goto('/catalogue')
  await page.locator('a[href^="/produit/"]').first().click()
  await expect(page.locator('h1')).toBeVisible()
  await expect(page).toHaveScreenshot('produit.png', { fullPage: true })
})
```

- [ ] **Step 2: Generate the baseline screenshot**

Run: `npx playwright test tests/e2e/visual.spec.ts --update-snapshots`
Expected: run completes, new files appear under `tests/e2e/visual.spec.ts-snapshots/produit-*.png` (one per project: chromium, mobile-320, tablet-768, desktop-1440).

- [ ] **Step 3: Verify the new test passes against the baseline**

Run: `npx playwright test tests/e2e/visual.spec.ts`
Expected: PASS, including the new "visual snapshot of a product page" test on all 4 projects.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/visual.spec.ts "tests/e2e/visual.spec.ts-snapshots"
git commit -m "test: add product page visual regression snapshot"
```

---

## Task 5: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npm run test`
Expected: PASS, no failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Run the production build (includes TypeScript type-checking)**

Run: `npm run build`
Expected: build succeeds, no type errors in `lib/tilt-math.ts`, `hooks/useTiltGesture.ts`, `components/ProductTilt.tsx`, or `app/produit/[id]/page.tsx`.

- [ ] **Step 4: Run the full e2e suite**

Run: `npx playwright test`
Expected: PASS, including `purchase-flow.spec.ts`, `admin-flow.spec.ts`, and the updated `visual.spec.ts`.

- [ ] **Step 5: Manual QA checklist**

On a deployed preview or `npm run dev` exposed over the local network (needed for real mobile sensors), open a product page with at least one photo and check:

- **Desktop (mouse):** hovering the hero photo tilts it toward the cursor with the halo/highlight moving; leaving the photo returns it to flat.
- **Android (physical device):** tilting the phone rotates the photo via the gyroscope, no permission prompt appears.
- **iOS (physical device, Safari):** the "Activer vue 3D" button appears; tapping it triggers the native permission dialog; accepting makes the photo respond to tilting the phone; declining leaves mouse/touch-drag as the only input.
- **Fallback drag:** with gyroscope permission declined (or on a browser without `DeviceOrientationEvent`), dragging a finger across the photo tilts it manually.
- **Reduced motion:** with the OS-level "reduce motion" setting enabled, the photo stays static and flat regardless of mouse/touch/tilt input.

- [ ] **Step 6: Commit (only if any of the above required fixes)**

```bash
git add -A
git commit -m "fix: address issues found in full verification pass"
```

If nothing needed fixing, skip this step — there is nothing to commit.
