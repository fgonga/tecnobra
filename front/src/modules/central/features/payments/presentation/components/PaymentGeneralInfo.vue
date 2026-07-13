<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
-->
<template>
  <div class="payment-details">
    <template  v-if="props.busy.value.show">
      <LoadingState />
    </template>
    <template  v-else-if="payment">
      <PageHeader
        :title="payment.code"
        :status-label="payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Falhou'"
        :status="payment.status"
        :meta-items="headerMetaItems"
      />
      <InfoSection title="Informações Principais" :icon="IconFileText">
        <ResponsiveGrid columns="4">
          <InfoCard label="Telefone" :value="payment.phone" />
          <InfoCard label="Código" :value="payment.code" :icon="IconHash" />
          <InfoCard label="Valor" :value="formatAmount(payment.amount)" :icon="IconTags" />
          <InfoCard label="Estado" :value="statusLabel" :icon="IconTag" />
        </ResponsiveGrid>
      </InfoSection>
      <InfoSection title="Datas" :icon="IconClock">
        <ResponsiveGrid columns="4">
          <InfoCard label="Data de criação" :value="formatDate(payment.created_at)" />
          <InfoCard label="Data de pagamento" :value="formatDate(payment.paid_at)" />
          <InfoCard label="Data de cancelamento" :value="formatDate(payment.failed_at)" />
          <InfoCard label="Data de expiração" :value="formatDate(payment.expired_at)" />
        </ResponsiveGrid>
      </InfoSection>
      <InfoSection
        title="Resposta do Processador"
        :icon="IconFileText"
        v-if="payment?.response && Object.keys(payment.response).length"
      >
        <JsonViewerSection :key="payment.code" :data="payment.response" />
      </InfoSection>
    </template>

    <template v-if="!payment">
      <EmptyState message="Nenhum pagamento selecionado" />
    </template>

  </div>
</template>

<script setup lang="ts">
import {
  IconHash,
  IconTag,
  IconTags,
  IconClock,
  IconFileText
} from '@tabler/icons-vue'

import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import { computed } from 'vue'
import type { IPayment } from '../../application/dtos'
import type { useCrud } from '@common/presentation/hooks/useCrud'
import JsonViewerSection from '@components/JsonViewerSection.vue'
const props = defineProps<{
  payment?: IPayment | null
  crudService: ReturnType<typeof useCrud>
  busy:any
}>()
const isObject = (value: any): boolean => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const formatValue = (val: any) => {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não'
  if (typeof val === 'number') return val.toString()
  if (typeof val === 'string') {
    if (val.startsWith('{') || val.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(val), null, 2)
      } catch {
        return val
      }
    }
    return val
  }
  return JSON.stringify(val, null, 2)
}
const formatDate = (date?: string | null) => {
  if (!date) return '—'
  const d = new Date(date)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  const hora = String(d.getHours()).padStart(2, '0')
  const minuto = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`
}

const formatAmount = (amount: string | number) =>
  `${Number(amount).toFixed(2)} AOA`

const statusLabel = computed(() => {
  switch (props.payment?.status) {
    case 'paid': return 'Pago'
    case 'pending': return 'Pendente'
    case 'failed': return 'Falhou'
    default: return '—'
  }
})

const headerMetaItems = computed(() => [
  {
    label: 'ID Interno',
    value: props.payment?.id || '-',
    icon: IconHash
  },
  {
    label: 'Estado',
    value: statusLabel.value,
    icon: IconTag
  }
])
</script>


