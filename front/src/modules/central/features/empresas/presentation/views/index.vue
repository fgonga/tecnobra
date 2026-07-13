<!--
 -  Tecnobra — Gestão de empresas (empreiteiros, fornecedores, fiscalização).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Gestão"
        subtitle="Empresas"
        :tableHeaders="tableHeaders"
        :sideBarShowComponent="EmpresasSidebar"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="10"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(tipo)="row">
          {{ EMPRESA_TIPO_LABELS[row.value] ?? row.value }}
        </template>
        <template #cell(estado)="row">
          <span v-if="row.value === 'ativa'" class="badge bg-green text-green-fg">Ativa</span>
          <span v-else class="badge bg-red text-red-fg">Inativa</span>
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
import { EmpresasService } from '../../domain/service/EmpresasService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import EmpresasSidebar from '../components/EmpresasSidebar.vue'
import type { FilterSchema } from '@common/presentation/hooks/types'
import { EMPRESA_TIPOS, EMPRESA_TIPO_LABELS } from '../../application/dtos'

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'nif', label: 'NIF', sortable: true },
  { key: 'tipo', label: 'Tipo', sortable: true },
  { key: 'contacto_nome', label: 'Contacto', sortable: true },
  { key: 'telefone', label: 'Telefone', sortable: false },
  { key: 'estado', label: 'Estado', sortable: true },
]

const filterSchema: FilterSchema = {
  fields: [
    {
      field: 'tipo',
      label: 'Tipo',
      type: 'select',
      operator: '=',
      options: EMPRESA_TIPOS,
      placeholder: 'Selecionar tipo...',
      columnClass: 'col-md-6',
    },
    {
      field: 'estado',
      label: 'Estado',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Ativa', value: 'ativa' },
        { label: 'Inativa', value: 'inativa' },
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
      field: 'nif',
      label: 'NIF',
      type: 'text',
      operator: 'like',
      placeholder: 'Procurar por NIF...',
      columnClass: 'col-md-6',
    },
  ],
  columnClass: 'col-md-12',
  module: 'Empresas',
}

const crudService = useCrud({
  service: EmpresasService,
  searchable: ['nome', 'nif', 'contacto_nome'],
})

const options: ITableOption[] = []
</script>
