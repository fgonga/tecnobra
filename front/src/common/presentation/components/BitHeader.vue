<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<template>
  <header class="navbar navbar-expand-md d-print-none" data-bs-theme="dark">
    <div class="container-xl">
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu" aria-controls="navbar-menu" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
        <img src="/logo.png" alt="" width="110">
      </div>
      <div class="navbar-nav flex-row order-md-last">
       <div class="nav-item d-none d-md-flex me-3">
          <div class="btn-list">
            <button href="#" class="btn btn-5" target="_blank" rel="noreferrer">
              <IconHelp class="me-2" size="20"/>
              Documentação
            </button>
          </div>
        </div>
        <div class="d-flex me-2 align-items-center">
          <button
            class="btn btn-icon btn-ghost-secondary"
            :title="themeStore.isDark ? 'Modo claro' : 'Modo escuro'"
            @click="themeStore.toggle()"
          >
            <IconSun v-if="themeStore.isDark" size="20" />
            <IconMoon v-else size="20" />
          </button>
        </div>
        <div class="nav-item dropdown">
          <a href="#" class="nav-link d-flex lh-1 p-0 px-2" data-bs-toggle="dropdown" aria-label="Open user menu">
            <img class="avatar avatar-sm" :src="'https://ui-avatars.com/api/?name='+authStore.user.name"></img>
            <div class="d-none d-xl-block ps-2" v-if="authStore.user">
              <div>{{ authStore.user?.name || 'username' }}</div>
              <div class="mt-1 small text-secondary">{{ userRoles.find(r => r.value === authStore.user.role)?.label || '-' }}</div>
            </div>
          </a>
          <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
            <RouterLink :to="{name:'central.auth.password'}" class="dropdown-item">Meu Perfil</RouterLink>
            <span role="button" @click="logout" class="dropdown-item">Sair</span>
          </div>
        </div>
      </div>
    </div>
  </header>
  <BitNav/>
</template>
<script setup lang="ts">
import BitNav from "@components/BitNav.vue"
import { IconHelp, IconSun, IconMoon } from "@tabler/icons-vue"
import { RouterLink } from "vue-router"
import { useAuthStore } from "@common/presentation/stores/auth_store"
import { useThemeStore } from "@common/presentation/stores/theme_store"
import {userRoles} from "../../../modules/central/features/users/domain/constants/roles";
const authStore = useAuthStore()
const themeStore = useThemeStore()
import { useRouter } from 'vue-router'
const router = useRouter()
const logout = async () => {
  try {
    await authStore.clearAuth()
    await router.push('/central/login')
  } catch (e) {
    console.error("Erro ao terminar sessão:", e)
  }
}
</script>
