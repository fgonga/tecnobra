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
