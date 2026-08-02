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
