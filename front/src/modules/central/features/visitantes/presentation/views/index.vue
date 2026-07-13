<!--
 -  Tecnobra — Gestão de visitantes.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Portaria"
        subtitle="Visitantes"
        :tableHeaders="tableHeaders"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="10"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(validade)="row">
          <template v-if="row.item.valido_ate">
            {{ fmt(row.item.valido_de) }} — {{ fmt(row.item.valido_ate) }}
          </template>
          <template v-else>—</template>
        </template>
        <template #cell(estado)="row">
          <span v-if="row.value === 'ativo'" class="badge bg-green text-green-fg">Ativo</span>
          <span v-else-if="row.value === 'previsto'" class="badge bg-blue text-blue-fg">Previsto</span>
          <span v-else class="badge bg-secondary text-secondary-fg">Encerrado</span>
        </template>
        <template #cell(obra)="row">
          {{ row.item.obra?.codigo ?? row.item.obra_id }}
        </template>
      </TablePage>
    </div>
  </div>
</template>

<script setup lang="ts">
import TablePage from '@components/TablePage.vue'
import type { ITableOption } from '@components/TablePage.vue'
import ModalNew from './create.vue'
import type { TableFieldRaw } from 'bootstrap-vue-next'
import dayjs from 'dayjs'
import { VisitantesService } from '../../domain/service/VisitantesService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import type { FilterSchema } from '@common/presentation/hooks/types'

const fmt = (v?: string | null) => (v ? dayjs(v).format('DD/MM HH:mm') : '—')

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'empresa', label: 'Empresa', sortable: true },
  { key: 'motivo', label: 'Motivo', sortable: true },
  { key: 'anfitriao', label: 'Anfitrião', sortable: true },
  { key: 'validade', label: 'Validade', sortable: false },
  { key: 'estado', label: 'Estado', sortable: true },
  { key: 'obra', label: 'Obra', sortable: false },
]

const filterSchema: FilterSchema = {
  fields: [
    { field: 'obra_id', label: 'Obra (ID)', type: 'number', operator: '=', columnClass: 'col-md-6' },
    {
      field: 'estado',
      label: 'Estado',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Previsto', value: 'previsto' },
        { label: 'Ativo', value: 'ativo' },
        { label: 'Encerrado', value: 'encerrado' },
      ],
      columnClass: 'col-md-6',
    },
    { field: 'motivo', label: 'Motivo', type: 'text', operator: 'like', columnClass: 'col-md-6' },
    { field: 'valido_de', label: 'A partir de', type: 'date', operator: '>=', columnClass: 'col-md-6' },
  ],
  columnClass: 'col-md-12',
  module: 'Visitantes',
}

const crudService = useCrud({
  service: VisitantesService,
  searchable: ['nome', 'empresa', 'motivo', 'anfitriao'],
  relations: ['obra'],
})

const options: ITableOption[] = []
</script>
