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
        component: () =>
          import("@/modules/central/features/influencers/presentation/views/index.vue"),
        name: "influencers",
        path: "influencers",
        meta: {
          middlewares: ["auth", "role:influencers"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/courses/presentation/views/index.vue"),
        name: "courses",
        path: "courses",
        meta: {
          middlewares: ["auth", "role:courses"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/coupons/presentation/views/index.vue"),
        name: "coupons",
        path: "coupons",
        meta: {
          middlewares: ["auth", "role:coupons"],
        },
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
        component: () => import("@/modules/central/features/reports/hub.vue"),
        name: "reports",
        path: "reports",
        meta: { middlewares: ["auth", "role:reports"] },
      },
      {
        component: () => import("@/modules/central/features/partners/hub.vue"),
        name: "partners",
        path: "partners",
        meta: { middlewares: ["auth", "role:influencers"] },
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
      {
        component: () =>
          import("@/modules/central/features/report/presentation/views/day/index.vue"),
        name: "report.day",
        path: "report/day",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/report/presentation/views/month/index.vue"),
        name: "report.month",
        path: "report/month",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/report/presentation/views/courses/index.vue"),
        name: "report.courses",
        path: "report/courses",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/report/presentation/views/payment-types/index.vue"),
        name: "report.payment-types",
        path: "report/payment-types",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/report/presentation/views/influencer/index.vue"),
        name: "report.influencer",
        path: "report/influencer",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () => import("@/modules/central/features/dashboard.vue"),
        name: "dashboard",
        path: "dashboard",
        meta: {
          middlewares: ["auth", "role:dashboard"],
        },
      },

      {
        component: () =>
          import("@/modules/central/features/orders/presentation/views/index.vue"),
        name: "orders",
        path: "orders",
        meta: {
          middlewares: ["auth", "role:orders"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/payments/presentation/views/index.vue"),
        name: "payments",
        path: "payments",
        meta: {
          middlewares: ["auth", "role:payments"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/refunds/presentation/views/index.vue"),
        name: "refunds",
        path: "refunds",
        meta: {
          middlewares: ["auth", "role:orders"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/report/presentation/views/general/index.vue"),
        name: "report.general",
        path: "report/general",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/settlements/presentation/views/index.vue"),
        name: "settlements",
        path: "settlements",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/report/presentation/views/influencer-detail/index.vue"),
        name: "report.influencer-detail",
        path: "report/influencer-detail",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/insights/presentation/views/index.vue"),
        name: "insights",
        path: "insights",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/comparison/presentation/views/index.vue"),
        name: "comparison",
        path: "comparison",
        meta: {
          middlewares: ["auth", "role:reports"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/recovery/presentation/views/index.vue"),
        name: "recovery",
        path: "recovery",
        meta: {
          middlewares: ["auth", "role:orders"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/helpdesk/presentation/views/index.vue"),
        name: "helpdesk",
        path: "helpdesk",
        meta: { middlewares: ["auth", "role:configs"] },
      },
      {
        component: () =>
          import("@/modules/central/features/invoices/presentation/views/index.vue"),
        name: "invoices",
        path: "invoices",
        meta: {
          middlewares: ["auth", "role:invoices"],
        },
      },
      {
        component: () =>
          import("@/modules/central/features/playground/presentation/views/index.vue"),
        name: "playground",
        path: "playground",
        meta: {
          middlewares: ["auth", "role:playground"],
        },
      },
    ],
  },
];
