# Home Page Editorial Redesign

## Context

Waaw Kicks public site (accueil, catalogue, produit, panier/checkout) needs a premium/top-design pass. This is the first of several page-scoped sub-projects — home page only. Existing design language (dark background, `waaw-yellow` accent, `Bebas Neue` display font, subtle noise texture) is a good base and stays. Goal is to elevate it to an editorial/scrollytelling feel without adding animation library dependencies.

Direction chosen: editorial / scrollytelling, using CSS + `IntersectionObserver` only (no GSAP).

## Scope

`app/page.tsx` only. Adds one new shared component (`Reveal`) intended for reuse on later sub-projects (catalogue, produit, panier), but no other page is touched in this pass.

## Components

### `components/Reveal.tsx` (new, client component)

Generic scroll-reveal wrapper.

- Props: `children`, optional `className`, optional `delay` (ms, default 0), optional `as` (element tag, default `div`).
- Uses `IntersectionObserver` to add a "visible" state once the element enters the viewport (~10% threshold), then disconnects (animate once, not on every scroll pass).
- Respects `prefers-reduced-motion: reduce` — when active, renders children directly with no transform/opacity transition (fully visible immediately).
- Fail-open: if `IntersectionObserver` is unavailable, content renders visible immediately (no permanently-hidden content).
- Animation: `opacity-0 translate-y-4` → `opacity-100 translate-y-0`, `transition duration-700 ease-out`, using inline `transitionDelay` from the `delay` prop for stagger.

### Home page (`app/page.tsx`)

Server component, existing data fetch (`getProducts`) unchanged. Sections top to bottom:

1. **Hero** — existing centered layout kept. Adds a second, smaller radial glow layer (offset, lower opacity) behind the title for depth. On mount (not scroll-triggered — it's above the fold), eyebrow/title/subtitle/CTA fade+translate in with staggered delays (0ms, 80ms, 160ms, 240ms) via `Reveal` with `delay` prop — reveal must trigger immediately for above-the-fold content (threshold satisfied on load since it's in viewport). CTA shadow slightly deepened.

2. **Storytelling** (new section, between hero and categories) — 2-column editorial layout (image | text) on `sm:` and up, stacked on mobile. Image: `products[0]?.photos[0]` if available, else a gradient panel (yellow/black diagonal) as fallback — no external asset. Text: eyebrow label + 2-3 sentences (French, same tone as existing hero copy — "Waaw, tu vas kiffer") about WaawKicks' identity (Sénégal, curated sneaker selection, home delivery). Wrapped in `Reveal`: image variant slides from left (`-translate-x-4` initial), text variant slides from right (`translate-x-4` initial), text delayed ~120ms after image.

3. **Catégories** — `CategoryNav` unchanged. Section wrapped in `Reveal`. Header restyled: eyebrow label + thin horizontal rule extending to the right (flex row, `flex-1 border-t border-white/10` next to the label) for an editorial section-break look.

4. **Nouveautés** — Same editorial header treatment as Catégories. Grid of `ProductCard` unchanged individually, but each card wrapped in `Reveal` with `delay={index * 50}` (capped reasonably, e.g. `Math.min(index * 50, 400)` to avoid long tails on large grids).

## Data Flow

No new data source. Storytelling section reuses the already-fetched `products` array's first element for its image — no extra query.

## Error Handling

- `Reveal`: `IntersectionObserver` unsupported → render visible, no crash.
- Storytelling image missing → gradient fallback panel, no broken image.

## Testing

- Playwright visual regression screenshots for home page at 320, 768, 1024, 1440 (extend existing visual regression setup used for the product page).
- Verify `prefers-reduced-motion: reduce` disables transform/opacity transitions (content visible, no animation).
- Existing integration tests (`tests/integration/*`) untouched — no data-layer changes.

## Out of Scope

- Catalogue, produit, panier, checkout pages (future sub-projects, same `Reveal` component will be reused there).
- Any new animation library (GSAP etc.) — explicitly rejected for this pass.
