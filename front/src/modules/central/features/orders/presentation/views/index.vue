<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body mt-5">
    <OrderPortableSidebar ref="orderSidebar" />
    <div class="container-xl">
      <div id="orders-print-area">
        <TablePage
          :withActions="true"
          :options="options"
          :showDelete="false"
          :showEdit="false"
          :tableHeaders="tableHeaders"
          :sideBarShowComponent="OrderSidebar"
          :modalAddComponent="ModalNew"
          :modalEditComponent="ModalNew"
          :perPage="10"
          :crudService="crudService"
          :with-timestamps="false"
          :filter-schema="filterSchema"
        >
          <template #options>
            <BDropdownItem @click="exportOrdersExcel">
              <IconFileTypeXls size="15" class="me-2" /> Exportar Excel
            </BDropdownItem>
            <BDropdownItem @click="exportOrdersPdf">
              <IconFileTypePdf size="15" class="me-2" /> Exportar PDF
            </BDropdownItem>
          </template>

          <!-- Estado -->
          <template #cell(status)="row">
            <span v-if="row.value === 'completed'" class="badge bg-green text-white"
              >Concluído</span
            >
            <span v-else-if="row.value === 'pending'" class="badge bg-yellow text-dark"
              >Pendente</span
            >
            <span v-else-if="row.value === 'canceled'" class="badge bg-red text-white"
              >Cancelado</span
            >
            <span v-else-if="row.value === 'refunded'" class="badge bg-purple text-white"
              >Devolvido</span
            >
            <span v-else class="badge bg-gray text-white">-</span>
          </template>

          <!-- Valores monetários -->
          <template #cell(amount_due)="row">
            {{ toMoney(row.value) }}
          </template>

          <template #cell(customers)="row">
            {{ row.value[0]?.name || '-' }} <br />
            <span class="text-secondary small">{{ row.item.course?.name }}</span>
          </template>

          <template #cell(amount_paid)="row">
            <div class="d-flex flex-column lh-sm">
              <span>{{ toMoney(row.value) }}</span>
              <small v-if="Number(row.item.commission_amount) > 0" class="text-purple">
                Com.: {{ toMoney(row.item.commission_amount) }}
              </small>
            </div>
          </template>

          <template #cell(discount_total)="row">
            <div class="d-flex flex-column lh-sm align-items-start">
              <span v-if="row.item.coupon" class="badge bg-blue-lt text-blue">{{
                row.item.coupon.code
              }}</span>
              <span v-if="Number(row.value) > 0" :class="{ 'text-muted small': row.item.coupon }">
                {{ toMoney(row.value) }}
              </span>
              <span v-else-if="!row.item.coupon" class="text-muted">—</span>
            </div>
          </template>

          <template #cell(quantity)="row">
            {{ row.value }}
          </template>

          <template #cell(code)="row">
            <span class="text-link" @click="openOrder(row.item.id)">{{ row.value }}</span>
          </template>

          <template #cell(created_at)="row">
            <div class="d-flex flex-column lh-sm">
              <span>{{ formatDate(row.value) }}</span>
              <small v-if="row.item.completed_at || row.item.canceled_at" class="text-muted">
                {{ formatDate(row.item.completed_at || row.item.canceled_at) }}
              </small>
            </div>
          </template>

          <template #cell(reference_expires_at)="row">
            <template v-if="row.value && row.item.status === 'pending'">
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
import { OrdersService } from '../../domain/service/OrdersService'
import OrderSidebar from '../components/OrderSidebar.vue'
import ModalNew from './create.vue'
import type { FilterSchema } from '@common/presentation/hooks/types'
import { useCrud } from '@common/presentation/hooks/useCrud'
import { ref } from 'vue'
import { IconFileTypeXls, IconFileTypePdf } from '@tabler/icons-vue'
import { exportToExcel, exportToPdf } from '@/common/application/utils/export'
import OrderPortableSidebar from '../components/OrderPortableSidebar.vue'
import CourseEntity from '@components/CourseEntity.vue'
import CouponEntity from '@components/entity/CouponEntity.vue'

