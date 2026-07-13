<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
-->
<template>
  <div class="coupon-details">
    <LoadingState v-if="coupon === null" />
    <EmptyState v-else-if="!coupon" message="Nenhum cupom selecionado" />

    <div v-else class="coupon-content">
      <PageHeader
        :title="coupon.name"
        :status="coupon.active ? 'active' : 'inactive'"
        :status-label="coupon.active ? 'Ativo' : 'Inativo'"
        :meta-items="headerMetaItems"
      />

      <InfoSection title="Informações do Cupom" :icon="IconFileText">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconHash" label="Código" :value="coupon.code" />
          <InfoCard :icon="IconTags" label="Valor Fixo" :value="toMoney(coupon.amount)" />
          <InfoCard :icon="IconTag" label="Desconto (%)" :value="toMoney(coupon.percentage)" />
          <InfoCard :icon="IconClock" label="Expira em" :value="toData(coupon.expire_at)" />
        </ResponsiveGrid>
      </InfoSection>

      <InfoSection title="Identificação" :icon="IconHash">
        <ResponsiveGrid>
          <InfoCard :icon="IconHash" label="ID Interno" :value="coupon.id" />
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

import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import { computed } from 'vue'
import type { ICoupon } from '../../application/dtos'
import type { useCrud } from '@common/presentation/hooks/useCrud'
import { toData } from "@/common/application/utils/date";
import  toMoney  from "@/common/application/utils/money";
const props = defineProps<{
  coupon?: ICoupon | null
  crudService: ReturnType<typeof useCrud>
}>()

const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2
  }).format(value || 0)

const headerMetaItems = computed(() => [
  {
    label: 'Código',
    value: props.coupon?.code || '-',
    icon: IconHash
  },
  {
    label: 'Estado',
    value: props.coupon?.active ? 'Ativo' : 'Inativo',
    icon: IconTag
  }
])
</script>

<style scoped>
.coupon-details {
  max-width: 100%;
}
.coupon-content {
  padding: 1rem 0;
}
</style>
