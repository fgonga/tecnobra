<!--
 -  Tecnobra — Gestão de trabalhadores.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="true"
        :options="options"
        showHeader
        title="Gestão"
        subtitle="Trabalhadores"
        :tableHeaders="tableHeaders"
        :sideBarShowComponent="TrabalhadoresSidebar"
        :modalAddComponent="ModalNew"
        :modalEditComponent="ModalNew"
        :perPage="10"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(nome)="row">
          <div class="d-flex align-items-center gap-2">
            <span class="avatar avatar-xs rounded" :style="row.item.foto ? `background-image: url(${apiBase}${row.item.foto})` : ''">
              <template v-if="!row.item.foto">{{ iniciais(row.item.nome) }}</template>
            </span>
            {{ row.item.nome }}
          </div>
        </template>
        <template #cell(obra)="row">
          {{ row.item.obra?.nome ?? `#${row.item.obra_id}` }}
        </template>
        <template #cell(empresa)="row">
          {{ row.item.empresa?.nome ?? `#${row.item.empresa_id}` }}
        </template>
        <template #cell(cartao_estado)="row">
          <span v-if="row.value === 'ativo'" class="badge bg-green text-green-fg">Ativo</span>
          <span v-else class="badge bg-red text-red-fg">Revogado</span>
        </template>
        <template #cell(estado)="row">
          <span v-if="row.value === 'ativo'" class="badge bg-green text-green-fg">Ativo</span>
          <span v-else-if="row.value === 'suspenso'" class="badge bg-yellow text-yellow-fg">Suspenso</span>
          <span v-else class="badge bg-secondary text-secondary-fg">Inativo</span>
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
import { TrabalhadoresService } from '../../domain/service/TrabalhadoresService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import TrabalhadoresSidebar from '../components/TrabalhadoresSidebar.vue'
import type { FilterSchema } from '@common/presentation/hooks/types'
import { TRABALHADOR_ESTADOS } from '../../application/dtos'

const apiBase = import.meta.env.VITE_API_URL

const iniciais = (nome: string) =>
  (nome || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'funcao', label: 'Função', sortable: true },
  { key: 'empresa', label: 'Empresa', sortable: false },
  { key: 'obra', label: 'Obra', sortable: false },
  { key: 'cartao_estado', label: 'Cartão', sortable: true },
  { key: 'estado', label: 'Estado', sortable: true },
]

const filterSchema: FilterSchema = {
  fields: [
    {
      field: 'obra_id',
      label: 'Obra (ID)',
      type: 'number',
      operator: '=',
      placeholder: 'ID da obra...',
      columnClass: 'col-md-6',
    },
    {
      field: 'empresa_id',
      label: 'Empresa (ID)',
      type: 'number',
      operator: '=',
      placeholder: 'ID da empresa...',
      columnClass: 'col-md-6',
    },
    {
      field: 'funcao',
      label: 'Função',
      type: 'text',
      operator: 'like',
      placeholder: 'Procurar por função...',
      columnClass: 'col-md-6',
    },
    {
      field: 'estado',
      label: 'Estado',
      type: 'select',
      operator: '=',
      options: TRABALHADOR_ESTADOS,
      placeholder: 'Selecionar estado...',
      columnClass: 'col-md-6',
    },
  ],
  columnClass: 'col-md-12',
  module: 'Trabalhadores',
}

const crudService = useCrud({
  service: TrabalhadoresService,
  searchable: ['nome', 'funcao', 'documento', 'telefone'],
  relations: ['obra', 'empresa'],
})

const options: ITableOption[] = []
</script>
