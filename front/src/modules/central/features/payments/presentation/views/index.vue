<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->

<template>
  <div class="page-body">
    <OrderPortableSidebar ref="orderSidebar" />
    <PaymentPortableSidebar ref="paymentSidebar" />
    <div class="container-xl">
      <div id="payments-print-area">
        <TablePage
          :withActions="true"
          :options="options"
          showHeader
          :showDelete="false"
          :showEdit="false"
          title="Gestão"
          subtitle="Pagamentos"
          :tableHeaders="tableHeaders"
          :sideBarShowComponent="PaymentSidebar"
          :modalAddComponent="ModalNew"
          :modalEditComponent="ModalNew"
          :perPage="10"
          :crudService="crudService"
          :with-timestamps="false"
          :filter-schema="filterSchema"
        >
          <template #options>
            <BDropdownItem @click="exportPaymentsExcel">
              <IconFileTypeXls size="15" class="me-2" /> Exportar Excel
            </BDropdownItem>
            <BDropdownItem @click="exportPaymentsPdf">
              <IconFileTypePdf size="15" class="me-2" /> Exportar PDF
            </BDropdownItem>
          </template>

          <template #cell(status)="row">
            <span v-if="row.value === 'paid'" class="badge bg-green text-white">Pago</span>
            <span v-else-if="row.value === 'pending'" class="badge bg-yellow text-dark"
              >Pendente</span
            >
            <span v-else-if="row.value === 'failed'" class="badge bg-red text-white">Falhado</span>
            <span v-else-if="row.value === 'refunded'" class="badge bg-purple text-white"
              >Devolvido</span
            >
            <span v-else class="badge bg-gray text-white">-</span>
          </template>

          <template #cell(is_paid)="row">
            <span v-if="row.value" class="badge bg-success text-white">Sim</span>
            <span v-else class="badge bg-danger text-white">Não</span>
          </template>

          <template #cell(amount)="row">
            <div class="d-flex flex-column lh-sm">
              <span>{{ toMoney(row.value) }}</span>
              <small v-if="Number(row.item.commission_amount) > 0" class="text-purple">
                Com.: {{ toMoney(row.item.commission_amount) }}
              </small>
            </div>
          </template>

          <template #cell(response)="row"></template>

          <template #cell(reference)="row">
            <div v-if="row.value" class="d-flex flex-column lh-sm">
              <span>{{ row.value }}</span>
              <small v-if="row.item.payment_type === 'ref'" class="text-muted">
                Ent.: {{ normalize(row.item?.response)?.reference?.entity ?? '—' }}
              </small>
              <small
                v-else-if="
                  row.item.payment_type === 'express' || row.item.payment_type === 'aexpress'
                "
                class="text-muted"
              >
                Telefone
              </small>
            </div>
            <span v-else class="text-muted">—</span>
          </template>

          <template #cell(payment_type)="row">
            <span v-if="row.value === 'aexpress' || row.value === 'express'">Express</span>
            <span v-else-if="row.value === 'ref'">Referência</span>
            <span v-else-if="row.value === 'qr'">QR</span>
            <span v-else class="text-muted">{{ row.value || '-' }}</span>
          </template>

          <template #cell(code)="row">
            <div class="d-flex flex-column lh-sm">
              <span class="text-link" @click="openPayment(row.item.id)">{{ row.value }}</span>
              <small
                v-if="row.item.order"
                class="text-link text-muted"
                @click="openOrder(row.item.order.id)"
              >
                {{ row.item.order.code }}
              </small>
            </div>
          </template>

          <template #cell(customer_name)="row">
            <div class="d-flex flex-column lh-sm">
              <span>{{ row.item.order?.customers?.[0]?.name || '-' }}</span>
              <small v-if="row.item.phone" class="text-muted">{{ row.item.phone }}</small>
            </div>
          </template>

          <template #cell(expired_at)="row">
            <template v-if="row.item.payment_type === 'ref' && row.item.status === 'pending'">
              <div class="d-flex flex-column lh-sm">
                <span :class="isExpired(row.value) ? 'text-red' : ''">{{
                  formatDate(row.value)
                }}</span>
                <small :class="isExpired(row.value) ? 'text-red' : 'text-muted'">{{
                  expiryHint(row.value)
                }}</small>
              </div>
            </template>
            <span v-else class="text-muted">—</span>
          </template>

          <template #cell(created_at)="row">
            <div class="d-flex flex-column lh-sm">
              <span>{{ formatDate(row.value) }}</span>
              <template v-if="row.item.failed_at">
                <small class="text-muted">{{ formatDate(row.item.failed_at) }}</small>
                <small class="text-muted">{{
                  normalize(row.item?.response)?.responseStatus?.message ?? 'SEM INFORMAÇÃO'
                }}</small>
              </template>
              <small v-else-if="row.item.paid_at" class="text-muted">{{
                formatDate(row.item.paid_at)
              }}</small>
            </div>
          </template>
        </TablePage>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BDropdownItem } from 'bootstrap-vue-next'
