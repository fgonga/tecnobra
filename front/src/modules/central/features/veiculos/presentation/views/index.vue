<!--
 -  Tecnobra — Gestão de veículos.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Portaria"
        subtitle="Veículos"
        :tableHeaders="tableHeaders"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="10"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(matricula)="row">
          <strong>{{ row.value }}</strong>
        </template>
        <template #cell(tipo)="row">
          {{ VEICULO_TIPOS.find((t) => t.value === row.value)?.label ?? row.value }}
        </template>
        <template #cell(foto)="row">
          <a v-if="row.value" :href="`${apiBase}${row.value}`" target="_blank" rel="noopener">Ver foto</a>
          <span v-else class="text-muted">—</span>
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
import { VeiculosService, VEICULO_TIPOS } from '../../domain/service/VeiculosService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import type { FilterSchema } from '@common/presentation/hooks/types'

const apiBase = import.meta.env.VITE_API_URL

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'matricula', label: 'Matrícula', sortable: true },
  { key: 'marca_modelo', label: 'Marca/Modelo', sortable: true },
  { key: 'tipo', label: 'Tipo', sortable: true },
  { key: 'proprietario_nome', label: 'Proprietário', sortable: true },
  { key: 'foto', label: 'Foto', sortable: false },
  { key: 'obra', label: 'Obra', sortable: false },
]

const filterSchema: FilterSchema = {
  fields: [
    { field: 'obra_id', label: 'Obra (ID)', type: 'number', operator: '=', columnClass: 'col-md-6' },
    { field: 'tipo', label: 'Tipo', type: 'select', operator: '=', options: VEICULO_TIPOS, columnClass: 'col-md-6' },
    { field: 'matricula', label: 'Matrícula', type: 'text', operator: 'like', columnClass: 'col-md-6' },
  ],
  columnClass: 'col-md-12',
  module: 'Veiculos',
}

const crudService = useCrud({
  service: VeiculosService,
  searchable: ['matricula', 'marca_modelo', 'proprietario_nome'],
  relations: ['obra'],
})

const options: ITableOption[] = []
</script>
