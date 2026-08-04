CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  categorie TEXT NOT NULL CHECK (categorie IN ('homme', 'femme', 'enfant', 'unisex')),
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
