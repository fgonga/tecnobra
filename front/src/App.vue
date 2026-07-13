<template>
<!--   <div
      v-if="isDev"
      class="dev-banner"
    >
      MODO DESENVOLVIMENTO
    </div>-->
  <div class="page">


    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@common/presentation/stores/auth_store'
import {
  syncCrispUser,
  resetCrispSession,
  setCrispVisibility,
} from '@common/application/utils/crisp'

const isDev = import.meta.env.VITE_DEV === 'true'

// O Crisp só aparece no back-office (/central); no checkout fica escondido em todos os steps
const route = useRoute()
watch(
  () => route.path,
  (path) => setCrispVisibility(path.startsWith('/central')),
  { immediate: true },
)

// Mantém o Crisp com os dados do utilizador autenticado (login, reload e logout)
const authStore = useAuthStore()
watch(
  () => authStore.user,
  (user, prev) => {
    if (user) syncCrispUser(user)
    else if (prev) resetCrispSession()
  },
  { immediate: true, deep: true },
)
</script>

<style scoped>
.dev-banner {
  background: #c62828;
  color: #fff;
  text-align: center;
  padding: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  position:fixed;
 bottom:0px;
  width: 100%;
  z-index:9999;
}
</style>
