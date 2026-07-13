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
      <TablePage :withActions="true" :options="options" showHeader title="Gestão" subtitle="Parceiros" :tableHeaders="tableHeaders"
                 :sideBarShowComponent="InfluencersSidebar" :modalAddComponent="ModalNew" :modalEditComponent="ModalNew" :perPage="10"
                 :crudService="crudService" :with-timestamps="false" :filter-schema="filterSchema">
        <template #cell(status)="row">
          <span v-if="row.value" class="badge bg-green text-green-fg">Activo</span>
          <span v-else class="badge bg-red text-red-fg">Inactivo</span>
        </template>
        <template #cell(contact)="row">
          <span>{{row.item.phone}} <br> {{row.item.email}}</span>
        </template>
        <template #cell(coupon)="row">
          <span>{{row.value?.name}} - {{row.value?.percentage}}%</span>
        </template>
        <template #cell(min_payout_kz)="row">
          <span v-if="row.value">{{ Number(row.value).toLocaleString('pt-AO') }} Kz</span>
          <span v-else class="text-muted">—</span>
        </template>
      </TablePage>
    </div>
  </div>
</template>
<script setup lang="ts">
import TablePage from '@components/TablePage.vue';
import type {ITableOption} from '@components/TablePage.vue';
import ModalNew from './create.vue';
import type { TableFieldRaw } from 'bootstrap-vue-next';
import { InfluencersService } from '../../domain/service/InfluencersService';
import { useCrud } from '@common/presentation/hooks/useCrud';
import InfluencersSidebar from '../components/InfluencersSidebar.vue';
import type { FilterSchema } from '@common/presentation/hooks/types';
import { ref } from 'vue';
const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'coupon', label: 'Cupão', sortable: false },
  { key: 'commission', label: 'Comissão %', sortable: true },
  { key: 'min_payout_kz', label: 'Mínimo de repasse', sortable: true },
  { key: 'contact', label: 'Contactos', sortable: false },
];
const filterSchema: FilterSchema = {
  fields: [],
  columnClass: 'col-md-12',
  module: 'Parceiros'
};
const crudService = useCrud({
  service: InfluencersService,
  relations: ['coupon'],
  searchable: ['name', 'phone', 'email'],
});
const options : ITableOption[] = [];
</script>
