<template>
  <div class="partner-details">
    <LoadingState v-if="!partnerLoaded" />
    <EmptyState v-else-if="!influencer" message="Nenhum parceiro seleccionado" />
    <div v-else class="partner-content">
      <PageHeader
        :title="influencer.name"
        :status-label="influencer.status ? 'Activo' : 'Inactivo'"
        :meta-items="headerMetaItems"
      />

      <InfoSection title="Identificação" :icon="IconId">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconCircleCheck" label="Estado" :value="influencer.status ? 'Activo' : 'Inactivo'" />
          <InfoCard :icon="IconHash" label="ID" :value="influencer.id" />
          <InfoCard :icon="IconTag" label="Nome" :value="influencer.name" />
          <InfoCard :icon="IconPhone" label="Telefone" :value="influencer.phone || '—'" />
          <InfoCard :icon="IconMail" label="E-mail" :value="influencer.email || '—'" />
        </ResponsiveGrid>
      </InfoSection>

      <InfoSection title="Comissões & Cupão" :icon="IconReceipt2">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconDiscount2" label="Cupão" :value="influencer.coupon ? influencer.coupon.name + ' — ' + influencer.coupon.percentage + '%' : '—'" />
          <InfoCard :icon="IconPercentage" label="Comissão" :value="influencer.commission + ' %'" />
        </ResponsiveGrid>
      </InfoSection>

      <InfoSection title="Conta bancária & Repasse" :icon="IconBuildingBank">
        <ResponsiveGrid columns="2">
          <InfoCard :icon="IconBuildingBank" label="Banco" :value="influencer.bank_name || '—'" />
          <InfoCard :icon="IconUser" label="Titular" :value="influencer.bank_account_name || '—'" />
          <InfoCard :icon="IconCreditCard" label="IBAN / Conta" :value="influencer.bank_account_number || '—'" />
          <InfoCard
            :icon="IconCash"
            label="Mínimo de repasse"
            :value="influencer.min_payout_kz != null ? Number(influencer.min_payout_kz).toLocaleString('pt-AO') + ' Kz' : 'Global (parametrização)'"
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
  IconId,
  IconReceipt2,
  IconDiscount2,
  IconPercentage,
  IconPhone,
  IconMail,
  IconCircleCheck,
  IconBuildingBank,
  IconUser,
  IconCreditCard,
  IconCash,
} from '@tabler/icons-vue'
import { computed } from 'vue'
import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import type { useCrud } from '@common/presentation/hooks/useCrud'

const props = defineProps<{
  influencer?: any | null
  crudService: ReturnType<typeof useCrud>
}>()

const partnerLoaded = computed(() => props.influencer !== null)
const headerMetaItems = computed(() => [
  {
    label: 'ID',
    value: props.influencer?.id || '—',
    icon: IconHash,
  },
  {
    label: 'Cupão',
    value: props.influencer?.coupon?.code || '—',
    icon: IconDiscount2,
  },
])
</script>

<style scoped>
.partner-details { max-width: 100%; }
</style>
