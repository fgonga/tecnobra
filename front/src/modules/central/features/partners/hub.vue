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
import { IconUsersGroup, IconTicket } from '@tabler/icons-vue'

import Influencers from '@/modules/central/features/influencers/presentation/views/index.vue'
import Coupons from '@/modules/central/features/coupons/presentation/views/index.vue'

const cards = [
  {
    key: 'influencers',
    title: 'Parceiros',
    description: 'Gestão de influenciadores, comissões e estado.',
    icon: markRaw(IconUsersGroup),
    color: 'indigo',
    component: markRaw(Influencers),
  },
  {
    key: 'coupons',
    title: 'Cupões',
    description: 'Códigos promocionais, descontos e validade.',
    icon: markRaw(IconTicket),
    color: 'pink',
    component: markRaw(Coupons),
  },
]
</script>
