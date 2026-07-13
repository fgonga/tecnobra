/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

export default [
  // Rotas de autenticação (sem layout)
  {
    component: () => import('@/modules/central/features/auth/login.vue'),
    name: 'login',
    path: '/central/login',
    meta:{
      middlewares:["guest"]
    }
  },
  {
    component: () => import('@/modules/central/features/auth/forgot.vue'),
    name: 'forgot',
    path: '/central/forgot',
    meta:{
      middlewares:["guest"]
    }
  },
  {
    path: '/central',
    component: () => import('@components/CentralLayout.vue'),
    children: [
      {
        component: () => import('@/modules/central/features/auth/password.vue'),
        name: 'central.auth.password',
        path: '/central/auth/password',
        meta:{
          middlewares:["auth"]
        }
      }
    ],
  },
  {
    component: () => import('@/modules/central/features/auth/reset.vue'),
    name: 'central.auth.reset',
    path: '/central/auth/reset',
    meta:{
      middlewares:["auth"]
    }
  }
]


