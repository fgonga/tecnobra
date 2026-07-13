<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <CardSelectorHub :cards="cards" />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import CardSelectorHub from '@components/CardSelectorHub.vue'
import { IconUsers, IconShieldLock } from '@tabler/icons-vue'

import Users from '@/modules/central/features/users/presentation/views/index.vue'
import Profiles from '@/modules/central/features/profiles/presentation/views/index.vue'

const cards = [
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
]
</script>
