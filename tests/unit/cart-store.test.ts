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
