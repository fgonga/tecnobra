<!--
 -  Tecnobra — Gestão de obras (estaleiros).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Gestão"
        subtitle="Obras"
        :tableHeaders="tableHeaders"
        :sideBarShowComponent="ObrasSidebar"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="10"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(estado)="row">
          <span v-if="row.value === 'ativa'" class="badge bg-green text-green-fg">Ativa</span>
          <span v-else-if="row.value === 'pausada'" class="badge bg-yellow text-yellow-fg">Pausada</span>
          <span v-else class="badge bg-secondary text-secondary-fg">Concluída</span>
        </template>
        <template #cell(data_inicio)="row">
          {{ row.value ? toData(row.value) : '—' }}
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
import { ObrasService } from '../../domain/service/ObrasService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import ObrasSidebar from '../components/ObrasSidebar.vue'
import type { FilterSchema } from '@common/presentation/hooks/types'
import { toData } from '@/common/application/utils/date'

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'codigo', label: 'Código', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'cliente', label: 'Cliente', sortable: true },
  { key: 'estado', label: 'Estado', sortable: true },
  { key: 'data_inicio', label: 'Início', sortable: true },
]

const filterSchema: FilterSchema = {
  fields: [
    {
      field: 'estado',
      label: 'Estado',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Ativa', value: 'ativa' },
        { label: 'Pausada', value: 'pausada' },
        { label: 'Concluída', value: 'concluida' },
      ],
      placeholder: 'Selecionar estado...',
      columnClass: 'col-md-6',
    },
    {
      field: 'nome',
      label: 'Nome',
      type: 'text',
      operator: 'like',
      placeholder: 'Procurar por nome...',
      columnClass: 'col-md-6',
    },
    {
      field: 'codigo',
      label: 'Código',
      type: 'text',
      operator: 'like',
      placeholder: 'Procurar por código...',
      columnClass: 'col-md-6',
    },
  ],
  columnClass: 'col-md-12',
  module: 'Obras',
}

const crudService = useCrud({
  service: ObrasService,
  searchable: ['nome', 'codigo', 'cliente'],
})

const options: ITableOption[] = []
</script>
