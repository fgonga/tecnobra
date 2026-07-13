<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <CardSelectorHub :cards="cards" card-col-class="col" dense />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import CardSelectorHub from '@components/CardSelectorHub.vue'
import { IconShoppingCart, IconFileInvoice, IconCreditCard, IconBell } from '@tabler/icons-vue'

import CheckoutConfigs from '@/modules/central/features/configs.vue'
import InvoicingConfigs from './invoicing.vue'
import PaymentGatewayConfigs from './payment-gateway.vue'
import NotificationsView from '@/modules/central/features/notifications/presentation/views/index.vue'

const cards = [
  {
    key: 'checkout',
    title: 'Checkout',
    description: 'Promoções, curso predefinido, taxa de plataforma e repasses.',
    icon: markRaw(IconShoppingCart),
    color: 'blue',
    component: markRaw(CheckoutConfigs),
  },
  {
    key: 'invoicing',
    title: 'Faturação',
    description: 'Dados fiscais, série, IVA e regras de emissão de documentos.',
    icon: markRaw(IconFileInvoice),
    color: 'green',
    component: markRaw(InvoicingConfigs),
  },
  {
    key: 'payment-gateway',
    title: 'Gateway de pagamento',
    description: 'Método de pagamento padrão, referências e tempo de expiração.',
    icon: markRaw(IconCreditCard),
    color: 'purple',
    component: markRaw(PaymentGatewayConfigs),
  },
  {
    key: 'notifications',
    title: 'Notificações',
    description: 'Templates de SMS e WhatsApp por evento (pagamento, matrícula…).',
    icon: markRaw(IconBell),
    color: 'orange',
    component: markRaw(NotificationsView),
  },
]
</script>
