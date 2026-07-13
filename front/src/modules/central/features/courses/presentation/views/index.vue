<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -->
<template>
  <div class="page-body">
    <div class="container-xl">
      <TablePage
        :showDelete="false"
        :selectable="false" :options="options" showHeader title="Gestão" subtitle="Cursos" :tableHeaders="tableHeaders"
                 :sideBarShowComponent="CoursesSidebar" :modalAddComponent="ModalNew" :modalEditComponent="ModalNew" :perPage="10"
                 :crudService="crudService" :with-timestamps="false" :filter-schema="filterSchema"
                 @modal-add-saved="crudService.refresh()">
        <template #cell(photo)="row">
          <FieldImages :cover="row.item.course_card_image_url" />
        </template>
        <template #cell(price)="row">
          {{toMoney(row.item.price)}}
        </template>
        <template #cell(cefr_levels)="row">
          <div class="d-flex flex-wrap gap-1">
            <template v-if="parseCefr(row.item.cefr_levels).length">
              <span v-for="lv in parseCefr(row.item.cefr_levels)" :key="lv" class="badge bg-primary-lt">
                {{ lv }}
              </span>
            </template>
            <span v-else class="text-muted small">Todos</span>
          </div>
        </template>

      </TablePage>
      <SyncCoursesModal ref="syncModal" @done="crudService.refresh()" />
    </div>
  </div>
</template>
<script setup lang="ts">
import TablePage from '@components/TablePage.vue';
import type {ITableOption} from '@components/TablePage.vue';
import ModalNew from './create.vue';
import type { TableFieldRaw } from 'bootstrap-vue-next';
import { CoursesService } from '../../domain/service/CoursesService';
import { useCrud } from '@common/presentation/hooks/useCrud';
import DataCell from '@components/DataCell.vue';
import CoursesSidebar from '../components/CoursesSidebar.vue';
import type { FilterSchema } from '@common/presentation/hooks/types';
import { ref } from 'vue';
import FieldImages from '@components/FieldImages.vue';
import SyncCoursesModal from '../components/SyncCoursesModal.vue';
import toMoney from "@common/application/utils/money";
const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'photo', label: 'Foto', sortable: true },
  { key: 'thinkific_id', label: 'ThinkificID', sortable: true },
  { key: 'thinkific_type', label: 'Tipo', sortable: true },
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'slug', label: 'slug', sortable: true },
  { key: 'price', label: 'Preço', sortable: true },
  { key: 'days_until_expiry', label: 'Dias de validade', sortable: true },
  { key: 'cefr_levels', label: 'Níveis do teste', sortable: false }
];

const parseCefr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string') {
    try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
  }
  return [];
};
const filterSchema: FilterSchema = {
  module: 'Courses',
  columnClass: 'col-md-12',
  fields: [
    {
      field: 'name',
      label: 'Nome',
      type: 'text',
      operator: 'like',
      placeholder: 'Buscar por nome...',
      columnClass: 'col-md-6'
    },
    {
      field: 'slug',
      label: 'Slug',
      type: 'text',
      operator: 'like',
      placeholder: 'Buscar por slug...',
      columnClass: 'col-md-6'
    },
    {
      field: 'thinkific_type',
      label: 'Tipo Thinkific',
      type: 'select',
      operator: '=',
      options: [
        { label: 'Curso', value: 'course' },
        { label: 'Pacote (Bundle)', value: 'bundle' }
      ],
      placeholder: 'Selecione o tipo...',
      columnClass: 'col-md-4'
    },
    {
      field: 'price',
      label: 'Preço',
      type: 'number',
      operator: '>=',
      placeholder: 'Preço mínimo...',
      columnClass: 'col-md-4'
    },
    {
      field: 'days_until_expiry',
      label: 'Dias até expirar',
      type: 'number',
      operator: '<=',
      placeholder: 'Menor ou igual a...',
      columnClass: 'col-md-4'
    }
  ]
};


const crudService = useCrud({
  service: CoursesService,
  searchable: [
    'name',
    'slug'
  ],
});
const syncModal = ref<InstanceType<typeof SyncCoursesModal> | null>(null);
const handleSync = () => {
  syncModal.value?.show();
};

const options : ITableOption[] = [
  {
    id:1,
    icon:null,
    title:"Sincronizar cursos com o Thinkific",
    component:null,
    click:handleSync
  },
];
</script>
