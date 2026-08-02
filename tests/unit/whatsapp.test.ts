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
