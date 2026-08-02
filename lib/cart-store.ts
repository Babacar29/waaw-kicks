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
