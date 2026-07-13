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
  <SideBar width="60%" :hasPadding="false" id="user-sidebar" title="Detalhes do utilizador" :is-open="isOpen"
           :tabs="userTabs" :default-tab="activeTab" @close="() => {
            user = null;
            $emit('close')
        }" @tab-change="handleTabChange" @edit="$emit('edit', $event)" @delete="$emit('delete', $event)"
           @refresh="$emit('refresh')">
  </SideBar>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue';
import SideBar from '@components/SideBar.vue';
import UsersGeneralInfo from './UsersGeneralInfo.vue';
import UsersPermissions from './UsersPermissions.vue';
import {IUsers} from "../../application/dtos";


const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  id: {
    type: Number,
    default: null
  },
  initialTab: {
    type: Number,
    default: 0
  },
  crudService: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'edit', 'delete', 'refresh']);

const activeTab = ref(props.initialTab);
const user = shallowRef<IUsers | null>(null);

const userTabs = computed(() => {
  return [
    {
      title: 'Informações Gerais',
      component: UsersGeneralInfo,
      props: { user: user.value, crudService: props.crudService }
    },
    {
      title: 'Permissões',
      component: UsersPermissions,
      props: { userId: user.value?.id ?? null }
    },
  ];
});

async function getUser() {
  if (!props.id) return;

  const relations = props.crudService.filters.with || [];
  props.crudService.filters.with = relations.concat([]);
  await props.crudService.showItem(props.id);

  props.crudService.filters.with = relations;
  user.value = props.crudService.selectedItem.value;
}


watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    getUser();
  }
});

function handleTabChange(tabIndex: number) {
  activeTab.value = tabIndex;
}
</script>
