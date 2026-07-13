// types.ts
export interface PaymentMethod {
  image: string
  code: string
  name: string
  description: string
  // `disabled` is no longer hardcoded — it is derived at runtime from the
  // gateway configuration (express_enabled / ref_enabled / qr_enabled) loaded
  // from /checkout/promotions. Kept optional for backward compatibility.
  disabled?: boolean
}

// Catálogo de métodos suportados. A disponibilidade (ativo/inativo) e o método
// padrão são decididos pela configuração do gateway, não por este ficheiro.
const paymentMethods: PaymentMethod[] = [
  {
    image: 'express4.png',
    code: 'express',
    name: 'Express',
    description: 'Autorize no Multicaixa Express',
  },
  {
    image: 'express3.png',
    code: 'ref',
    name: 'Referência',
    description: 'Multicaixa Express ou ATM',
  },
  {
    image: 'express2.png',
    code: 'qr',
    name: 'QR Code',
    description: 'Escaneie codigo QR',
  },
]

export default paymentMethods
