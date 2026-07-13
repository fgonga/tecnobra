<template>
  <SideBar
    width="50%"
    :hasPadding="false"
    id="obra-sidebar"
    title="Detalhes da obra"
    :is-open="isOpen"
    :tabs="tabs"
    :default-tab="activeTab"
    @close="() => { obra = null; $emit('close') }"
    @tab-change="(i: number) => (activeTab = i)"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @refresh="$emit('refresh')"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import SideBar from '@components/SideBar.vue'
import ObrasGeneralInfo from './ObrasGeneralInfo.vue'
import type { IObra } from '../../application/dtos'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  id: { type: Number, default: null },
  initialTab: { type: Number, default: 0 },
  crudService: { type: Object, required: true },
})

defineEmits(['close', 'edit', 'delete', 'refresh'])

const activeTab = ref(props.initialTab)
const obra = shallowRef<IObra | null>(null)

const tabs = computed(() => [
  {
    title: 'Informações gerais',
    component: ObrasGeneralInfo,
    props: { obra: obra.value, crudService: props.crudService },
  },
])

async function getObra() {
  if (!props.id) return
  await props.crudService.showItem(props.id)
  obra.value = props.crudService.selectedItem.value
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) getObra()
  }
)
</script>