const tableHeaders: TableFieldRaw[] = [
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'code', label: 'Código', sortable: true },
  { key: 'customers', label: 'Estudante', sortable: true },
  { key: 'amount_due', label: 'A pagar', sortable: true },
  { key: 'discount_total', label: 'Cupão / Desc', sortable: true },
  { key: 'amount_paid', label: 'Pago / Comissão', sortable: true },
  { key: 'quantity', label: 'Qtd.', sortable: true },
  { key: 'created_at', label: 'Criado / Actualizado', sortable: true },
  { key: 'reference_expires_at', label: 'Expira', sortable: false },
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
        { label: 'Concluído', value: 'completed' },
        { label: 'Pendente', value: 'pending' },
        { label: 'Cancelado', value: 'canceled' },
        { label: 'Devolvido', value: 'refunded' },
      ],
      columnClass: 'col-md-6',
    },
    {
      field: 'code',
      label: 'Código',
      type: 'text',
      operator: 'like',
      placeholder: 'Pesquisar código...',
      columnClass: 'col-md-6',
    },

    {
      field: 'course_id',
      label: 'Curso',
      type: 'entity',
      entityType: 'course',
      entityComponent: CourseEntity,
      operator: '=',
      columnClass: 'col-md-6',
    },
    {
      field: 'coupon_id',
      label: 'Cupão',
      type: 'entity',
      entityType: 'coupon',
      entityComponent: CouponEntity,
      operator: '=',
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
      field: 'min|amount_due',
      label: 'Total a pagar (mín.)',
      type: 'number',
      operator: '>=',
      placeholder: '0.00',
      columnClass: 'col-md-6',
    },
    {
      field: 'max|amount_due',
      label: 'Total a pagar (máx.)',
      type: 'number',
      operator: '<=',
      placeholder: '0.00',
      columnClass: 'col-md-6',
    },
    {
      field: 'min_paid|amount_paid',
      label: 'Valor pago (mín.)',
      type: 'number',
      operator: '>=',
      placeholder: '0.00',
      columnClass: 'col-md-6',
    },
    {
      field: 'max_paid|amount_paid',
      label: 'Valor pago (máx.)',
      type: 'number',
      operator: '<=',
      placeholder: '0.00',
      columnClass: 'col-md-6',
    },
  ],
  columnClass: 'col-md-12',
  module: 'Orders',
}

const crudService = useCrud({
  service: OrdersService,
  searchable: ['code', 'status', 'customer_name'],
  relations: ['customers', 'course', 'coupon'],
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

const orderSidebar = ref()
function openOrder(id: number) {
  orderSidebar.value.open(id)
}

async function exportOrdersExcel() {
  try {
    const res = await OrdersService.index({ ...crudService.filters, perPage: 1000, page: 1 })
    const statusLabel: any = {
      completed: 'Concluído',
      pending: 'Pendente',
      canceled: 'Cancelado',
      refunded: 'Devolvido',
    }
    const rows = (res.data?.data || []).map((o: any) => ({
      Código: o.code,
      Estado: statusLabel[o.status] || o.status,
      'Total a pagar (Kz)': Number(o.amount_due),
      'Descontos (Kz)': Number(o.discount_total),
      'Comissão (Kz)': Number(o.commission_amount ?? 0),
      'Valor pago (Kz)': Number(o.amount_paid),
      'Criado em': o.created_at,
      'Expira em': o.reference_expires_at ? formatDate(o.reference_expires_at) : '',
    }))
    exportToExcel(rows, 'pedidos', 'Pedidos')
  } catch {
    alert('Erro ao exportar')
  }
}

async function exportOrdersPdf() {
  const el = document.getElementById('orders-print-area')
  if (!el) return
  await exportToPdf(el, 'pedidos', 'landscape')
}
</script>
