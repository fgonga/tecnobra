import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@common/presentation/stores/auth_store.ts'
import type { User } from '@/modules/central/common/application/dtos/index.ts'

const commonModulesRoutes = import.meta.glob<{ default: RouteRecordRaw[] }>(
  '@/modules/*/common/presentation/routes/*.ts',
  { eager: true },
)
const featuresRoutes = import.meta.glob<{ default: RouteRecordRaw[] }>(
  '@/modules/*/features/*/presentation/routes/*.ts',
  { eager: true },
)
function getModuleRoutes(): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const path in commonModulesRoutes) {
    const mod = commonModulesRoutes[path]
    if (mod?.default) {
      routes.push(...mod.default)
    }
  }
  for (const path in featuresRoutes) {
    const mod = featuresRoutes[path]
    if (mod?.default) {
      routes.push(...mod.default)
    }
  }
  return routes
}
const localRoutes: RouteRecordRaw[] = [
  ...getModuleRoutes()
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: localRoutes,
})

function middlewareHandler(
  to: RouteLocationNormalized,
  user: User | null | undefined,
  rules: string[],
  routes: {
    loginRoute: string
    homeRoute: string
    unauthorizedRoute: string
  }
): string | undefined {
  const middlewares = new Set(
    Array.isArray(to.meta.middlewares) ? to.meta.middlewares : []
  )

  for (const middleware of middlewares) {
    if (middleware === 'auth' && !user) {
      return routes.loginRoute
    }

    if (middleware === 'guest' && user) {
      return routes.homeRoute
    }

    if (middleware.startsWith('role:')) {
      if (!user) return routes.loginRoute
      const requiredRole = middleware.split(':')[1]
      if (rules.includes('*')) continue
      const hasRule = rules.includes(requiredRole)
      if (!hasRule) return routes.unauthorizedRoute
    }
  }

  return undefined
}



router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const redirect = middlewareHandler(to, authStore.user, authStore.rules, {
    loginRoute: '/central/login',
    homeRoute: '/central/dashboard',
    unauthorizedRoute: '/central/unauthorized',
  })
  if (redirect) {
    return next(redirect)
  }

  next()
})


export default router
