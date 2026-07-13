<!--
 -  Tecnobra — Gestão de equipamentos e ferramentas.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Recursos"
        subtitle="Equipamentos e ferramentas"
        :tableHeaders="tableHeaders"
        :sideBarShowComponent="EquipamentosSidebar"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="10"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(categoria)="row">
          {{ row.value === 'equipamento' ? 'Equipamento' : 'Ferramenta' }}
        </template>
        <template #cell(estado)="row">
          <span class="badge" :class="EQUIPAMENTO_ESTADOS[row.value]?.badge">
            {{ EQUIPAMENTO_ESTADOS[row.value]?.label ?? row.value }}
          </span>
        </template>
        <template #cell(responsavel)="row">
          {{ row.item.trabalhador_atual?.nome ?? '—' }}
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
import { EquipamentosService } from '../../domain/service/EquipamentosService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import EquipamentosSidebar from '../components/EquipamentosSidebar.vue'
import type { FilterSchema } from '@common/presentation/hooks/types'
import { EQUIPAMENTO_ESTADOS } from '../../application/dtos'

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'codigo', label: 'Código', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'categoria', label: 'Categoria', sortable: true },
  { key: 'estado', label: 'Estado', sortable: true },
  { key: 'responsavel', label: 'Responsável', sortable: false },
  { key: 'obra', label: 'Obra', sortable: false },
]

const filterSchema: FilterSchema = {
  fields: [
    {
      field: 'obra_id',
      label: 'Obra (ID)',
      type: 'number',
      operator: '=',
      columnClass: 'col-md-6',
    },
    {
      field: 'estado',
      label: 'Estado',
      type: 'select',
      operator: '=',
      options: Object.entries(EQUIPAMENTO_ESTADOS).map(([value, v]) => ({ label: v.label, value })),
      columnClass: 'col-md-6',
    },
    {
      field: 'categoria',
      label: 'Categoria',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Equipamento', value: 'equipamento' },
        { label: 'Ferramenta', value: 'ferramenta' },
      ],
      columnClass: 'col-md-6',
    },
    {
      field: 'nome',
      label: 'Nome',
      type: 'text',
      operator: 'like',
      columnClass: 'col-md-6',
    },
  ],
  columnClass: 'col-md-12',
  module: 'Equipamentos',
}

const crudService = useCrud({
  service: EquipamentosService,
  searchable: ['nome', 'codigo', 'numero_serie'],
  relations: ['obra', 'trabalhador_atual'],
})

const options: ITableOption[] = []
</script>
