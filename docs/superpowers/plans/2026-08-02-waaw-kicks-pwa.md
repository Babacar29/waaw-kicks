# Waaw Kicks PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js PWA for Waaw Kicks — a sneaker catalog (homme/femme/bébé) with cart, WhatsApp-based checkout, and a password-protected admin panel for managing products, variants, and orders.

**Architecture:** Next.js App Router app deployed on Vercel. Neon Postgres for products/variants/orders. Vercel Blob for product photos. Client-side cart state (Zustand) persisted to localStorage. No customer accounts — checkout writes an order row then redirects to a pre-filled WhatsApp link. Admin area behind a single shared password, session via signed cookie, no user table.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, Zustand, `@neondatabase/serverless`, `@vercel/blob`, `jose` (cookie signing), Vitest (unit/integration), Playwright (E2E + visual).

## Global Constraints

- Interface entièrement en français, avec touches de wolof dans les textes marketing/boutons (per spec).
- Aucun compte client, aucune authentification acheteur (per spec).
- Pas de paiement en ligne dans ce MVP (per spec).
- Stock suivi par variante (pointure + couleur) avec quantité exacte (per spec).
- Style visuel streetwear urbain bold (per spec) — couleurs vives, typographie impactante.
- Breakpoints à tester : 320, 768, 1024, 1440 (per spec).

---

## File Structure

```
waaw-kicks/
├── app/
│   ├── layout.tsx                     — root layout, manifest link, fonts
│   ├── globals.css                    — Tailwind base + design tokens
│   ├── page.tsx                       — accueil
│   ├── catalogue/page.tsx             — grille produits + filtres
│   ├── produit/[id]/page.tsx          — fiche produit
│   ├── panier/page.tsx                — panier
│   ├── checkout/page.tsx              — formulaire + génération lien WhatsApp
│   ├── admin/
│   │   ├── layout.tsx                 — guard: redirige vers /admin/login si pas de session
│   │   ├── login/page.tsx
│   │   ├── produits/page.tsx          — liste produits
│   │   ├── produits/nouveau/page.tsx  — créer produit
│   │   ├── produits/[id]/page.tsx     — éditer produit + variantes
│   │   └── commandes/page.tsx         — liste commandes + changement statut
│   └── api/
│       ├── products/route.ts          — GET (liste), POST (créer, admin only)
│       ├── products/[id]/route.ts     — GET, PUT (admin only)
│       ├── orders/route.ts            — POST (créer commande, valide stock)
│       ├── orders/[id]/route.ts       — PATCH (changer statut, admin only)
│       ├── upload/route.ts            — POST photo vers Vercel Blob (admin only)
│       └── admin/login/route.ts       — POST vérifie mot de passe, pose cookie
├── lib/
│   ├── db.ts                          — client Neon + query helper
│   ├── schema.sql                     — DDL products/variants/orders
│   ├── types.ts                       — Product, Variant, Order, CartItem
│   ├── cart-store.ts                  — Zustand store (add/remove/update qty)
│   ├── whatsapp.ts                    — buildWhatsAppMessage(), buildWhatsAppLink()
│   └── admin-auth.ts                  — signSession(), verifySession(), requireAdmin()
├── components/
│   ├── ProductCard.tsx
│   ├── CategoryNav.tsx
│   ├── CartDrawer.tsx
│   └── SizeSelector.tsx
├── public/
│   ├── manifest.json
│   └── icons/icon-192.png, icon-512.png
├── tests/
│   ├── unit/cart-store.test.ts
│   ├── unit/whatsapp.test.ts
│   ├── integration/orders-api.test.ts
│   ├── integration/products-api.test.ts
│   └── e2e/purchase-flow.spec.ts
│   └── e2e/admin-flow.spec.ts
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

### Task 1: Scaffold Next.js project with Tailwind and test tooling

**Files:**
- Create: `waaw-kicks/` (via `create-next-app`)
- Create: `waaw-kicks/vitest.config.ts`
- Create: `waaw-kicks/playwright.config.ts`
- Modify: `waaw-kicks/package.json` (add test scripts)

**Interfaces:**
- Produces: working `npm run dev`, `npm run test`, `npm run test:e2e` commands for all later tasks.

- [ ] **Step 1: Scaffold the app**

```bash
cd /Users/user/StudioProjects/waaw-kicks
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```

When prompted, accept defaults.

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
npm install zustand @neondatabase/serverless @vercel/blob jose
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```

