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
  -
  -
  -->

<template>
  <TablePage   :options="options"  :modalAddComponent="ModalNew" :modalEditComponent="ModalNew"   showHeader :withTimestamps="false" title="CRM" subtitle="Equipes" :tableHeaders="tableHeaders"
             :sideBarShowComponent="TeamSidebar" :perPage="10" :crudService="crudService">

  </TablePage>
</template>
<script setup lang="ts">
import ModalNew from './create.vue';
import ModalBulk from './ModalBulk.vue';
import type { TableFieldRaw } from 'bootstrap-vue-next';
import { useCrud } from '@common/hooks/useCrud';
import DataCell from '@components/DataCell.vue';
import TeamSidebar from '../components/TeamSidebar.vue';

const tableHeaders: TableFieldRaw<ITeam>[] = [
  { key: 'name', label: 'Nome', sortable: true },
];

const options: TableFieldRaw<ITableOptions>[] = [

];

const crudService = useCrud({
  service: TeamService,
  searchable: ['name'],
  relations: [],
  defaultFilters: {}
});

</script>
