# Admin UI overhaul

Match admin panel to storefront's dark editorial design system (waaw-black/surface/yellow, Bebas Neue display font, lucide icons). Constraint: e2e test `tests/e2e/admin-flow.spec.ts` requires input[type=password], button text "Se connecter", placeholder "Nom", placeholder "Prix (FCFA)", button text "Créer" — keep these exact.

- [x] `components/admin/ui.tsx` — shared primitives (Input, Textarea, Select, Button, Badge, Field)
- [x] `components/admin/AdminShell.tsx` — sidebar/topbar nav, active link state, logout
- [x] `app/api/admin/logout/route.ts` — clear cookie
- [x] Redesign `app/admin/login/page.tsx`
- [x] Redesign `app/admin/(protected)/layout.tsx` to use AdminShell
- [x] Redesign `app/admin/(protected)/produits/page.tsx`
- [x] Redesign `app/admin/(protected)/produits/nouveau/page.tsx`
- [x] Redesign `app/admin/(protected)/produits/[id]/page.tsx`
- [x] Redesign `app/admin/(protected)/commandes/page.tsx`
- [x] tsc --noEmit, lint, `next build`, visual QA (desktop + mobile screenshots), e2e selector audit

## Review

Admin now shares the storefront's dark editorial system (waaw-black/surface, yellow accent, Bebas Neue display font, lucide icons) instead of raw unstyled Tailwind defaults.

Found and fixed one real bug while doing visual QA: the storefront `<Header>` (with cart/panier link) was rendering on every `/admin/*` route too, since it lived in the root layout — admin pages showed two stacked navbars. Fixed by extracting `ConditionalHeader` (hides on `/admin/*`) so admin owns its own nav via `AdminShell`.

Also caught a mobile overflow bug in the products table (`overflow-hidden` on the wrapper was clipping the Statut/Gérer columns instead of allowing scroll) — changed to `overflow-x-auto` with `min-w` on the table.

Added a small justified scope addition beyond pure restyle: `/api/admin/logout` route, since a real nav shell needs a working logout affordance and none existed.

e2e test `tests/e2e/admin-flow.spec.ts` selectors (input[type=password], text "Se connecter"/"Nouveau produit"/"Créer", placeholders "Nom"/"Prix (FCFA)") were preserved exactly — not run live here since it mutates the real product catalog against the shared Neon DB; recommend running `npm run test:e2e` in CI/normal flow to confirm.
