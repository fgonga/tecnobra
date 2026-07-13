<template>
  <SideBar
    width="60%"
    :hasPadding="false"
    id="trabalhador-sidebar"
    title="Detalhes do trabalhador"
    :is-open="isOpen"
    :tabs="tabs"
    :default-tab="activeTab"
    @close="() => { trabalhador = null; $emit('close') }"
    @tab-change="(i: number) => (activeTab = i)"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @refresh="$emit('refresh')"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import SideBar from '@components/SideBar.vue'
import TrabalhadoresGeneralInfo from './TrabalhadoresGeneralInfo.vue'
import TrabalhadorCartao from './TrabalhadorCartao.vue'
import type { ITrabalhador } from '../../application/dtos'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  id: { type: Number, default: null },
  initialTab: { type: Number, default: 0 },
  crudService: { type: Object, required: true },
})

defineEmits(['close', 'edit', 'delete', 'refresh'])

const activeTab = ref(props.initialTab)
const trabalhador = shallowRef<ITrabalhador | null>(null)

const tabs = computed(() => [
  {
    title: 'Informações gerais',
    component: TrabalhadoresGeneralInfo,
    props: { trabalhador: trabalhador.value, crudService: props.crudService },
  },
  {
    title: 'Cartão QR',
    component: TrabalhadorCartao,
    props: { trabalhador: trabalhador.value },
  },
])

async function getTrabalhador() {
  if (!props.id) return
  const relations = props.crudService.filters.with || []
  props.crudService.filters.with = ['obra', 'empresa']
  await props.crudService.showItem(props.id)
  props.crudService.filters.with = relations
  trabalhador.value = props.crudService.selectedItem.value
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) getTrabalhador()
  }
)
</script>
