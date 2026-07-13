export default [
  {
    component: () =>
      import("@/modules/central/features/utils/presentation/views/unauthorized.vue"),
    name: "unauthorized",
    path: "/central/unauthorized",
  },
  {
    path: "/central",
    component: () => import("@components/CentralLayout.vue"),
    children: [
      {
        component: () => import("@/modules/central/features/dashboard.vue"),
        name: "dashboard",
        path: "dashboard",
        meta: { middlewares: ["auth", "role:dashboard"] },
      },
      {
        component: () =>
          import("@/modules/central/features/obras/presentation/views/index.vue"),
        name: "obras",
        path: "obras",
        meta: { middlewares: ["auth", "role:obras"] },
      },
      {
        component: () =>
          import("@/modules/central/features/empresas/presentation/views/index.vue"),
        name: "empresas",
        path: "empresas",
        meta: { middlewares: ["auth", "role:empresas"] },
      },
      {
        component: () =>
          import("@/modules/central/features/trabalhadores/presentation/views/index.vue"),
        name: "trabalhadores",
        path: "trabalhadores",
        meta: { middlewares: ["auth", "role:trabalhadores"] },
      },
      {
        component: () =>
          import("@/modules/central/features/presencas/presentation/views/index.vue"),
        name: "presencas",
        path: "presencas",
        meta: { middlewares: ["auth", "role:portaria"] },
      },
      {
        component: () =>
          import("@/modules/central/features/equipamentos/presentation/views/index.vue"),
        name: "equipamentos",
        path: "equipamentos",
        meta: { middlewares: ["auth", "role:equipamentos"] },
      },
      {
        component: () =>
          import("@/modules/central/features/materiais/presentation/views/index.vue"),
        name: "materiais",
        path: "materiais",
        meta: { middlewares: ["auth", "role:materiais"] },
      },
      {
        component: () =>
          import("@/modules/central/features/materiais/presentation/views/stock.vue"),
        name: "stock",
        path: "stock",
        meta: { middlewares: ["auth", "role:materiais"] },
      },
      {
        component: () =>
          import("@/modules/central/features/guias/presentation/views/index.vue"),
        name: "guias",
        path: "guias",
        meta: { middlewares: ["auth", "role:materiais"] },
      },
      {
        component: () =>
          import("@/modules/central/features/consumos/presentation/views/index.vue"),
        name: "consumos",
        path: "consumos",
        meta: { middlewares: ["auth", "role:materiais"] },
      },
      {
        component: () =>
          import("@/modules/central/features/visitantes/presentation/views/index.vue"),
        name: "visitantes",
        path: "visitantes",
        meta: { middlewares: ["auth", "role:visitantes"] },
      },
      {
        component: () =>
          import("@/modules/central/features/veiculos/presentation/views/index.vue"),
        name: "veiculos",
        path: "veiculos",
        meta: { middlewares: ["auth", "role:veiculos"] },
      },
      {
        component: () =>
          import("@/modules/central/features/users/presentation/views/index.vue"),
        name: "users",
        path: "users",
        meta: { middlewares: ["auth", "role:users"] },
      },
      {
        component: () =>
          import("@/modules/central/features/profiles/presentation/views/index.vue"),
        name: "profiles",
        path: "profiles",
        meta: { middlewares: ["auth", "role:users"] },
      },
      {
        component: () => import("@/modules/central/features/admin/hub.vue"),
        name: "admin",
        path: "admin",
        meta: { middlewares: ["auth", "role:configs"] },
      },
      {
        component: () => import("@/modules/central/features/security/hub.vue"),
        name: "security",
        path: "security",
        meta: { middlewares: ["auth", "role:users"] },
      },
      {
        component: () => import("@/modules/central/features/settings/hub.vue"),
        name: "settings",
        path: "settings",
        meta: { middlewares: ["auth", "role:configs"] },
      },
      {
        component: () => import("@/modules/central/features/configs.vue"),
        name: "configs",
        path: "configs",
        meta: { middlewares: ["auth", "role:configs"] },
      },
      {
        component: () => import("@/modules/central/features/events.vue"),
        name: "events",
        path: "events",
        meta: { middlewares: ["auth", "role:configs"] },
      },
    ],
  },
];
