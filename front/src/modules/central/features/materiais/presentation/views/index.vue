<!--
 -  Tecnobra — Gestão de materiais consumíveis.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Recursos"
        subtitle="Materiais"
        :tableHeaders="tableHeaders"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="10"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(stock_atual)="row">
          <span :class="Number(row.item.stock_atual) <= Number(row.item.stock_minimo) ? 'text-danger fw-bold' : ''">
            {{ Number(row.value) }} {{ row.item.unidade }}
          </span>
        </template>
        <template #cell(stock_minimo)="row">
          {{ Number(row.value) }} {{ row.item.unidade }}
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
import { MateriaisService } from '../../domain/service/MateriaisService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import type { FilterSchema } from '@common/presentation/hooks/types'

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'categoria', label: 'Categoria', sortable: true },
  { key: 'stock_atual', label: 'Stock atual', sortable: true },
  { key: 'stock_minimo', label: 'Stock mínimo', sortable: true },
  { key: 'obra', label: 'Obra', sortable: false },
]

const filterSchema: FilterSchema = {
  fields: [
    { field: 'obra_id', label: 'Obra (ID)', type: 'number', operator: '=', columnClass: 'col-md-6' },
    { field: 'categoria', label: 'Categoria', type: 'text', operator: 'like', columnClass: 'col-md-6' },
    { field: 'nome', label: 'Nome', type: 'text', operator: 'like', columnClass: 'col-md-6' },
  ],
  columnClass: 'col-md-12',
  module: 'Materiais',
}

const crudService = useCrud({
  service: MateriaisService,
  searchable: ['nome', 'categoria'],
  relations: ['obra'],
})

const options: ITableOption[] = []
</script>
