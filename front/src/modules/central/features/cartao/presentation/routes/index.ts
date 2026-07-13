// Cartão digital público — acessível sem autenticação (ligação enviada
// por e-mail/WhatsApp; o QR na portaria também abre esta página).
export default [
  {
    component: () => import('../views/public.vue'),
    name: 'cartao-publico',
    path: '/c/:token',
  },
]
