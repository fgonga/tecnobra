<!--
 -  Tecnobra — Presenças: histórico de movimentos de entrada/saída (read-only).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :withActions="false"
        :options="options"
        showHeader
        title="Portaria"
        subtitle="Presenças e movimentos"
        :tableHeaders="tableHeaders"
        :perPage="15"
        :crudService="crudService"
        :with-timestamps="false"
        :filter-schema="filterSchema"
      >
        <template #cell(quem)="row">
          <template v-if="row.item.trabalhador">{{ row.item.trabalhador.nome }}</template>
          <template v-else-if="row.item.visitante">{{ row.item.visitante.nome }}</template>
          <template v-else-if="row.item.veiculo">{{ row.item.veiculo.matricula }}</template>
          <template v-else>—</template>
        </template>
        <template #cell(tipo_entidade)="row">
          <span v-if="row.value === 'trabalhador'" class="badge bg-blue text-blue-fg">Trabalhador</span>
          <span v-else-if="row.value === 'visitante'" class="badge bg-purple text-purple-fg">Visitante</span>
          <span v-else class="badge bg-azure text-azure-fg">Veículo</span>
        </template>
        <template #cell(direcao)="row">
          <span v-if="row.value === 'entrada'" class="badge bg-green text-green-fg">Entrada</span>
          <span v-else class="badge bg-red text-red-fg">Saída</span>
        </template>
        <template #cell(metodo)="row">
          {{ row.value === 'qr' ? 'QR' : row.value === 'ocr' ? 'OCR' : 'Manual' }}
        </template>
        <template #cell(ocorrido_em)="row">
          {{ fmt(row.value) }}
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
import type { TableFieldRaw } from 'bootstrap-vue-next'
import dayjs from 'dayjs'
import { MovimentosService } from '../../domain/service/MovimentosService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import type { FilterSchema } from '@common/presentation/hooks/types'

const fmt = (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'quem', label: 'Quem', sortable: false },
  { key: 'tipo_entidade', label: 'Tipo', sortable: true },
  { key: 'direcao', label: 'Direção', sortable: true },
  { key: 'metodo', label: 'Método', sortable: true },
  { key: 'portao', label: 'Portão', sortable: true },
  { key: 'obra', label: 'Obra', sortable: false },
  { key: 'ocorrido_em', label: 'Quando', sortable: true },
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
      field: 'tipo_entidade',
      label: 'Tipo',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Trabalhador', value: 'trabalhador' },
        { label: 'Visitante', value: 'visitante' },
        { label: 'Veículo', value: 'veiculo' },
      ],
      columnClass: 'col-md-6',
    },
    {
      field: 'direcao',
      label: 'Direção',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Entrada', value: 'entrada' },
        { label: 'Saída', value: 'saida' },
      ],
      columnClass: 'col-md-6',
    },
    {
      field: 'ocorrido_em',
      label: 'A partir de',
      type: 'date',
      operator: '>=',
      columnClass: 'col-md-6',
    },
  ],
  columnClass: 'col-md-12',
  module: 'Presencas',
}

const crudService = useCrud({
  service: MovimentosService,
  searchable: [],
  relations: ['trabalhador', 'visitante', 'veiculo', 'obra'],
})
// Mais recentes primeiro (definido antes do fetch inicial em onMounted)
crudService.filters.orderBy = 'ocorrido_em'
crudService.filters.sortMethod = 'DESC'

const options: ITableOption[] = []
</script>
