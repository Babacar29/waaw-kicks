# Waaw Kicks — PWA vente sneakers Sénégal — Design

Date: 2026-08-02

## Contexte

Waaw Kicks est une nouvelle marque de vente de sneakers (homme/femme/bébé) au Sénégal. Le projet part de zéro (aucun code existant). Objectif du MVP : valider le marché rapidement avec un catalogue vitrine et un flux de commande simple, avant d'investir dans un e-commerce complet avec paiement en ligne.

## Portée du MVP

- Catalogue produits par catégorie (Homme / Femme / Bébé)
- Panier
- Checkout : formulaire client → commande enregistrée en base → lien WhatsApp pré-rempli généré vers le numéro de la marque
- Panel admin simple (mot de passe unique) pour gérer produits, variantes (pointure/couleur/stock), et consulter les commandes
- Pas de paiement en ligne, pas de compte client, pas de multi-utilisateurs admin — hors scope MVP

## Stack technique

- Next.js (App Router), déployé sur Vercel, PWA (manifest + service worker, cache offline du catalogue déjà visité)
- Neon Postgres (via intégration Vercel) pour les données
- Vercel Blob pour les photos produits
- Admin protégé par mot de passe unique (session cookie signée), pas de table utilisateur

## Direction visuelle

Streetwear urbain bold : couleurs vives, typographie impactante, ambiance sneaker culture jeune (type Nike SNKRS / StockX). Interface en français avec touches de wolof dans les textes marketing/boutons (cohérent avec le nom "Waaw Kicks").

## Modèle de données

### Product
- id
- nom
- description
- catégorie (homme / femme / bébé)
- marque
- prix
- photos[] (URLs Vercel Blob)
- actif (bool)

### Variant
- id
- product_id (FK)
- pointure
- couleur
- quantité_stock

### Order
- id
- nom_client
- téléphone
- adresse
- items[] (snapshot produit/variante/quantité/prix au moment de la commande)
- total
- statut (nouvelle / confirmée / livrée / annulée)
- créée_le

### Admin
- Pas de table. Mot de passe hashé stocké en variable d'environnement. Session admin via cookie signé après login.

## Flux de commande

1. Client ajoute produits (avec pointure/couleur choisies, selon stock disponible) au panier
2. Au checkout, remplit nom, téléphone, adresse (validation champs obligatoires)
3. Validation stock server-side (le stock a pu changer depuis l'ajout au panier) — si rupture, message clair et blocage/retrait de l'item concerné
4. Commande enregistrée en base (statut "nouvelle")
5. Génération d'un lien WhatsApp pré-rempli (produits, quantités, total, coordonnées client) vers le numéro de la marque
6. Redirection vers WhatsApp — le gestionnaire confirme et gère paiement (cash/Wave à la livraison) et livraison manuellement
7. Le gestionnaire met à jour le statut de la commande dans le panel admin

## Pages publiques

- `/` — Accueil : hero streetwear bold, catégories mises en avant, produits vedettes
- `/catalogue?categorie=X` — Grille produits, filtres pointure/couleur/prix
- `/produit/[id]` — Fiche produit : galerie photos, sélecteur pointure/couleur (dispo selon stock variant), ajout panier
- `/panier` — Résumé, quantités modifiables
- `/checkout` — Formulaire client → enregistrement commande → génération lien WhatsApp → redirection

Composants partagés : `ProductCard`, `CategoryNav`, `CartDrawer`, `SizeSelector`

## Panel admin

- `/admin/login` — mot de passe unique
- `/admin/produits` — liste, créer/éditer produit + variantes (pointure/couleur/stock), upload photos vers Blob
- `/admin/commandes` — liste des commandes, changement de statut

## Gestion des erreurs

- Stock épuisé entre ajout panier et checkout → validation server-side, message clair, retrait ou blocage de l'item
- Upload photo échoué (taille/format invalide) → validation côté admin avant envoi vers Blob, message explicite
- Mot de passe admin incorrect → message générique (pas de détail), rate limiting léger anti-brute-force
- Formulaire checkout incomplet → validation des champs obligatoires (nom, téléphone, adresse) avant soumission

## Tests

- **Unitaires** : calcul du total panier, génération du message WhatsApp, validation de stock
- **Intégration** : routes API (création commande, création produit, upload photo)
- **E2E (Playwright)** : parcours achat complet (catalogue → panier → checkout → lien WhatsApp généré), parcours admin (login → créer produit → apparition dans le catalogue)
- **Visuel** : breakpoints 320 / 768 / 1024 / 1440 sur accueil, fiche produit, checkout
