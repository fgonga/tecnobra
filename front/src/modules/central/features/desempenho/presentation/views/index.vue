<!--
 -  Tecnobra — Registos de desempenho (produção diária por trabalhador).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Gestão"
        subtitle="Desempenho"
        :tableHeaders="tableHeaders"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="15"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(trabalhador)="row">
          {{ row.item.trabalhador?.nome ?? row.item.trabalhador_id }}
        </template>
        <template #cell(metrica)="row">
          {{ row.item.metrica?.nome ?? row.item.metrica_id }}
        </template>
        <template #cell(quantidade)="row">
          <strong>{{ Number(row.value) }}</strong> {{ row.item.metrica?.unidade }}
        </template>
        <template #cell(data)="row">
          {{ fmt(row.value) }}
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
import { DesempenhosService } from '../../domain/service/DesempenhosService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import type { FilterSchema } from '@common/presentation/hooks/types'

const fmt = (v: string) => dayjs(v).format('DD/MM/YYYY')

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'data', label: 'Data', sortable: true },
  { key: 'trabalhador', label: 'Trabalhador', sortable: false },
  { key: 'metrica', label: 'Métrica', sortable: false },
  { key: 'quantidade', label: 'Quantidade', sortable: true },
  { key: 'obs', label: 'Obs.', sortable: false },
]

const filterSchema: FilterSchema = {
  fields: [
    { field: 'obra_id', label: 'Obra (ID)', type: 'number', operator: '=', columnClass: 'col-md-6' },
    { field: 'trabalhador_id', label: 'Trabalhador (ID)', type: 'number', operator: '=', columnClass: 'col-md-6' },
    { field: 'data', label: 'A partir de', type: 'date', operator: '>=', columnClass: 'col-md-6' },
    { field: 'data', label: 'Até', type: 'date', operator: '<=', columnClass: 'col-md-6' },
  ],
  columnClass: 'col-md-12',
  module: 'Desempenho',
}

const crudService = useCrud({
  service: DesempenhosService,
  searchable: [],
  relations: ['trabalhador', 'metrica'],
})
crudService.filters.orderBy = 'data'
crudService.filters.sortMethod = 'DESC'

const options: ITableOption[] = []
</script>
