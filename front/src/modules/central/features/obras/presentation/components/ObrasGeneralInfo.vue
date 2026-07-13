<template>
  <div class="obra-details">
    <LoadingState v-if="obra === null" />
    <EmptyState v-else-if="!obra" message="Nenhuma obra selecionada" />

    <div v-else class="obra-content">
      <PageHeader
        :title="obra.nome"
        :status="obra.estado === 'ativa' ? 'active' : 'inactive'"
        :status-label="estadoLabel"
        :meta-items="headerMetaItems"
      />

      <InfoSection title="Informações da obra" :icon="IconBuilding">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconHash" label="Código" :value="obra.codigo" />
          <InfoCard :icon="IconUser" label="Cliente" :value="obra.cliente || '—'" />
          <InfoCard :icon="IconMapPin" label="Endereço" :value="obra.endereco || '—'" />
          <InfoCard :icon="IconCalendar" label="Início" :value="obra.data_inicio ? toData(obra.data_inicio) : '—'" />
          <InfoCard :icon="IconCalendarDue" label="Fim previsto" :value="obra.data_fim_prevista ? toData(obra.data_fim_prevista) : '—'" />
        </ResponsiveGrid>
      </InfoSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconHash,
  IconBuilding,
  IconUser,
  IconMapPin,
  IconCalendar,
  IconCalendarDue,
} from '@tabler/icons-vue'
import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import { computed } from 'vue'
import type { IObra } from '../../application/dtos'
import { toData } from '@/common/application/utils/date'

const props = defineProps<{
  obra?: IObra | null
  crudService: any
}>()

const estadoLabel = computed(() => {
  switch (props.obra?.estado) {
    case 'ativa': return 'Ativa'
    case 'pausada': return 'Pausada'
    case 'concluida': return 'Concluída'
    default: return '—'
  }
})

const headerMetaItems = computed(() => [
  { label: 'Código', value: props.obra?.codigo || '—' },
])
</script>