- [ ] **Step 3: Create Vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Create Playwright config**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-320', use: { viewport: { width: 320, height: 800 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
  ],
})
```

- [ ] **Step 5: Add test scripts to package.json**

Add under `"scripts"`:

```json
"test": "vitest run",
"test:e2e": "playwright test"
```

- [ ] **Step 6: Verify dev server boots**

Run: `npm run dev &` then `curl -sf http://localhost:3000 > /dev/null && echo OK`
Expected: `OK`. Then stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, Vitest, Playwright"
```

---

### Task 2: Database schema and Neon connection helper

**Files:**
- Create: `lib/schema.sql`
- Create: `lib/db.ts`
- Create: `lib/types.ts`
- Test: `tests/integration/db.test.ts`

**Interfaces:**
- Produces: `sql` tagged-template query function from `lib/db.ts`, and TypeScript types `Product`, `Variant`, `Order`, `OrderItem`, `CartItem` from `lib/types.ts` used by every later task touching data.

- [ ] **Step 1: Write schema DDL**

```sql
-- lib/schema.sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  categorie TEXT NOT NULL CHECK (categorie IN ('homme', 'femme', 'bebe')),
  marque TEXT NOT NULL DEFAULT '',
  prix INTEGER NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pointure TEXT NOT NULL,
  couleur TEXT NOT NULL,
  quantite_stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  nom_client TEXT NOT NULL,
  telephone TEXT NOT NULL,
  adresse TEXT NOT NULL,
  items JSONB NOT NULL,
  total INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'nouvelle'
    CHECK (statut IN ('nouvelle', 'confirmee', 'livree', 'annulee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Write the Neon connection helper**

```typescript
// lib/db.ts
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Lazy init: calling neon() at module load time throws at build time
// if DATABASE_URL isn't set yet (e.g. first deploy before provisioning).
// Deferring to first call keeps `next build` safe.
let _client: NeonQueryFunction<false, false> | null = null

export const sql: NeonQueryFunction<false, false> = ((...args: Parameters<NeonQueryFunction<false, false>>) => {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    _client = neon(process.env.DATABASE_URL)
  }
  return _client(...args)
}) as NeonQueryFunction<false, false>
```

- [ ] **Step 3: Write shared types**

```typescript
// lib/types.ts
export type Categorie = 'homme' | 'femme' | 'bebe'
export type StatutCommande = 'nouvelle' | 'confirmee' | 'livree' | 'annulee'

export interface Variant {
  id: number
  product_id: number
  pointure: string
  couleur: string
  quantite_stock: number
}

export interface Product {
  id: number
  nom: string
  description: string
  categorie: Categorie
  marque: string
  prix: number
  photos: string[]
  actif: boolean
  variants?: Variant[]
}

export interface OrderItem {
  product_id: number
  variant_id: number
  nom: string
  pointure: string
  couleur: string
  prix: number
  quantite: number
}

export interface Order {
  id: number
  nom_client: string
  telephone: string
  adresse: string
  items: OrderItem[]
  total: number
  statut: StatutCommande
  created_at: string
}

export interface CartItem {
  product_id: number
  variant_id: number
  nom: string
  pointure: string
  couleur: string
  prix: number
  photo: string
  quantite: number
}
```

- [ ] **Step 4: Write a smoke-test that runs the schema against a real Neon test database**

Requires `DATABASE_URL` (a Neon branch dedicated to tests) set in the environment before running.

```typescript
// tests/integration/db.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { sql } from '../../lib/db'

describe('database schema', () => {
  beforeAll(async () => {
    const ddl = fs.readFileSync(path.join(__dirname, '../../lib/schema.sql'), 'utf-8')
    for (const statement of ddl.split(';').map((s) => s.trim()).filter(Boolean)) {
      await sql(statement)
    }
  })

  it('creates products, variants, and orders tables', async () => {
    const rows = await sql(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    )
    const names = rows.map((r: { table_name: string }) => r.table_name)
    expect(names).toEqual(expect.arrayContaining(['products', 'variants', 'orders']))
  })
})
```

- [ ] **Step 5: Run test, verify it fails without DATABASE_URL, then set it and verify pass**

Run: `npm run test -- tests/integration/db.test.ts`
Expected without `DATABASE_URL`: throws `DATABASE_URL is not set`.
Set `DATABASE_URL` (Neon connection string from Vercel Postgres integration) in `.env.local`, re-run.
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/schema.sql lib/db.ts lib/types.ts tests/integration/db.test.ts
git commit -m "feat: add Postgres schema, db client, and shared types"
```

---

### Task 3: Cart store (Zustand) with unit tests

**Files:**
- Create: `lib/cart-store.ts`
- Test: `tests/unit/cart-store.test.ts`

**Interfaces:**
- Consumes: `CartItem` from `lib/types.ts`
- Produces: `useCartStore` hook with state `items: CartItem[]` and actions `addItem(item: CartItem)`, `removeItem(variant_id: number)`, `updateQuantity(variant_id: number, quantite: number)`, `clear()`, and derived `total(): number`. Used by `CartDrawer`, `/panier`, `/checkout`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/cart-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../../lib/cart-store'

const item = {
  product_id: 1, variant_id: 10, nom: 'Air Waaw', pointure: '42',
  couleur: 'Noir', prix: 25000, photo: '/x.jpg', quantite: 1,
}

describe('cart store', () => {
  beforeEach(() => useCartStore.getState().clear())

  it('adds an item', () => {
    useCartStore.getState().addItem(item)
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('merges quantity when the same variant is added twice', () => {
    useCartStore.getState().addItem(item)
    useCartStore.getState().addItem({ ...item, quantite: 2 })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantite).toBe(3)
  })

  it('removes an item by variant_id', () => {
    useCartStore.getState().addItem(item)
    useCartStore.getState().removeItem(10)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('updates quantity', () => {
    useCartStore.getState().addItem(item)
    useCartStore.getState().updateQuantity(10, 5)
    expect(useCartStore.getState().items[0].quantite).toBe(5)
  })

  it('computes total across items', () => {
    useCartStore.getState().addItem(item)
    useCartStore.getState().addItem({ ...item, variant_id: 11, prix: 10000, quantite: 2 })
    expect(useCartStore.getState().total()).toBe(25000 + 20000)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/cart-store.test.ts`
Expected: FAIL — `lib/cart-store.ts` does not exist.

- [ ] **Step 3: Implement the store**

```typescript
// lib/cart-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from './types'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  updateQuantity: (variantId: number, quantite: number) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variant_id === item.variant_id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variant_id === item.variant_id
                  ? { ...i, quantite: i.quantite + item.quantite }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variant_id !== variantId) })),
      updateQuantity: (variantId, quantite) =>
        set((state) => ({
          items: state.items.map((i) => (i.variant_id === variantId ? { ...i, quantite } : i)),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.prix * i.quantite, 0),
    }),
    { name: 'waaw-kicks-cart' }
  )
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/cart-store.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/cart-store.ts tests/unit/cart-store.test.ts
git commit -m "feat: add cart store with add/remove/update/total"
```

---

### Task 4: WhatsApp message generator with unit tests

**Files:**
- Create: `lib/whatsapp.ts`
- Test: `tests/unit/whatsapp.test.ts`

**Interfaces:**
- Consumes: `CartItem` from `lib/types.ts`
- Produces: `buildWhatsAppMessage(items: CartItem[], total: number, client: { nom: string; telephone: string; adresse: string }): string` and `buildWhatsAppLink(phoneNumber: string, message: string): string`. Used by `/checkout`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/whatsapp.test.ts
import { describe, it, expect } from 'vitest'
import { buildWhatsAppMessage, buildWhatsAppLink } from '../../lib/whatsapp'

const items = [
  { product_id: 1, variant_id: 10, nom: 'Air Waaw', pointure: '42', couleur: 'Noir', prix: 25000, photo: '', quantite: 2 },
]
const client = { nom: 'Fatou Diop', telephone: '771234567', adresse: 'Liberté 6, Dakar' }

describe('buildWhatsAppMessage', () => {
  it('includes product name, size, color, quantity and total', () => {
    const msg = buildWhatsAppMessage(items, 50000, client)
    expect(msg).toContain('Air Waaw')
    expect(msg).toContain('42')
    expect(msg).toContain('Noir')
    expect(msg).toContain('x2')
    expect(msg).toContain('50000')
    expect(msg).toContain('Fatou Diop')
    expect(msg).toContain('771234567')
    expect(msg).toContain('Liberté 6, Dakar')
  })
})

describe('buildWhatsAppLink', () => {
  it('produces a wa.me link with URL-encoded message', () => {
    const link = buildWhatsAppLink('221771112233', 'Bonjour Waaw Kicks')
    expect(link).toBe('https://wa.me/221771112233?text=Bonjour%20Waaw%20Kicks')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/whatsapp.test.ts`
Expected: FAIL — `lib/whatsapp.ts` does not exist.

- [ ] **Step 3: Implement**

```typescript
// lib/whatsapp.ts
import type { CartItem } from './types'

export function buildWhatsAppMessage(
  items: CartItem[],
  total: number,
  client: { nom: string; telephone: string; adresse: string }
): string {
  const lines = [
    'Nouvelle commande Waaw Kicks',
    '',
    ...items.map(
      (i) => `- ${i.nom} (pointure ${i.pointure}, ${i.couleur}) x${i.quantite} — ${i.prix * i.quantite} FCFA`
    ),
    '',
    `Total: ${total} FCFA`,
    '',
    `Client: ${client.nom}`,
    `Téléphone: ${client.telephone}`,
    `Adresse: ${client.adresse}`,
  ]
  return lines.join('\n')
}

export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/whatsapp.test.ts`
Expected: PASS. Note `encodeURIComponent` encodes space as `%20`, matching the test.

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp.ts tests/unit/whatsapp.test.ts
git commit -m "feat: add WhatsApp message and link generator"
```

---

### Task 5: Admin session auth (sign/verify cookie)

**Files:**
- Create: `lib/admin-auth.ts`
- Test: `tests/unit/admin-auth.test.ts`

**Interfaces:**
- Produces: `signSession(): Promise<string>`, `verifySession(token: string): Promise<boolean>`, `requireAdmin(request: Request): Promise<boolean>` (reads `admin_session` cookie from the request). Used by `app/api/admin/login/route.ts`, `app/admin/layout.tsx`, and every admin-only API route.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/admin-auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { signSession, verifySession } from '../../lib/admin-auth'

describe('admin session', () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
  })

  it('signs and verifies a valid session token', async () => {
    const token = await signSession()
    expect(await verifySession(token)).toBe(true)
  })

  it('rejects a tampered token', async () => {
    const token = await signSession()
    expect(await verifySession(token + 'x')).toBe(false)
  })

  it('rejects garbage input', async () => {
    expect(await verifySession('not-a-token')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/admin-auth.test.ts`
Expected: FAIL — `lib/admin-auth.ts` does not exist.

- [ ] **Step 3: Implement using `jose` (HS256 JWT)**

```typescript
// lib/admin-auth.ts
import { SignJWT, jwtVerify } from 'jose'

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export async function requireAdmin(request: Request): Promise<boolean> {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(/admin_session=([^;]+)/)
  if (!match) return false
  return verifySession(match[1])
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/admin-auth.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/admin-auth.ts tests/unit/admin-auth.test.ts
git commit -m "feat: add signed-cookie admin session auth"
```

---

### Task 6: Products API routes (list, detail, create) with integration tests

**Files:**
- Create: `app/api/products/route.ts`
- Create: `app/api/products/[id]/route.ts`
- Test: `tests/integration/products-api.test.ts`

**Interfaces:**
- Consumes: `sql` from `lib/db.ts`, `requireAdmin` from `lib/admin-auth.ts`, `Product`/`Variant` from `lib/types.ts`.
- Produces: `GET /api/products?categorie=homme` → `Product[]` (with `variants` joined); `GET /api/products/:id` → `Product` or 404; `POST /api/products` (admin only) → creates product, returns `Product`. Used by catalogue/product pages and admin product pages.

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/products-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST } from '../../app/api/products/route'
import { GET as GET_ONE } from '../../app/api/products/[id]/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'

describe('/api/products', () => {
  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
  })

  afterAll(async () => {
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
  })

  it('rejects creation without admin session', async () => {
    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      body: JSON.stringify({ nom: 'X', categorie: 'homme', prix: 1000 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates a product with a valid admin session', async () => {
    const token = await signSession()
    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({
        nom: 'Air Waaw', description: 'Sneaker urbaine', categorie: 'homme',
        marque: 'Waaw Kicks', prix: 25000, photos: [],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created.nom).toBe('Air Waaw')
  })

  it('lists products filtered by categorie', async () => {
    const req = new Request('http://localhost/api/products?categorie=homme')
    const res = await GET(req)
    const products = await res.json()
    expect(products.length).toBeGreaterThan(0)
    expect(products[0].categorie).toBe('homme')
  })

  it('returns 404 for an unknown product id', async () => {
    const req = new Request('http://localhost/api/products/999999')
    const res = await GET_ONE(req, { params: Promise.resolve({ id: '999999' }) })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/products-api.test.ts`
Expected: FAIL — routes do not exist.

- [ ] **Step 3: Implement `app/api/products/route.ts`**

```typescript
// app/api/products/route.ts
import { sql } from '../../../lib/db'
import { requireAdmin } from '../../../lib/admin-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorie = searchParams.get('categorie')

  const products = categorie
    ? await sql('SELECT * FROM products WHERE actif = true AND categorie = $1 ORDER BY created_at DESC', [categorie])
    : await sql('SELECT * FROM products WHERE actif = true ORDER BY created_at DESC')

  return Response.json(products)
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const { nom, description = '', categorie, marque = '', prix, photos = [] } = body

  if (!nom || !categorie || !prix) {
    return Response.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const [created] = await sql(
    `INSERT INTO products (nom, description, categorie, marque, prix, photos)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nom, description, categorie, marque, prix, photos]
  )

  return Response.json(created, { status: 201 })
}
```

- [ ] **Step 4: Implement `app/api/products/[id]/route.ts`**

```typescript
// app/api/products/[id]/route.ts
import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product] = await sql('SELECT * FROM products WHERE id = $1', [id])
  if (!product) {
    return Response.json({ error: 'Produit introuvable' }, { status: 404 })
  }
  const variants = await sql('SELECT * FROM variants WHERE product_id = $1', [id])
  return Response.json({ ...product, variants })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const { nom, description, categorie, marque, prix, photos, actif } = body

  const [updated] = await sql(
    `UPDATE products SET nom = $1, description = $2, categorie = $3, marque = $4,
     prix = $5, photos = $6, actif = $7 WHERE id = $8 RETURNING *`,
    [nom, description, categorie, marque, prix, photos, actif, id]
  )

  if (!updated) {
    return Response.json({ error: 'Produit introuvable' }, { status: 404 })
  }
  return Response.json(updated)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/integration/products-api.test.ts`
Expected: PASS (4 tests). Requires `DATABASE_URL` pointing at a test database with the schema from Task 2 applied.

- [ ] **Step 6: Commit**

```bash
git add app/api/products tests/integration/products-api.test.ts
git commit -m "feat: add products API (list, detail, create, update)"
```

---

### Task 7: Orders API route with stock validation

**Files:**
- Create: `app/api/orders/route.ts`
- Create: `app/api/orders/[id]/route.ts`
- Test: `tests/integration/orders-api.test.ts`

**Interfaces:**
- Consumes: `sql` from `lib/db.ts`, `requireAdmin` from `lib/admin-auth.ts`, `OrderItem` from `lib/types.ts`.
- Produces: `POST /api/orders` → validates each item's variant stock, decrements stock, inserts order, returns `Order` or `409` with the offending item if stock insufficient. `GET /api/orders` (admin only) → `Order[]`. `PATCH /api/orders/:id` (admin only) → updates `statut`. Used by `/checkout` and `/admin/commandes`.

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/orders-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST, GET } from '../../app/api/orders/route'
import { PATCH } from '../../app/api/orders/[id]/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'

describe('/api/orders', () => {
  let productId: number
  let variantId: number

  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql('DELETE FROM orders')
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
    const [product] = await sql(
      `INSERT INTO products (nom, categorie, prix) VALUES ('Air Waaw', 'homme', 25000) RETURNING id`
    )
    productId = product.id
    const [variant] = await sql(
      `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
       VALUES ($1, '42', 'Noir', 2) RETURNING id`,
      [productId]
    )
    variantId = variant.id
  })

  afterAll(async () => {
    await sql('DELETE FROM orders')
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
  })

  it('rejects an order exceeding available stock', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        nom_client: 'Fatou', telephone: '77xxx', adresse: 'Dakar',
        items: [{ product_id: productId, variant_id: variantId, nom: 'Air Waaw', pointure: '42', couleur: 'Noir', prix: 25000, quantite: 5 }],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('creates an order and decrements stock when stock is sufficient', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        nom_client: 'Fatou', telephone: '77xxx', adresse: 'Dakar',
        items: [{ product_id: productId, variant_id: variantId, nom: 'Air Waaw', pointure: '42', couleur: 'Noir', prix: 25000, quantite: 2 }],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const order = await res.json()
    expect(order.total).toBe(50000)

    const [variant] = await sql('SELECT quantite_stock FROM variants WHERE id = $1', [variantId])
    expect(variant.quantite_stock).toBe(0)
  })

  it('rejects listing orders without admin session', async () => {
    const res = await GET(new Request('http://localhost/api/orders'))
    expect(res.status).toBe(401)
  })

  it('updates order status with admin session', async () => {
    const [order] = await sql('SELECT id FROM orders LIMIT 1')
    const token = await signSession()
    const req = new Request(`http://localhost/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ statut: 'confirmee' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: String(order.id) }) })
    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.statut).toBe('confirmee')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/orders-api.test.ts`
Expected: FAIL — routes do not exist.

- [ ] **Step 3: Implement `app/api/orders/route.ts`**

```typescript
// app/api/orders/route.ts
import { sql } from '../../../lib/db'
import { requireAdmin } from '../../../lib/admin-auth'
import type { OrderItem } from '../../../lib/types'

export async function POST(request: Request) {
  const body = await request.json()
  const { nom_client, telephone, adresse, items } = body as {
    nom_client: string
    telephone: string
    adresse: string
    items: OrderItem[]
  }

  if (!nom_client || !telephone || !adresse || !items?.length) {
    return Response.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  for (const item of items) {
    const [variant] = await sql('SELECT quantite_stock FROM variants WHERE id = $1', [item.variant_id])
    if (!variant || variant.quantite_stock < item.quantite) {
      return Response.json(
        { error: 'Stock insuffisant', variant_id: item.variant_id },
        { status: 409 }
      )
    }
  }

  for (const item of items) {
    await sql('UPDATE variants SET quantite_stock = quantite_stock - $1 WHERE id = $2', [
      item.quantite,
      item.variant_id,
    ])
  }

  const total = items.reduce((sum, i) => sum + i.prix * i.quantite, 0)

  const [order] = await sql(
    `INSERT INTO orders (nom_client, telephone, adresse, items, total)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nom_client, telephone, adresse, JSON.stringify(items), total]
  )

  return Response.json(order, { status: 201 })
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const orders = await sql('SELECT * FROM orders ORDER BY created_at DESC')
  return Response.json(orders)
}
```

- [ ] **Step 4: Implement `app/api/orders/[id]/route.ts`**

```typescript
// app/api/orders/[id]/route.ts
import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { statut } = await request.json()

  const [updated] = await sql('UPDATE orders SET statut = $1 WHERE id = $2 RETURNING *', [statut, id])
  if (!updated) {
    return Response.json({ error: 'Commande introuvable' }, { status: 404 })
  }
  return Response.json(updated)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/integration/orders-api.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add app/api/orders tests/integration/orders-api.test.ts
git commit -m "feat: add orders API with stock validation and status updates"
```

---

### Task 8: Admin login route and photo upload route

**Files:**
- Create: `app/api/admin/login/route.ts`
- Create: `app/api/upload/route.ts`

**Interfaces:**
- Consumes: `signSession`, `requireAdmin` from `lib/admin-auth.ts`.
- Produces: `POST /api/admin/login` (body `{ password }`) → sets `admin_session` cookie, `200` or `401`. `POST /api/upload` (admin only, multipart `file`) → uploads to Vercel Blob, returns `{ url: string }`. Used by `/admin/login` and admin product forms.

- [ ] **Step 1: Implement login route**

```typescript
// app/api/admin/login/route.ts
import { signSession } from '../../../../lib/admin-auth'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = await signSession()
  const response = Response.json({ ok: true })
  response.headers.set(
    'Set-Cookie',
    `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  )
  return response
}
```

- [ ] **Step 2: Implement upload route**

```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob'
import { requireAdmin } from '../../../lib/admin-auth'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'Aucun fichier reçu' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Format non supporté (jpg, png, webp uniquement)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Fichier trop volumineux (5 Mo max)' }, { status: 400 })
  }

  const blob = await put(`products/${Date.now()}-${file.name}`, file, { access: 'public' })
  return Response.json({ url: blob.url })
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, then:
```bash
curl -s -X POST http://localhost:3000/api/admin/login -H 'Content-Type: application/json' -d '{"password":"wrong"}'
```
Expected: `{"error":"Mot de passe incorrect"}` with 401. Set `ADMIN_PASSWORD` in `.env.local` and retry with the correct value — expect `{"ok":true}` and a `Set-Cookie` header.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/login app/api/upload
git commit -m "feat: add admin login and photo upload routes"
```

---

### Task 9: Shared UI components (ProductCard, CategoryNav, SizeSelector, CartDrawer)

**Files:**
- Create: `components/ProductCard.tsx`
- Create: `components/CategoryNav.tsx`
- Create: `components/SizeSelector.tsx`
- Create: `components/CartDrawer.tsx`
- Modify: `tailwind.config.ts` (streetwear bold palette + fonts)

**Interfaces:**
- Consumes: `Product`, `Variant` from `lib/types.ts`; `useCartStore` from `lib/cart-store.ts`.
- Produces: `<ProductCard product={Product} />`, `<CategoryNav active={Categorie} />`, `<SizeSelector variants={Variant[]} onSelect={(v: Variant) => void} />`, `<CartDrawer />`. Used by all public pages in Task 10.

- [ ] **Step 1: Extend Tailwind config with bold streetwear tokens**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'waaw-black': '#0A0A0A',
        'waaw-yellow': '#FFD400',
        'waaw-red': '#E8352E',
      },
      fontFamily: {
        display: ['Arial Black', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
}
export default config
```

- [ ] **Step 2: Implement `ProductCard`**

```tsx
// components/ProductCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '../lib/types'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produit/${product.id}`}
      className="group block bg-waaw-black text-white rounded-lg overflow-hidden border border-white/10 hover:border-waaw-yellow transition-colors"
    >
      <div className="aspect-square relative bg-neutral-900">
        {product.photos[0] && (
          <Image
            src={product.photos[0]}
            alt={product.nom}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        )}
      </div>
      <div className="p-3">
        <p className="font-display uppercase text-sm tracking-wide">{product.nom}</p>
        <p className="text-waaw-yellow font-bold">{product.prix.toLocaleString('fr-FR')} FCFA</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Implement `CategoryNav`**

```tsx
// components/CategoryNav.tsx
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
```

- [ ] **Step 4: Implement `SizeSelector`**

```tsx
// components/SizeSelector.tsx
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
```

- [ ] **Step 5: Implement `CartDrawer`**

```tsx
// components/CartDrawer.tsx
'use client'

import Link from 'next/link'
import { useCartStore } from '../lib/cart-store'

export function CartDrawer() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())

  return (
    <div className="fixed bottom-4 right-4 bg-waaw-black text-white rounded-lg shadow-xl p-4 w-72 border border-white/10">
      <p className="font-display uppercase text-sm mb-2">Panier ({items.length})</p>
      <p className="text-waaw-yellow font-bold mb-3">{total.toLocaleString('fr-FR')} FCFA</p>
      <Link
        href="/panier"
        className="block text-center bg-waaw-yellow text-waaw-black font-display uppercase py-2 rounded"
      >
        Voir le panier
      </Link>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components tailwind.config.ts
git commit -m "feat: add ProductCard, CategoryNav, SizeSelector, CartDrawer components"
```

---

### Task 10: Public pages (accueil, catalogue, fiche produit, panier, checkout)

**Files:**
- Modify: `app/page.tsx`
- Create: `app/catalogue/page.tsx`
- Create: `app/produit/[id]/page.tsx`
- Create: `app/panier/page.tsx`
- Create: `app/checkout/page.tsx`

**Interfaces:**
- Consumes: `ProductCard`, `CategoryNav`, `SizeSelector`, `CartDrawer` (Task 9); `useCartStore` (Task 3); `buildWhatsAppMessage`/`buildWhatsAppLink` (Task 4); `GET /api/products`, `GET /api/products/:id`, `POST /api/orders` (Tasks 6–7).

- [ ] **Step 1: Accueil**

```tsx
// app/page.tsx
import Link from 'next/link'
import { CategoryNav } from '../components/CategoryNav'

export default function HomePage() {
  return (
    <main className="bg-waaw-black min-h-screen text-white">
      <section className="px-4 py-16 text-center">
        <h1 className="font-display uppercase text-5xl leading-tight">
          Waaw<span className="text-waaw-yellow">Kicks</span>
        </h1>
        <p className="mt-3 text-white/70">Waaw, tu vas kiffer. Sneakers Homme, Femme, Bébé.</p>
        <Link
          href="/catalogue"
          className="inline-block mt-6 bg-waaw-yellow text-waaw-black font-display uppercase px-6 py-3 rounded"
        >
          Voir le catalogue
        </Link>
      </section>
      <div className="px-4">
        <CategoryNav />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Catalogue**

```tsx
// app/catalogue/page.tsx
import { CategoryNav } from '../../components/CategoryNav'
import { ProductCard } from '../../components/ProductCard'
import type { Categorie, Product } from '../../lib/types'

async function getProducts(categorie?: string): Promise<Product[]> {
  const url = new URL('/api/products', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
  if (categorie) url.searchParams.set('categorie', categorie)
  const res = await fetch(url, { cache: 'no-store' })
  return res.json()
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>
}) {
  const { categorie } = await searchParams
  const products = await getProducts(categorie)

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <CategoryNav active={categorie as Categorie | undefined} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p className="text-white/50 mt-8">Aucun produit dans cette catégorie.</p>}
    </main>
  )
}
```

- [ ] **Step 3: Fiche produit**

```tsx
// app/produit/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { SizeSelector } from '../../../components/SizeSelector'
import { useCartStore } from '../../../lib/cart-store'
import type { Product, Variant } from '../../../lib/types'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [selected, setSelected] = useState<Variant | null>(null)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
  }, [id])

  if (!product) return <p className="text-white p-4">Chargement...</p>

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <div className="aspect-square relative bg-neutral-900 rounded-lg overflow-hidden">
        {product.photos[0] && <Image src={product.photos[0]} alt={product.nom} fill className="object-cover" />}
      </div>
      <h1 className="font-display uppercase text-2xl mt-4">{product.nom}</h1>
      <p className="text-waaw-yellow font-bold text-xl">{product.prix.toLocaleString('fr-FR')} FCFA</p>
      <p className="text-white/70 mt-2">{product.description}</p>

      <div className="mt-4">
        <SizeSelector variants={product.variants ?? []} onSelect={setSelected} />
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={() => {
          if (!selected) return
          addItem({
            product_id: product.id,
            variant_id: selected.id,
            nom: product.nom,
            pointure: selected.pointure,
            couleur: selected.couleur,
            prix: product.prix,
            photo: product.photos[0] ?? '',
            quantite: 1,
          })
        }}
        className="mt-6 w-full bg-waaw-yellow disabled:bg-white/20 disabled:text-white/50 text-waaw-black font-display uppercase py-3 rounded"
      >
        Ajouter au panier
      </button>
    </main>
  )
}
```

- [ ] **Step 4: Panier**

```tsx
// app/panier/page.tsx
'use client'

