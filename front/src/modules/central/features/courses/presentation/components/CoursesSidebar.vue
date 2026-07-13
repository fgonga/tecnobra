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
  <SideBar width="60%" :hasPadding="false" id="Courses-sidebar" title="Detalhes do curso" :is-open="isOpen"
           :tabs="CoursesTabs" :default-tab="activeTab" @close="() => {
            Courses = null;
            $emit('close')
        }" @tab-change="handleTabChange" @edit="$emit('edit', $event)" @delete="$emit('delete', $event)"
           @refresh="$emit('refresh')">
  </SideBar>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue';
import SideBar from '@components/SideBar.vue';
import CoursesGeneralInfo from './CoursesGeneralInfo.vue';
import {ICourse} from "../../application/dtos";


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
const course = shallowRef<ICourse | null>(null);


const CoursesTabs = computed(() => {
  return [
    {
      title: 'Informações Gerais',
      component: CoursesGeneralInfo,
      props: { course: course.value, crudService: props.crudService }
    },
  ];
});

async function getCourses() {
  if (!props.id) return;

  const relations = props.crudService.filters.with || [];
  props.crudService.filters.with = relations.concat([]);
  await props.crudService.showItem(props.id);

  props.crudService.filters.with = relations;
  course.value = props.crudService.selectedItem.value;
}


watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    getCourses();
  }
});

function handleTabChange(tabIndex: number) {
  activeTab.value = tabIndex;
}
</script>
