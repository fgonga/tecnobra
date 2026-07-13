<template>
  <SideBar
    width="50%"
    :hasPadding="false"
    id="empresa-sidebar"
    title="Detalhes da empresa"
    :is-open="isOpen"
    :tabs="tabs"
    :default-tab="activeTab"
    @close="() => { empresa = null; $emit('close') }"
    @tab-change="(i: number) => (activeTab = i)"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @refresh="$emit('refresh')"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import SideBar from '@components/SideBar.vue'
import EmpresasGeneralInfo from './EmpresasGeneralInfo.vue'
import type { IEmpresa } from '../../application/dtos'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  id: { type: Number, default: null },
  initialTab: { type: Number, default: 0 },
  crudService: { type: Object, required: true },
})

defineEmits(['close', 'edit', 'delete', 'refresh'])

const activeTab = ref(props.initialTab)
const empresa = shallowRef<IEmpresa | null>(null)

const tabs = computed(() => [
  {
    title: 'Informações gerais',
    component: EmpresasGeneralInfo,
    props: { empresa: empresa.value, crudService: props.crudService },
  },
])

async function getEmpresa() {
  if (!props.id) return
  await props.crudService.showItem(props.id)
  empresa.value = props.crudService.selectedItem.value
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) getEmpresa()
  }
)
</script>
