<!--
 -  Tecnobra — Hub de definições.
-->
<template>
  <CardSelectorHub :cards="cards" card-col-class="col" dense />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import CardSelectorHub from '@components/CardSelectorHub.vue'
import { IconAdjustments, IconBell } from '@tabler/icons-vue'

import GeneralConfigs from '@/modules/central/features/configs.vue'
import NotificationsView from '@/modules/central/features/notifications/presentation/views/index.vue'

const cards = [
  {
    key: 'general',
    title: 'Gerais',
    description: 'Nome da organização e alertas inteligentes.',
    icon: markRaw(IconAdjustments),
    color: 'blue',
    component: markRaw(GeneralConfigs),
  },
  {
    key: 'notifications',
    title: 'Notificações',
    description: 'Templates de SMS, WhatsApp e e-mail por evento.',
    icon: markRaw(IconBell),
    color: 'orange',
    component: markRaw(NotificationsView),
  },
]
</script>
