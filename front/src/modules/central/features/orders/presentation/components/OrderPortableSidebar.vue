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
  <OrderSidebar
    :crudService="crudService"
    :is-open="isOpen"
    :id="currentId"
    :initial-tab="initialTab"
    @close="close"
  />
</template>

<script setup lang="ts">
import { ref, defineExpose } from 'vue'
import OrderSidebar from './OrderSidebar.vue'
import { OrdersService } from '../../domain/service/OrdersService'
import { useCrud } from '@common/presentation/hooks/useCrud'
const props = defineProps({
  initialTab: { type: Number, default: 0 },
})

const isOpen = ref(false)
const currentId = ref<number | string | null>(null)

const crudService = useCrud({
  service: OrdersService,
  searchable: ['code', 'status'],
})

function open(id: number | string | null = null) {
  currentId.value = id
  isOpen.value = true
}

function close() {
  isOpen.value = false
  currentId.value = null
}

// expõe métodos ao pai
defineExpose({ open, close })
</script>
