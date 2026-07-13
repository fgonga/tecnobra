<template>
  <SideBar
    width="60%"
    :hasPadding="false"
    id="equipamento-sidebar"
    title="Detalhes do equipamento"
    :is-open="isOpen"
    :tabs="tabs"
    :default-tab="activeTab"
    @close="() => { equipamento = null; $emit('close') }"
    @tab-change="(i: number) => (activeTab = i)"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @refresh="$emit('refresh')"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import SideBar from '@components/SideBar.vue'
import EquipamentoAcoes from './EquipamentoAcoes.vue'
import type { IEquipamento } from '../../application/dtos'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  id: { type: Number, default: null },
  initialTab: { type: Number, default: 0 },
  crudService: { type: Object, required: true },
})

const emit = defineEmits(['close', 'edit', 'delete', 'refresh'])

const activeTab = ref(props.initialTab)
const equipamento = shallowRef<IEquipamento | null>(null)

const tabs = computed(() => [
  {
    title: 'Estado e movimentos',
    component: EquipamentoAcoes,
    props: {
      equipamento: equipamento.value,
      onChanged: () => {
        getEquipamento()
        emit('refresh')
      },
    },
  },
])

async function getEquipamento() {
  if (!props.id) return
  const relations = props.crudService.filters.with || []
  props.crudService.filters.with = ['obra', 'trabalhador_atual']
  await props.crudService.showItem(props.id)
  props.crudService.filters.with = relations
  equipamento.value = props.crudService.selectedItem.value
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) getEquipamento()
  }
)
</script>