import Link from 'next/link'
import { useCartStore } from '../../lib/cart-store'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <h1 className="font-display uppercase text-2xl mb-4">Panier</h1>
      {items.length === 0 && <p className="text-white/50">Ton panier est vide.</p>}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.variant_id} className="flex items-center gap-3 border border-white/10 rounded-lg p-3">
            <div className="flex-1">
              <p className="font-display uppercase text-sm">{item.nom}</p>
              <p className="text-white/60 text-xs">{item.pointure} · {item.couleur}</p>
              <p className="text-waaw-yellow font-bold">{item.prix.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantite}
              onChange={(e) => updateQuantity(item.variant_id, Number(e.target.value))}
              className="w-14 bg-white/10 text-center rounded"
            />
            <button type="button" onClick={() => removeItem(item.variant_id)} className="text-waaw-red">
              Retirer
            </button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="mt-6">
          <p className="font-bold text-lg">Total: {total.toLocaleString('fr-FR')} FCFA</p>
          <Link
            href="/checkout"
            className="block text-center mt-3 bg-waaw-yellow text-waaw-black font-display uppercase py-3 rounded"
          >
            Passer commande
          </Link>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 5: Checkout**

```tsx
// app/checkout/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '../../lib/cart-store'
import { buildWhatsAppMessage, buildWhatsAppLink } from '../../lib/whatsapp'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total())
  const clear = useCartStore((s) => s.clear)
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.nom || !form.telephone || !form.adresse) {
      setError('Merci de remplir tous les champs.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom_client: form.nom,
        telephone: form.telephone,
        adresse: form.adresse,
        items,
      }),
    })
    setLoading(false)

    if (res.status === 409) {
      setError('Un article de ton panier n’est plus disponible en stock.')
      return
    }
    if (!res.ok) {
      setError('Une erreur est survenue, réessaie.')
      return
    }

    const message = buildWhatsAppMessage(items, total, {
      nom: form.nom,
      telephone: form.telephone,
      adresse: form.adresse,
    })
    const link = buildWhatsAppLink(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '', message)
    clear()
    router.push(link)
  }

  return (
    <main className="bg-waaw-black min-h-screen text-white px-4 py-6">
      <h1 className="font-display uppercase text-2xl mb-4">Checkout</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Nom complet"
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          className="w-full bg-white/10 rounded p-3"
        />
        <input
          placeholder="Téléphone"
          value={form.telephone}
          onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          className="w-full bg-white/10 rounded p-3"
        />
        <input
          placeholder="Adresse"
          value={form.adresse}
          onChange={(e) => setForm({ ...form, adresse: e.target.value })}
          className="w-full bg-white/10 rounded p-3"
        />
        {error && <p className="text-waaw-red">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-waaw-yellow text-waaw-black font-display uppercase py-3 rounded disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Commander sur WhatsApp'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `http://localhost:3000`, navigate Accueil → Catalogue → Fiche produit → Panier → Checkout. Confirm the WhatsApp redirect URL is well-formed (check browser address bar after submit, since no real order exists yet without seeded products — seed one manually via `POST /api/products` and `INSERT INTO variants` first).

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/catalogue app/produit app/panier app/checkout
git commit -m "feat: add public pages (accueil, catalogue, fiche produit, panier, checkout)"
```

---

### Task 11: Admin pages (login, produits, commandes)

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/produits/page.tsx`
- Create: `app/admin/produits/nouveau/page.tsx`
- Create: `app/admin/commandes/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/login`, `GET/POST /api/products`, `POST /api/upload`, `GET/PATCH /api/orders` (Tasks 6–8).