import TablePage from '@components/TablePage.vue'
import type { ITableOption } from '@components/TablePage.vue'
import type { TableFieldRaw } from 'bootstrap-vue-next'
import { PaymentsService } from '../../domain/service/PaymentsService'
import PaymentSidebar from '../components/PaymentSidebar.vue'
import ModalNew from './create.vue'
import type { FilterSchema } from '@common/presentation/hooks/types'
import { useCrud } from '@common/presentation/hooks/useCrud'
import { ref } from 'vue'
import OrderPortableSidebar from '../../../orders/presentation/components/OrderPortableSidebar.vue'
import PaymentPortableSidebar from '../components/PaymentPortableSidebar.vue'
import { normalize } from '@common/application/utils/normalize.ts'
import { IconFileTypeXls, IconFileTypePdf } from '@tabler/icons-vue'
import { exportToExcel, exportToPdf } from '@/common/application/utils/export'

const orderSidebar = ref()
const paymentSidebar = ref()

function openOrder(id: number) {
  orderSidebar.value.open(id)
}
function openPayment(id: number) {
  paymentSidebar.value.open(id)
}

const tableHeaders: TableFieldRaw[] = [
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'payment_type', label: 'Tipo', sortable: true },
  { key: 'reference', label: 'Referência', sortable: true },
  { key: 'code', label: 'Pagamento / Encomenda', sortable: true },
  { key: 'customer_name', label: 'Cliente / Telefone', sortable: false },
  { key: 'amount', label: 'Pago / Comissão', sortable: true },
  { key: 'created_at', label: 'Solicitação / Actualização', sortable: true },
  { key: 'expired_at', label: 'Expira', sortable: true },
]

const filterSchema: FilterSchema = {
  fields: [
    {
      field: 'customer_name',
      label: 'Cliente',
      type: 'text',
      operator: 'like',
      placeholder: 'Nome do cliente...',
      columnClass: 'col-md-12',
    },
    {
      field: 'status',
      label: 'Estado',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Pago', value: 'paid' },
        { label: 'Pendente', value: 'pending' },
        { label: 'Falhado', value: 'failed' },
        { label: 'Devolvido', value: 'refunded' },
      ],
      columnClass: 'col-md-6',
    },
    {
      field: 'payment_type',
      label: 'Tipo',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Express', value: 'express' },
        { label: 'Referência', value: 'ref' },
        { label: 'QR Code', value: 'qr' },
      ],
      columnClass: 'col-md-6',
    },

    {
      field: 'phone',
      label: 'Telefone',
      type: 'text',
      operator: 'like',
      placeholder: 'Pesquisar telefone...',
      columnClass: 'col-md-6',
    },
    {
      field: 'code',
      label: 'Código',
      type: 'text',
      operator: 'like',
      placeholder: 'Código do pagamento...',
      columnClass: 'col-md-6',
    },
    {
      field: 'start|created_at',
      label: 'Data solicitação (início)',
      type: 'datetime',
      operator: '>=',
      columnClass: 'col-md-6',
    },
    {
      field: 'end|created_at',
      label: 'Data solicitação (fim)',
      type: 'datetime',
      operator: '<=',
      columnClass: 'col-md-6',
    },
    {
      field: 'min|amount',
      label: 'Montante (mín.)',
      type: 'number',
      operator: '>=',
      placeholder: '0.00',
      columnClass: 'col-md-6',
    },
    {
      field: 'max|amount',
      label: 'Montante (máx.)',
      type: 'number',
      operator: '<=',
      placeholder: '0.00',
      columnClass: 'col-md-6',
    },
  ],
  columnClass: 'col-md-12',
  module: 'Payments',
}

const crudService = useCrud({
  service: PaymentsService,
  relations: ['order'],
  searchable: ['code', 'phone', 'status', 'customer_name', 'reference'],
})

const options: ITableOption[] = []

const toMoney = (v: number | string) => {
  const num = typeof v === 'string' ? parseFloat(v) : v
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num || 0)
}

const formatDate = (value: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isExpired = (value: string | null) =>
  value ? new Date(value).getTime() <= Date.now() : false

const expiryHint = (value: string | null) => {
  if (!value) return ''
  const diffMs = new Date(value).getTime() - Date.now()
  if (diffMs <= 0) return 'Expirado'
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `expira em ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `expira em ${hours} h`
  const days = Math.round(hours / 24)
  return `expira em ${days} dia${days > 1 ? 's' : ''}`
}

async function exportPaymentsExcel() {
  try {
    const res = await PaymentsService.index({ ...crudService.filters, perPage: 1000, page: 1 })
    const statusLabel: any = {
      paid: 'Pago',
      pending: 'Pendente',
      failed: 'Falhado',
      refunded: 'Devolvido',
    }
    const rows = (res.data?.data || []).map((p: any) => ({
      Código: p.code,
      Estado: statusLabel[p.status] || p.status,
      Tipo: p.payment_type || '-',
      'Valor (Kz)': Number(p.amount),
      'Comissão (Kz)': Number(p.commission_amount ?? 0),
      Telefone: p.phone || '-',
      'Solicitado em': p.created_at || '',
      'Expira em': p.payment_type === 'ref' && p.expired_at ? formatDate(p.expired_at) : '',
    }))
    exportToExcel(rows, 'pagamentos', 'Pagamentos')
  } catch {
    alert('Erro ao exportar')
  }
}

async function exportPaymentsPdf() {
  const el = document.getElementById('payments-print-area')
  if (!el) return
  await exportToPdf(el, 'pagamentos', 'landscape')
}
</script>
