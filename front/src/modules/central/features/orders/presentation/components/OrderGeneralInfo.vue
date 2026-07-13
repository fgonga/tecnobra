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
  <div class="order-details">
    <LoadingState v-if="order === null" />
    <EmptyState v-else-if="!order" message="Nenhuma encomenda selecionada" />

    <div v-else class="order-content">
       <PaymentPortableSidebar ref="paymentSidebar" />
      <PageHeader
        :title="order.code"
        :status-label="statusLabel"
        :status="order.status"
        :meta-items="headerMetaItems"
      />

      <!-- Informações principais -->
      <InfoSection title="Informações Principais" :icon="IconFileText">
        <ResponsiveGrid columns="3">
          <InfoCard label="Curso" :value="order.course?.name || '—'" />
          <InfoCard label="Código" :value="order.code" :icon="IconHash" />
          <InfoCard label="Quantidade" :value="order.quantity" :icon="IconTag" />

        </ResponsiveGrid>
      </InfoSection>
      <InfoSection title="Datas" :icon="IconClock">
        <ResponsiveGrid columns="4">
          <InfoCard label="Criado em" :value="formatDate(order.created_at)" />
          <InfoCard label="Pendente em" :value="formatDate(order.pending_at)" />
          <InfoCard label="Concluído em" :value="formatDate(order.completed_at)" />
          <InfoCard label="Cancelado em" :value="formatDate(order.canceled_at)" />
        </ResponsiveGrid>
      </InfoSection>
      <!-- Descontos -->
      <InfoSection title="Pagamentos" :icon="IconDiscount2">
        <ResponsiveGrid columns="4">
          <InfoCard label="V/Un" :value="toMoney(order.amount_due/order.quantity)" />
          <InfoCard label="Valor Bruto" :value="toMoney(order.amount_due)" />
          <InfoCard label="Descontos" :value="toMoney(order.discount_total)" />
          <InfoCard label="Valor pago" :value="toMoney(order.amount_paid)" />
        </ResponsiveGrid>
      </InfoSection>
      <!-- Descontos -->
      <InfoSection title="Descontos" :icon="IconDiscount2">
        <ResponsiveGrid columns="4">
          <InfoCard v-if="order.coupon" label="Cupom" :value="order.coupon?.code || '—'" />
          <InfoCard label="Promoção" :value="toMoney(order.discount_promotion)" />
          <InfoCard label="Cupom" :value="toMoney(order.discount_coupon)" />
          <InfoCard label="Cartão CEU" :value="toMoney(order.discount_card)" />
          <InfoCard label="Total de Descontos" :value="toMoney(order.discount_total)" />
        </ResponsiveGrid>
      </InfoSection>
      <InfoSection title="Cartão CEU" :icon="IconDiscount2" v-if="order.discount_card">
        <ResponsiveGrid columns="4">
          <InfoCard label="Estudante" :value="order.card_name" />
          <InfoCard label="Percentagem" :value="toMoney(order.card_percentage)" />
        </ResponsiveGrid>
      </InfoSection>

      <!-- Estudantes -->
      <InfoSection title="Estudantes" :icon="IconUsersGroup" v-if="order.customers?.length">
        <div class="table-responsive">
          <table class="table   table-bordered table-borderless table-striped">
            <thead>
            <tr>
              <th class="bg-primary text-white">#</th>
              <th class="bg-primary text-white">Nome</th>
              <th class="bg-primary text-white">Email</th>
              <th class="bg-primary text-white">Telefone</th>
              <th class="bg-primary text-white">Estado</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(student, i) in order.customers" :key="i">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ student.name }}</strong></td>
              <td>{{ student.email }}</td>
              <td>{{ student.phone || '—' }}</td>
              <td>
            <span
              class="badge"
              :class="{
                'bg-green text-green-fg': student.status === 'paid',
                'bg-yellow text-yellow-fg': student.status === 'pending',
                'bg-red text-red-fg': student.status === 'canceled'
              }"
            >
              {{ student.status }}
            </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </InfoSection>


      <!-- Pagamentos -->
      <InfoSection title="Pagamentos da Encomenda" :icon="IconCreditCard" v-if="order.payments?.length">
        <div class="table-responsive">
          <table class="table  table-bordered table-borderless table-striped">
            <thead>
            <tr >
              <th class="bg-primary text-white">#</th>
              <th class="bg-primary text-white">Código</th>
              <th class="bg-primary text-white">Valor</th>
              <th class="bg-primary text-white">Telefone</th>
              <th class="bg-primary text-white">Pago em</th>
              <th class="bg-primary text-white">Resposta EMIS</th>
              <th class="bg-primary text-white">Estado</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(payment, i) in order.payments" :key="i">
              <td>{{ i + 1 }}</td>

              <td role="button"><strong @click="openPayment(payment.id)">{{ payment.code }}</strong></td>
              <td class="text-primary">{{ toMoney(payment.amount) }}</td>

              <td>{{ payment.phone || '—' }}</td>
              <td>{{ formatDate(payment.paid_at) }}</td>
              <td>{{ normalize(payment?.response)?.responseStatus?.message ?? 'SEM INFORMAÇÃO' }}</td>
              <td>
            <span
              class="badge"
              :class="{
                'bg-green text-green-fg': payment.status === 'paid',
                'bg-yellow text-yellow-fg': payment.status === 'pending',
                'bg-red text-red-fg': payment.status === 'failed'
              }"
            >
              {{ payment.status }}
            </span>
              </td>

            </tr>


            </tbody>
          </table>
        </div>
      </InfoSection>

    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconHash,
  IconTag,
  IconTags,
  IconClock,
  IconFileText,
  IconBook,
  IconUsersGroup,
  IconDiscount2,
  IconCurrency,
  IconCreditCard
} from '@tabler/icons-vue'

import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import JsonViewerSection from '@components/JsonViewerSection.vue'
import {computed, ref} from 'vue'
import type { IOrder } from '../../application/dtos'
import type { useCrud } from '@common/presentation/hooks/useCrud'
import toMoney from "@common/application/utils/money.ts"
import  {normalize} from "@common/application/utils/normalize.ts"
import PaymentPortableSidebar from "../../../payments/presentation/components/PaymentPortableSidebar.vue"
const props = defineProps<{
  order?: IOrder | null
  crudService: ReturnType<typeof useCrud>
}>()
const paymentSidebar = ref()
function openPayment(id: number) {
  paymentSidebar.value.open(id)
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
const expandedIndex = ref<number | null>(null)
const toggleDetails = (i: number) => {
  expandedIndex.value = expandedIndex.value === i ? null : i
}
const statusLabel = computed(() => {
  switch (props.order?.status) {
    case 'completed': return 'Concluído'
    case 'pending': return 'Pendente'
    case 'canceled': return 'Cancelada'
    default: return '—'
  }
})

const headerMetaItems = computed(() => [
  { label: 'ID Interno', value: props.order?.id || '-', icon: IconHash },
  { label: 'Estado', value: statusLabel.value, icon: IconTag },
  { label: 'Curso', value: props.order?.course?.name || '—', icon: IconBook }
])

</script>

<style scoped>
.order-details {
  max-width: 100%;
}
.students-list,
.payments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.student-item,
.payment-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.payment-item strong {
  color: #1e293b;
}
.badge {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
</style>
