# Design: Aperçu 3D tilt sur la page produit

Date: 2026-08-03
Statut: Approuvé

## Objectif

Quand l'utilisateur ouvre une fiche produit, la photo hero de la sneaker doit réagir en temps réel au mouvement (souris sur desktop, inclinaison du téléphone ou glissement du doigt sur mobile) pour donner l'impression d'un objet 3D réel entre les mains, sans nécessiter de nouveaux assets (pas de photos multi-angles, pas de modèle 3D).

## Portée

- S'applique uniquement à la photo hero de `/produit/[id]`.
- Les miniatures (sélecteur de photo) et les `ProductCard` de la grille/catalogue restent inchangés.
- Aucun changement de schéma DB, aucun nouveau champ produit.

## Architecture

### `hooks/useTiltGesture.ts`

Hook client qui unifie les sources d'input et expose l'état de tilt courant sans provoquer de re-render React à chaque frame (écriture directe de CSS custom properties sur un ref DOM via `requestAnimationFrame`).

Responsabilités :
- Desktop — écoute `mousemove`/`mouseleave` sur le container ; calcule l'angle à partir de la position du curseur relative au centre de l'élément.
- Mobile — au premier `touchstart` sur le container :
  - Si `typeof DeviceOrientationEvent.requestPermission === 'function'` (iOS 13+), affiche un bouton discret "Activer vue 3D" qui déclenche la demande de permission au tap (requis : ne peut pas être auto-déclenché hors geste utilisateur).
  - Permission accordée (ou plateforme sans permission requise, ex. Android) → écoute `deviceorientation`, dérive le tilt de `beta`/`gamma`, lissage (moyenne glissante légère) pour éviter le jitter capteur.
  - Permission refusée ou API indisponible → fallback sur `touchmove` (drag au doigt) pour piloter le tilt manuellement.
- Clamp de l'angle de sortie à ±12° sur les deux axes.
- Retour à l'état neutre (0, 0) avec transition douce sur `mouseleave`/`touchend`/perte de focus.
- Si `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → le hook n'attache aucun listener et retourne un état neutre fixe.
- Cleanup complet de tous les listeners au unmount.

API :
```ts
function useTiltGesture(ref: RefObject<HTMLElement>): {
  needsPermissionPrompt: boolean
  requestPermission: () => void
}
```
(l'état de tilt lui-même n'est pas retourné en state React — il est écrit directement en custom properties CSS sur `ref.current` pour éviter le re-render par frame)

### `components/ProductTilt.tsx`

Composant client qui remplace le bloc image statique actuel dans `/produit/[id]/page.tsx`. Reçoit `src` et `alt`, utilise `useTiltGesture` en interne, rend 3 couches superposées dans un container `perspective`.

Props :
```ts
{ src: string; alt: string }
```

## Couches visuelles

Toutes les couches n'animent que `transform`, `opacity`, `filter` (compositor-friendly, conforme aux règles de perf du projet).

1. **Halo ambiant** — `div` en arrière-plan, `radial-gradient` `waaw-yellow` flouté (`blur-3xl`), translate en parallaxe à ~30% de l'intensité du tilt principal, direction opposée à l'image pour renforcer la profondeur.
2. **Image produit** — container avec `perspective`, image en `rotateX/rotateY` (valeurs issues des custom properties CSS écrites par le hook), léger `scale` additionnel proportionnel à l'amplitude du tilt.
3. **Reflet spéculaire** — overlay `radial-gradient` blanc/jaune très doux, `mix-blend-mode: soft-light`, opacité faible, position glissant selon l'angle inverse du tilt pour simuler une source de lumière qui se déplace sur le cuir/mesh.

## Accessibilité & performance

- Respect strict de `prefers-reduced-motion` (tilt entièrement désactivé, image statique).
- Aucun appel réseau supplémentaire, aucun nouvel asset à uploader côté admin.
- Mises à jour throttlées par `requestAnimationFrame`, un seul listener actif à la fois selon la source détectée.
- Le bouton "Activer vue 3D" n'apparaît que si la permission gyroscope est requise et pas encore tranchée — sinon aucun élément UI additionnel.
- Pas de dépendance nouvelle (implémentation avec APIs DOM natives + Tailwind existant).

## Plan de test

- **Unit** (`vitest`) — logique de calcul d'angle du hook, isolée de l'accès DOM/API navigateur (mock des events souris/orientation), y compris le clamp ±12° et le comportement `prefers-reduced-motion`.
- **Visual regression** (`playwright`) — capture de `/produit/[id]` à 320/768/1440px, état neutre (pas de simulation d'interaction dans le test, juste rendu correct des 3 couches).
- **Manuel** — vérification iOS (prompt permission + tilt gyroscope), Android (tilt gyroscope direct), desktop (mouse), fallback touch-drag si permission refusée, `prefers-reduced-motion` activé au niveau OS.

## Hors scope

- Spin 360° multi-photos.
- Modèle 3D réel (GLB/glTF).
- Application de l'effet aux `ProductCard` de la grille.
