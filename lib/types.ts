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
