<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
 -   Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
 -   Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte,
 -   é estritamente proibido e sujeito às penalidades legais aplicáveis.
 -->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage :withActions="true" :options="options" showHeader title="Gestão" subtitle="Coupons" :tableHeaders="tableHeaders"
                 :sideBarShowComponent="CouponsSidebar" :modalAddComponent="ModalNew" :modalEditComponent="ModalNew" :perPage="10"
                 :crudService="crudService" :with-timestamps="false" :filter-schema="filterSchema">
        <template #cell(active)="row">
          <span v-if="row.value" class="badge bg-green text-green-fg">Ativo</span>
          <span v-else class="badge bg-red text-red-fg">Desactivado</span>
        </template>
        <template #cell(expire_at)="row">
          {{ toData(row.value) }}
        </template>
        <template #cell(amount)="row">
          {{ toMoney(row.value) }}
        </template>
        <template #cell(percentage)="row">
          {{ toMoney(row.value) }}
        </template>
      </TablePage>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import TablePage from '@components/TablePage.vue';
import type {ITableOption} from '@components/TablePage.vue';
import ModalNew from './create.vue';
import type { TableFieldRaw } from 'bootstrap-vue-next';
import { CouponsService } from '../../domain/service/CouponsService';
import { useCrud } from '@common/presentation/hooks/useCrud';
import DataCell from '@components/DataCell.vue';
import CouponsSidebar from '../components/CouponsSidebar.vue';
import type { FilterSchema } from '@common/presentation/hooks/types';
import { toData } from "@/common/application/utils/date";
import  toMoney  from "@/common/application/utils/money";
const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'active', label: 'Estado', sortable: true },
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'amount', label: 'Valor', sortable: true },
  { key: 'percentage', label: 'Percentagem', sortable: true },
  { key: 'expire_at', label: 'Expira em', sortable: true },
];
const filterSchema: FilterSchema = {
  fields: [
    {
      field: 'id',
      label: 'ID',
      type: 'number',
      operator: '=',
      placeholder: 'Buscar por ID...',
      columnClass: 'col-md-6'
    },
    {
      field: 'active',
      label: 'Estado',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Ativo', value: true },
        { label: 'Inativo', value: false }
      ],
      placeholder: 'Selecionar estado...',
      columnClass: 'col-md-6'
    },
    {
      field: 'name',
      label: 'Nome',
      type: 'text',
      operator: 'like',
      placeholder: 'Buscar por nome...',
      columnClass: 'col-md-6'
    },
    {
      field: 'code',
      label: 'Código',
      type: 'text',
      operator: 'like',
      placeholder: 'Buscar por código...',
      columnClass: 'col-md-6'
    },
    {
      field: 'amount',
      label: 'Valor',
      type: 'number',
      operator: '>=',
      placeholder: 'Valor mínimo...',
      columnClass: 'col-md-6'
    },
    {
      field: 'percentage',
      label: 'Percentagem',
      type: 'number',
      operator: '>=',
      placeholder: 'Percentagem mínima...',
      columnClass: 'col-md-6'
    }
  ],
  columnClass: 'col-md-12',
  module: 'Coupons'
};
const crudService = useCrud({
  service: CouponsService,
  searchable: [
    'name',
    'code'
  ],
});
const options : ITableOption[] = [];
</script>
