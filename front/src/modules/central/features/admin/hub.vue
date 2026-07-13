<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <CardSelectorHub :cards="visibleCards" card-col-class="col-6 col-md-4 col-lg-3" dense />
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue'
import CardSelectorHub from '@components/CardSelectorHub.vue'
import { IconActivity, IconUsers, IconShieldLock } from '@tabler/icons-vue'
import { useAuthStore } from '@common/presentation/stores/auth_store.ts'

import Users from '@/modules/central/features/users/presentation/views/index.vue'
import Profiles from '@/modules/central/features/profiles/presentation/views/index.vue'
import Events from '@/modules/central/features/events.vue'

const auth = useAuthStore()

interface AdminCard {
  key: string
  title: string
  description: string
  icon: any
  color?: string
  component: any
  rule?: string
}

const cards: AdminCard[] = [
  {
    key: 'users',
    title: 'Utilizadores',
    description: 'Gestão de contas, acesso e estado.',
    icon: markRaw(IconUsers),
    color: 'purple',
    component: markRaw(Users),
  },
  {
    key: 'profiles',
    title: 'Perfis',
    description: 'Perfis de acesso e permissões por funcionalidade.',
    icon: markRaw(IconShieldLock),
    color: 'indigo',
    component: markRaw(Profiles),
  },
  {
    key: 'events',
    title: 'Eventos',
    description: 'Histórico de eventos e disparos para webhooks.',
    icon: markRaw(IconActivity),
    color: 'teal',
    component: markRaw(Events),
  },
]

// Cards sem `rule` são sempre visíveis; os que têm `rule` exigem a permissão correspondente.
const visibleCards = computed(() => {
  const userRules = auth.rules || []
  if (userRules.includes('*')) return cards
  return cards.filter((c) => !c.rule || userRules.includes(c.rule))
})
</script>