- [ ] **Step 1: Admin layout guard**

```tsx
// app/admin/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '../../lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value

  if (!token || !(await verifySession(token))) {
    redirect('/admin/login')
  }

  return <div className="bg-white min-h-screen">{children}</div>
}
```

- [ ] **Step 2: Login page**

```tsx
// app/admin/login/page.tsx
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
```

- [ ] **Step 3: Produits list page**

```tsx
// app/admin/produits/page.tsx
import Link from 'next/link'
import { sql } from '../../../lib/db'
import type { Product } from '../../../lib/types'

export default async function AdminProductsPage() {
  const products = (await sql('SELECT * FROM products ORDER BY created_at DESC')) as Product[]

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-xl">Produits</h1>
        <Link href="/admin/produits/nouveau" className="bg-black text-white px-4 py-2 rounded">
          + Nouveau produit
        </Link>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b"><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Actif</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.nom}</td>
              <td>{p.categorie}</td>
              <td>{p.prix.toLocaleString('fr-FR')} FCFA</td>
              <td>{p.actif ? 'Oui' : 'Non'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
```

- [ ] **Step 4: Nouveau produit page**

```tsx
// app/admin/produits/nouveau/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', description: '', categorie: 'homme', marque: '', prix: 0 })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let photos: string[] = []

    if (file) {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm })
      if (!uploadRes.ok) {
        const body = await uploadRes.json()
        setError(body.error)
        return
      }
      const { url } = await uploadRes.json()
      photos = [url]
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, photos }),
    })

    if (!res.ok) {
      setError('Erreur lors de la création du produit')
      return
    }
    router.push('/admin/produits')
  }

  return (
    <main className="p-6 max-w-lg">
      <h1 className="font-bold text-xl mb-4">Nouveau produit</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full border rounded p-2" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded p-2" />
        <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="w-full border rounded p-2">
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
          <option value="bebe">Bébé</option>
        </select>
        <input placeholder="Marque" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} className="w-full border rounded p-2" />
        <input type="number" placeholder="Prix (FCFA)" value={form.prix} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })} className="w-full border rounded p-2" />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Créer</button>
      </form>
    </main>
  )
}
```

