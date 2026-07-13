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
      <TablePage :withActions="true" showHeader title="Gestão" subtitle="Utilizadores" :tableHeaders="tableHeaders"
                 :sideBarShowComponent="UsersSidebar" :modalAddComponent="ModalNew" :modalEditComponent="ModalNew" :perPage="10"
                 :crudService="crudService" :with-timestamps="false" :filter-schema="filterSchema">
        <template #cell(status)="row">
          <span v-if="row.value" class="badge bg-green text-green-fg">Ativo</span>
          <span v-else class="badge bg-red text-red-fg">Desactivado</span>
        </template>
        <template #cell(role)="row">
          <span>{{ userRoles.find(r => r.value === row.value)?.label || '-' }}</span>
        </template>
        <template #row-actions="{ row }">
          <b-button variant="btn2" href="#" class="me-2" :title="'Redefinir a palavra-passe de ' + row.name" @click.prevent="handleResetPassword(row)">
            <IconKey size="15" />
          </b-button>
        </template>
      </TablePage>
    </div>
  </div>
</template>
<script setup lang="ts">
import TablePage from '@components/TablePage.vue';
import ModalNew from './create.vue';
import type { TableFieldRaw } from 'bootstrap-vue-next';
import { UsersService } from '../../domain/service/UsersService';
import {userRoles}  from '../../domain/constants/roles';
import { useCrud } from '@common/presentation/hooks/useCrud';
import UsersSidebar from '../components/UsersSidebar.vue';
import type { FilterSchema } from '@common/presentation/hooks/types';
import notification from '@common/application/utils/notification';
import { IconKey } from '@tabler/icons-vue';

const tableHeaders: TableFieldRaw[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'username', label: 'Username', sortable: true },
  { key: 'phone', label: 'Telefone', sortable: true },
  { key: 'role', label: 'Permissão', sortable: true }
];

const filterSchema: FilterSchema = {
  fields: [],
  columnClass: 'col-md-12',
  module: 'Users'
};

const crudService = useCrud({
  service: UsersService,
  searchable: ['name', 'username', 'phone'],
});

async function handleResetPassword(row: any) {
  if (!confirm(`Redefinir a palavra-passe de "${row.name}" para o padrão?`)) return;
  try {
    await UsersService.resetPassword(row.id);
    notification.success('Palavra-passe redefinida para o padrão.');
  } catch {
    notification.error('Erro ao redefinir a palavra-passe.');
  }
}
</script>
