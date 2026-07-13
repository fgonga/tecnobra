<!--
 -  Tecnobra — Hub de relatórios (padrão CardSelectorHub).
-->
<template>
  <CardSelectorHub :cards="cards" card-col-class="col-6 col-md-4 col-lg-3" dense />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import CardSelectorHub from '@components/CardSelectorHub.vue'
import {
  IconUsers,
  IconUserCheck,
  IconTool,
  IconPackages,
  IconChartBar,
} from '@tabler/icons-vue'

import Presencas from './presencas.vue'
import Visitantes from './visitantes.vue'
import Inventario from './inventario.vue'
import Materiais from './materiais.vue'
import Desempenho from './desempenho.vue'

const cards = [
  {
    key: 'presencas',
    title: 'Presenças',
    description: 'Frequência por trabalhador, empresa e período.',
    icon: markRaw(IconUsers),
    color: 'blue',
    component: markRaw(Presencas),
  },
  {
    key: 'visitantes',
    title: 'Visitantes',
    description: 'Registos de visitas, filtráveis por data e motivo.',
    icon: markRaw(IconUserCheck),
    color: 'purple',
    component: markRaw(Visitantes),
  },
  {
    key: 'inventario',
    title: 'Inventário',
    description: 'Equipamentos por estado, em uso, danificados e desaparecidos.',
    icon: markRaw(IconTool),
    color: 'orange',
    component: markRaw(Inventario),
  },
  {
    key: 'materiais',
    title: 'Materiais',
    description: 'Orçado vs entregue vs consumido, com desvios.',
    icon: markRaw(IconPackages),
    color: 'teal',
    component: markRaw(Materiais),
  },
  {
    key: 'desempenho',
    title: 'Desempenho',
    description: 'Produtividade por trabalhador e métrica (ex.: m² de alvenaria/dia).',
    icon: markRaw(IconChartBar),
    color: 'green',
    component: markRaw(Desempenho),
  },
]
</script>