- [ ] **Step 5: Commandes page**

```tsx
// app/admin/commandes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import type { Order, StatutCommande } from '../../../lib/types'

const STATUSES: StatutCommande[] = ['nouvelle', 'confirmee', 'livree', 'annulee']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetch('/api/orders').then((r) => r.json()).then(setOrders)
  }, [])

  async function updateStatus(id: number, statut: StatutCommande) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)))
  }

  return (
    <main className="p-6">
      <h1 className="font-bold text-xl mb-4">Commandes</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="border rounded p-3">
            <p className="font-bold">{o.nom_client} — {o.telephone}</p>
            <p className="text-sm text-neutral-600">{o.adresse}</p>
            <p className="mt-1">{o.total.toLocaleString('fr-FR')} FCFA</p>
            <select
              value={o.statut}
              onChange={(e) => updateStatus(o.id, e.target.value as StatutCommande)}
              className="mt-2 border rounded p-1"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, visit `/admin/produits` while logged out → confirm redirect to `/admin/login`. Log in with `ADMIN_PASSWORD`, create a product with a photo, confirm it appears in `/admin/produits` and in `/catalogue`.

- [ ] **Step 7: Commit**

```bash
git add app/admin
git commit -m "feat: add admin pages (login, produits, commandes)"
```

---

### Task 12: PWA manifest and service worker

**Files:**
- Create: `public/manifest.json`
- Modify: `app/layout.tsx`
- Create: `public/sw.js`
- Create: `app/register-sw.tsx`

**Interfaces:**
- Produces: installable PWA with offline cache of previously visited catalogue/product pages.

- [ ] **Step 1: Manifest**

```json
{
  "name": "Waaw Kicks",
  "short_name": "Waaw Kicks",
  "description": "Sneakers Homme, Femme, Bébé au Sénégal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#FFD400",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Note: generate `icon-192.png` and `icon-512.png` from the Waaw Kicks logo before shipping (placeholder solid-color PNGs are acceptable for development).

- [ ] **Step 2: Service worker (cache-first for visited pages/assets)**

```javascript
// public/sw.js
const CACHE_NAME = 'waaw-kicks-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request)
      if (cached) return cached

      try {
        const response = await fetch(event.request)
        if (response.ok) cache.put(event.request, response.clone())
        return response
      } catch {
        return cached || Response.error()
      }
    })
  )
})
```

- [ ] **Step 3: Register service worker from a client component**

```tsx
// app/register-sw.tsx
'use client'

import { useEffect } from 'react'

export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
```

- [ ] **Step 4: Wire manifest link and SW registration into root layout**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { RegisterServiceWorker } from './register-sw'

export const metadata: Metadata = {
  title: 'Waaw Kicks',
  description: 'Sneakers Homme, Femme, Bébé au Sénégal',
  manifest: '/manifest.json',
  themeColor: '#FFD400',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run build && npm run start`, open Chrome DevTools → Application → Manifest, confirm it's recognized and an "Install" prompt is available. Check Application → Service Workers shows `sw.js` activated.

- [ ] **Step 6: Commit**

```bash
git add public/manifest.json public/sw.js app/register-sw.tsx app/layout.tsx
git commit -m "feat: add PWA manifest and offline-capable service worker"
```

---

### Task 13: End-to-end tests (purchase flow, admin flow) and visual regression

**Files:**
- Create: `tests/e2e/purchase-flow.spec.ts`
- Create: `tests/e2e/admin-flow.spec.ts`
- Create: `tests/e2e/visual.spec.ts`

**Interfaces:**
- Consumes: the running app (via Playwright's `webServer` config from Task 1), seeded test data.

- [ ] **Step 1: Purchase flow E2E test**

```typescript
// tests/e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test'

test('client parcourt le catalogue, ajoute au panier, et arrive au checkout', async ({ page }) => {
  await page.goto('/catalogue?categorie=homme')
  await expect(page.locator('a').first()).toBeVisible()

  await page.locator('a').first().click()
  await expect(page.locator('h1')).toBeVisible()

  await page.locator('button:has-text("·")').first().click()
  await page.locator('button:has-text("Ajouter au panier")').click()

  await page.goto('/panier')
  await expect(page.locator('text=Total')).toBeVisible()

  await page.locator('a:has-text("Passer commande")').click()
  await expect(page).toHaveURL(/checkout/)

  await page.fill('input[placeholder="Nom complet"]', 'Fatou Diop')
  await page.fill('input[placeholder="Téléphone"]', '771234567')
  await page.fill('input[placeholder="Adresse"]', 'Liberté 6, Dakar')
  await page.locator('button:has-text("Commander sur WhatsApp")').click()

  await expect(page).toHaveURL(/wa\.me/, { timeout: 10000 })
})
```

- [ ] **Step 2: Admin flow E2E test**

```typescript
// tests/e2e/admin-flow.spec.ts
import { test, expect } from '@playwright/test'

test('admin se connecte, crée un produit, le produit apparaît au catalogue', async ({ page }) => {
  await page.goto('/admin/produits')
  await expect(page).toHaveURL(/login/)

  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD ?? 'test-admin-password')
  await page.click('button:has-text("Se connecter")')
  await expect(page).toHaveURL(/produits/)

  await page.click('text=Nouveau produit')
  await page.fill('input[placeholder="Nom"]', 'Test E2E Sneaker')
  await page.fill('input[placeholder="Prix (FCFA)"]', '30000')
  await page.click('button:has-text("Créer")')

  await expect(page).toHaveURL(/admin\/produits$/)
  await expect(page.locator('text=Test E2E Sneaker')).toBeVisible()

  await page.goto('/catalogue?categorie=homme')
  await expect(page.locator('text=Test E2E Sneaker')).toBeVisible()
})
```

- [ ] **Step 3: Visual regression across breakpoints**

```typescript
// tests/e2e/visual.spec.ts
import { test, expect } from '@playwright/test'

const pages = ['/', '/catalogue', '/checkout']

for (const path of pages) {
  test(`visual snapshot of ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveScreenshot(`${path.replace(/\//g, '_') || 'home'}.png`, {
      fullPage: true,
    })
  })
}
```

- [ ] **Step 4: Run E2E suite (seed a test product/variant first, set `ADMIN_PASSWORD`)**

Run: `npm run test:e2e`
Expected: all three spec files pass on `chromium`, `mobile-320`, `tablet-768`, `desktop-1440` projects (first run of `visual.spec.ts` generates baseline screenshots — re-run to confirm they match).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e
git commit -m "test: add E2E purchase flow, admin flow, and visual regression"
```

