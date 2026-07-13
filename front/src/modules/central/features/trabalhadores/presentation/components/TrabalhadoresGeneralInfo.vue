<template>
  <div class="trabalhador-details">
    <LoadingState v-if="trabalhador === null" />
    <EmptyState v-else-if="!trabalhador" message="Nenhum trabalhador selecionado" />

    <div v-else class="trabalhador-content">
      <PageHeader
        :title="trabalhador.nome"
        :status="trabalhador.estado === 'ativo' ? 'active' : 'inactive'"
        :status-label="estadoLabel"
        :meta-items="headerMetaItems"
      />

      <InfoSection title="Identificação" :icon="IconIdBadge2">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconBriefcase" label="Função" :value="trabalhador.funcao || '—'" />
          <InfoCard :icon="IconBuildingFactory2" label="Empresa" :value="trabalhador.empresa?.nome || '—'" />
          <InfoCard :icon="IconBuilding" label="Obra" :value="trabalhador.obra?.nome || '—'" />
          <InfoCard :icon="IconId" label="Documento" :value="trabalhador.documento || '—'" />
          <InfoCard :icon="IconPhone" label="Telefone" :value="trabalhador.telefone || '—'" />
          <InfoCard :icon="IconMail" label="E-mail" :value="trabalhador.email || '—'" />
        </ResponsiveGrid>
      </InfoSection>

      <InfoSection title="Cartão" :icon="IconQrcode">
        <ResponsiveGrid columns="3">
          <InfoCard
            :icon="IconShieldCheck"
            label="Estado do cartão"
            :value="trabalhador.cartao_estado === 'ativo' ? 'Ativo' : 'Revogado'"
          />
          <InfoCard
            :icon="IconCalendar"
            label="Emitido em"
            :value="trabalhador.cartao_emitido_em ? toData(trabalhador.cartao_emitido_em) : 'Nunca emitido'"
          />
        </ResponsiveGrid>
      </InfoSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconIdBadge2,
  IconBriefcase,
  IconBuilding,
  IconBuildingFactory2,
  IconId,
  IconPhone,
  IconMail,
  IconQrcode,
  IconShieldCheck,
  IconCalendar,
} from '@tabler/icons-vue'
import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import { computed } from 'vue'
import type { ITrabalhador } from '../../application/dtos'
import { toData } from '@/common/application/utils/date'

const props = defineProps<{
  trabalhador?: ITrabalhador | null
  crudService: any
}>()

const estadoLabel = computed(() => {
  switch (props.trabalhador?.estado) {
    case 'ativo': return 'Ativo'
    case 'suspenso': return 'Suspenso'
    case 'inativo': return 'Inativo'
    default: return '—'
  }
})

const headerMetaItems = computed(() => [
  { label: 'Função', value: props.trabalhador?.funcao || '—' },
])
</script>
