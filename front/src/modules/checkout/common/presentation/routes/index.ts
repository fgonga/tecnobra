export default [
  {
    component: () => import('@/modules/checkout/features/terms/TermsAndConditionsView.vue'),
    name: 'terms-and-conditions',
    path: '/terms-and-conditions',
  },
  {
    component: () => import('@/modules/checkout/features/checkout/Checkout.vue'),
    name: 'checkout',
    path: '/:course?',
  },
  {
    component: () => import('@/modules/checkout/features/checkout/Checkout.vue'),
    name: 'cart',
    path: '/cart/:order?',
  },
  {
    component: () => import('@/modules/checkout/features/checkout/print.vue'),
    name: 'print',
    path: '/print/:order?',
  },
  {
    component: () => import('@/modules/checkout/features/checkout/Test.vue'),
    name: 'test',
    path: '/test',
  }
]