---

### Task 14: Admin variant management UI (added post-final-review)

**Context:** The final whole-branch review found that the admin panel has no way to add or edit product variants (pointure/couleur/quantite_stock) — an admin can create a product via `/admin/produits/nouveau` but every new product renders with all sizes disabled in `SizeSelector` until a variant row is inserted directly into the database. This makes the built product-creation flow effectively inert for a real, non-technical shop owner. This task closes that gap: a variants API and an admin page to add variants and edit their stock.

**Files:**
- Create: `app/api/products/[id]/variants/route.ts` — `POST` (create variant, admin only)
- Create: `app/api/variants/[id]/route.ts` — `PATCH` (update pointure/couleur/quantite_stock, admin only)
- Create: `app/admin/produits/[id]/page.tsx` — edit product's variants (list existing variants with editable stock, form to add a new variant)
- Test: `tests/integration/variants-api.test.ts`

**Interfaces:**
- Consumes: `sql` from `lib/db.ts`, `requireAdmin` from `lib/admin-auth.ts`, `Variant` from `lib/types.ts`.
- Produces: `POST /api/products/:id/variants` (body `{ pointure, couleur, quantite_stock }`) → creates a variant row, returns `Variant`, 201. `PATCH /api/variants/:id` (body `{ pointure?, couleur?, quantite_stock? }`) → updates the variant, returns updated `Variant`, 200, or 404 if not found. Both admin-gated (401 without session).

