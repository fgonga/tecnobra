// Portaria — vista própria (fora do layout central), otimizada para
// telemóvel/tablet na entrada do estaleiro.
export default [
  {
    component: () => import('../views/index.vue'),
    name: 'portaria',
    path: '/portaria',
    meta: { middlewares: ['auth', 'role:portaria'] },
  },
]
