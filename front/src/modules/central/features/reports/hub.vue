<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <CardSelectorHub :cards="cards" card-col-class="col-6 col-md-4 col-lg-3" dense />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import CardSelectorHub from '@components/CardSelectorHub.vue'
import {
  IconChartBar,
  IconCalendarEvent,
  IconCalendarMonth,
  IconBook,
  IconUsers,
  IconZoomIn,
  IconArrowsExchange,
  IconSparkles,
  IconMessage,
  IconCreditCard,
} from '@tabler/icons-vue'

import ReportGeneral from '@/modules/central/features/report/presentation/views/general/index.vue'
import ReportMessages from '@/modules/central/features/report/presentation/views/messages/index.vue'
import ReportPaymentTypes from '@/modules/central/features/report/presentation/views/payment-types/index.vue'
import ReportDay from '@/modules/central/features/report/presentation/views/day/index.vue'
import ReportMonth from '@/modules/central/features/report/presentation/views/month/index.vue'
import ReportCourses from '@/modules/central/features/report/presentation/views/courses/index.vue'
import ReportInfluencer from '@/modules/central/features/report/presentation/views/influencer/index.vue'
import ReportInfluencerDetail from '@/modules/central/features/report/presentation/views/influencer-detail/index.vue'
import Comparison from '@/modules/central/features/comparison/presentation/views/index.vue'
import Insights from '@/modules/central/features/insights/presentation/views/index.vue'

const cards = [
  {
    key: 'general',
    title: 'Geral',
    description: 'Visão consolidada de vendas e indicadores principais.',
    icon: markRaw(IconChartBar),
    color: 'blue',
    component: markRaw(ReportGeneral),
  },
  {
    key: 'day',
    title: 'Diário',
    description: 'Movimento dia-a-dia com totais e gráficos.',
    icon: markRaw(IconCalendarEvent),
    color: 'teal',
    component: markRaw(ReportDay),
  },
  {
    key: 'month',
    title: 'Mensal',
    description: 'Resumo mensal com comparação histórica.',
    icon: markRaw(IconCalendarMonth),
    color: 'cyan',
    component: markRaw(ReportMonth),
  },
  {
    key: 'courses',
    title: 'Cursos',
    description: 'Desempenho por curso: receitas, descontos e alunos.',
    icon: markRaw(IconBook),
    color: 'orange',
    component: markRaw(ReportCourses),
  },
  {
    key: 'payment-types',
    title: 'Tipos de Pagamento',
    description: 'Vendas por tipo de pagamento: resumo e detalhe diário.',
    icon: markRaw(IconCreditCard),
    color: 'green',
    component: markRaw(ReportPaymentTypes),
  },
  {
    key: 'influencer',
    title: 'Parceiros',
    description: 'Receita gerada por parceiro/influencer.',
    icon: markRaw(IconUsers),
    color: 'pink',
    component: markRaw(ReportInfluencer),
  },
  {
    key: 'influencer-detail',
    title: 'Detalhe por Curso',
    description: 'Drill-down de comissões por parceiro × curso.',
    icon: markRaw(IconZoomIn),
    color: 'purple',
    component: markRaw(ReportInfluencerDetail),
  },
  {
    key: 'comparison',
    title: 'Comparativo',
    description: 'Comparação entre períodos, cursos ou parceiros.',
    icon: markRaw(IconArrowsExchange),
    color: 'yellow',
    component: markRaw(Comparison),
  },
  {
    key: 'insights',
    title: 'Insights IA',
    description: 'Análises automáticas e recomendações geradas por IA.',
    icon: markRaw(IconSparkles),
    color: 'indigo',
    component: markRaw(Insights),
  },
  {
    key: 'messages',
    title: 'Mensagens',
    description: 'Mensagens enviadas por tipo de notificação e custos totais.',
    icon: markRaw(IconMessage),
    color: 'violet',
    component: markRaw(ReportMessages),
  },
]
</script>
