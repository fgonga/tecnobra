<template>
  <div class="empresa-details">
    <LoadingState v-if="empresa === null" />
    <EmptyState v-else-if="!empresa" message="Nenhuma empresa selecionada" />

    <div v-else class="empresa-content">
      <PageHeader
        :title="empresa.nome"
        :status="empresa.estado === 'ativa' ? 'active' : 'inactive'"
        :status-label="empresa.estado === 'ativa' ? 'Ativa' : 'Inativa'"
        :meta-items="headerMetaItems"
      />

      <InfoSection title="Informações da empresa" :icon="IconBuildingFactory2">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconHash" label="NIF" :value="empresa.nif || '—'" />
          <InfoCard :icon="IconTag" label="Tipo" :value="EMPRESA_TIPO_LABELS[empresa.tipo] ?? empresa.tipo" />
          <InfoCard :icon="IconUser" label="Contacto" :value="empresa.contacto_nome || '—'" />
          <InfoCard :icon="IconPhone" label="Telefone" :value="empresa.telefone || '—'" />
          <InfoCard :icon="IconMail" label="E-mail" :value="empresa.email || '—'" />
        </ResponsiveGrid>
      </InfoSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconHash,
  IconTag,
  IconUser,
  IconPhone,
  IconMail,
  IconBuildingFactory2,
} from '@tabler/icons-vue'
import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import { computed } from 'vue'
import type { IEmpresa } from '../../application/dtos'
import { EMPRESA_TIPO_LABELS } from '../../application/dtos'

const props = defineProps<{
  empresa?: IEmpresa | null
  crudService: any
}>()

const headerMetaItems = computed(() => [
  { label: 'NIF', value: props.empresa?.nif || '—' },
])
</script>
