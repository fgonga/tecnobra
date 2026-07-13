<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
-->
<template>
  <div class="user-details">
    <LoadingState v-if="!userLoaded" />
    <EmptyState v-else-if="!user" message="Nenhum utilizador selecionado" />
    <div v-else class="user-content">
      <PageHeader
        :title="user.name"
        :status-label="user.status ? 'Ativo' : 'Inativo'"
        :meta-items="headerMetaItems"
      />
      <InfoSection title="Informações do Utilizador" :icon="IconFileText">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconHash" label="ID" :value="user.id" />
          <InfoCard :icon="IconTag" label="Nome" :value="user.name" />
          <InfoCard :icon="IconTags" label="Username" :value="user.username" />
          <InfoCard :icon="IconClock" label="Telefone" :value="user.phone" />
          <InfoCard
            :icon="IconFileText"
            label="Permissão"
            :value="userRoles.find(r => r.value === user.role)?.label || '-'"
          />
        </ResponsiveGrid>
      </InfoSection>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  IconHash,
  IconTag,
  IconTags,
  IconClock,
  IconFileText
} from '@tabler/icons-vue'
import { computed } from 'vue'
import { userRoles } from '../../domain/constants/roles'
import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import type { IUsers } from '../../application/dtos'
import type { useCrud } from '@common/presentation/hooks/useCrud'

const props = defineProps<{
  user?: IUsers | null
  crudService: ReturnType<typeof useCrud>
}>()

const userLoaded = computed(() => props.user !== null)

const headerMetaItems = computed(() => [
  {
    label: 'Código',
    value: props.user?.id || '-',
    icon: IconHash
  }
])
</script>

<style scoped>
.user-details {
  max-width: 100%;
}
</style>