- [ ] **Step 1: Write the failing integration test**

```typescript
// tests/integration/variants-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '../../app/api/products/[id]/variants/route'
import { PATCH } from '../../app/api/variants/[id]/route'
import { sql } from '../../lib/db'
import { signSession } from '../../lib/admin-auth'

describe('variants API', () => {
  let productId: number

  beforeAll(async () => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-characters-long'
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
    const [product] = await sql(
      `INSERT INTO products (nom, categorie, prix) VALUES ('Air Waaw', 'homme', 25000) RETURNING id`
    )
    productId = product.id
  })

  afterAll(async () => {
    await sql('DELETE FROM variants')
    await sql('DELETE FROM products')
  })

  it('rejects variant creation without admin session', async () => {
    const req = new Request(`http://localhost/api/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify({ pointure: '42', couleur: 'Noir', quantite_stock: 5 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: String(productId) }) })
    expect(res.status).toBe(401)
  })

  it('creates a variant with a valid admin session', async () => {
    const token = await signSession()
    const req = new Request(`http://localhost/api/products/${productId}/variants`, {
      method: 'POST',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ pointure: '42', couleur: 'Noir', quantite_stock: 5 }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: String(productId) }) })
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created.quantite_stock).toBe(5)
  })

  it('updates a variant stock with a valid admin session', async () => {
    const [variant] = await sql('SELECT id FROM variants LIMIT 1')
    const token = await signSession()
    const req = new Request(`http://localhost/api/variants/${variant.id}`, {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ quantite_stock: 10 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: String(variant.id) }) })
    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.quantite_stock).toBe(10)
  })

  it('returns 404 when updating an unknown variant', async () => {
    const token = await signSession()
    const req = new Request('http://localhost/api/variants/999999', {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
      body: JSON.stringify({ quantite_stock: 1 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '999999' }) })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/variants-api.test.ts`
Expected: FAIL — routes do not exist.

- [ ] **Step 3: Implement `app/api/products/[id]/variants/route.ts`**

```typescript
// app/api/products/[id]/variants/route.ts
import { sql } from '../../../../../lib/db'
import { requireAdmin } from '../../../../../lib/admin-auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { pointure, couleur, quantite_stock } = await request.json()

  if (!pointure || !couleur || !Number.isInteger(quantite_stock) || quantite_stock < 0) {
    return Response.json({ error: 'Champs requis manquants ou invalides' }, { status: 400 })
  }

  const [variant] = await sql(
    `INSERT INTO variants (product_id, pointure, couleur, quantite_stock)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, pointure, couleur, quantite_stock]
  )

  return Response.json(variant, { status: 201 })
}
```

- [ ] **Step 4: Implement `app/api/variants/[id]/route.ts`**

```typescript
// app/api/variants/[id]/route.ts
import { sql } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/admin-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()

  const [existing] = await sql('SELECT * FROM variants WHERE id = $1', [id])
  if (!existing) {
    return Response.json({ error: 'Variante introuvable' }, { status: 404 })
  }

  const pointure = body.pointure ?? existing.pointure
  const couleur = body.couleur ?? existing.couleur
  const quantite_stock = body.quantite_stock ?? existing.quantite_stock

  if (!Number.isInteger(quantite_stock) || quantite_stock < 0) {
    return Response.json({ error: 'Quantité invalide' }, { status: 400 })
  }

  const [updated] = await sql(
    `UPDATE variants SET pointure = $1, couleur = $2, quantite_stock = $3 WHERE id = $4 RETURNING *`,
    [pointure, couleur, quantite_stock, id]
  )

  return Response.json(updated)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/integration/variants-api.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit the API**

```bash
git add app/api/products/[id]/variants app/api/variants tests/integration/variants-api.test.ts
git commit -m "feat: add variants API (create, update stock)"
```

- [ ] **Step 7: Implement the admin edit-product page**

```tsx
// app/admin/produits/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Product, Variant } from '../../../../lib/types'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ pointure: '', couleur: '', quantite_stock: 0 })
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    const res = await fetch(`/api/products/${id}`)
    setProduct(await res.json())
  }

  useEffect(() => {
    reload()
  }, [id])

  async function addVariant(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`/api/products/${id}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error)
      return
    }
    setForm({ pointure: '', couleur: '', quantite_stock: 0 })
    reload()
  }

  async function updateStock(variantId: number, quantite_stock: number) {
    await fetch(`/api/variants/${variantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantite_stock }),
    })
    reload()
  }

  if (!product) return <p className="p-6">Chargement...</p>

  return (
    <main className="p-6 max-w-lg">
      <h1 className="font-bold text-xl mb-4">{product.nom} — Variantes</h1>

      <table className="w-full text-left border-collapse mb-6">
        <thead>
          <tr className="border-b"><th>Pointure</th><th>Couleur</th><th>Stock</th></tr>
        </thead>
        <tbody>
          {(product.variants ?? []).map((v: Variant) => (
            <tr key={v.id} className="border-b">
              <td className="py-2">{v.pointure}</td>
              <td>{v.couleur}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  defaultValue={v.quantite_stock}
                  onBlur={(e) => updateStock(v.id, Number(e.target.value))}
                  className="w-20 border rounded p-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="font-bold mb-2">Ajouter une variante</h2>
      <form onSubmit={addVariant} className="space-y-3">
        <input placeholder="Pointure" value={form.pointure} onChange={(e) => setForm({ ...form, pointure: e.target.value })} className="w-full border rounded p-2" />
        <input placeholder="Couleur" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} className="w-full border rounded p-2" />
        <input type="number" min={0} placeholder="Stock" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: Number(e.target.value) })} className="w-full border rounded p-2" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Ajouter</button>
      </form>
    </main>
  )
}
```

- [ ] **Step 8: Link to the edit page from the admin produits list**

Edit `app/admin/produits/page.tsx` (from Task 11): wrap each row's `nom` cell in a `Link` to `/admin/produits/${p.id}`, or add an explicit "Gérer" link/button per row — either is acceptable, keep it a one-line change.

- [ ] **Step 9: Manual verification**

Run: `npm run dev`, log in as admin, create a product via `/admin/produits/nouveau`, navigate to `/admin/produits/:id`, add a variant, confirm it appears in the table and the stock input is editable (blur triggers the PATCH), confirm the product now shows an enabled size in `/produit/:id`'s `SizeSelector` on the public site.

- [ ] **Step 10: Commit**

```bash
git add app/admin/produits
git commit -m "feat: add admin variant management page"
```

---

## Deployment Notes (not a task — reference for whoever ships this)

- Connect the repo to Vercel, add the Neon Postgres integration (sets `DATABASE_URL` automatically), enable Vercel Blob (sets `BLOB_READ_WRITE_TOKEN` automatically).
- Set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (32+ random characters), and `NEXT_PUBLIC_WHATSAPP_NUMBER` (international format, no `+`, e.g. `221771112233`) in Vercel project environment variables.
- Run `lib/schema.sql` against the production Neon database once before first deploy.
