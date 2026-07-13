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
  <div class="course-details">
    <LoadingState v-if="course === null" />
    <EmptyState v-else-if="!course" message="Nenhum curso selecionado" />

    <div v-else class="course-content">
      <PageHeader
        :title="course.name"
        status="active"
        status-label="Ativo"
        :meta-items="headerMetaItems"
      />

      <div class="course-card-image d-flex justify-content-start px-4 w-100" v-if="course.course_card_image_url">
        <img class="w-100" :src="course.course_card_image_url" :alt="course.name" />
      </div>

      <InfoSection title="Informações principais" :icon="IconFileText">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconFileText" label="Slug" :value="course.slug" />
          <InfoCard :icon="IconTags" label="Preço" :value="formatPrice(course.price)" />
          <InfoCard :icon="IconClock" label="Dias até Expirar" :value="course.days_until_expiry" />
        </ResponsiveGrid>
        <div class="description-box px-2" v-html="course.description || 'Sem descrição disponível.'"></div>
      </InfoSection>

      <InfoSection title="Identificação" :icon="IconFileText">
        <ResponsiveGrid>
          <InfoCard :icon="IconHash" label="ID" :value="course.id" />
          <InfoCard :icon="IconHash" label="Thinkific ID" :value="course.thinkific_id" />
          <InfoCard :icon="IconTag" label="Produto (ID)" :value="course.product_id" />
        </ResponsiveGrid>
      </InfoSection>

      <InfoSection v-if="parsedLevels.length" title="Níveis" :icon="IconFileText">
        <div class="levels-list">
          <div
            v-for="(level, index) in parsedLevels"
            :key="index"
            class="level-item"
          >
            <div class="d-flex justify-content-between align-items-center">
              <h4 class="mb-1">Nível {{ index + 1 }} – {{ level.title }}</h4>
            </div>
            <p class="mb-0">{{ level.description }}</p>
          </div>
        </div>
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
} from '@tabler/icons-vue';

import LoadingState from '@components/LoadingState.vue';
import EmptyState from '@components/EmptyState.vue';
import PageHeader from '@components/PageHeader.vue';
import InfoSection from '@components/InfoSection.vue';
import InfoCard from '@components/InfoCard.vue';
import ResponsiveGrid from '@components/ResponsiveGrid.vue';
import { computed } from 'vue';
import { ICourse } from '../../application/dtos';
import type { useCrud } from '@common/presentation/hooks/useCrud';

const props = defineProps<{
  course?: ICourse | null;
  crudService: ReturnType<typeof useCrud>;
}>();

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2
  }).format(price || 0);

const headerMetaItems = computed(() => [
  {
    label: 'Código Interno',
    value: props.course?.id || '-',
    icon: IconHash
  },
  {
    label: 'Tipo',
    value: props.course?.thinkific_type || 'course',
    icon: IconTag
  }
]);

// converte o campo JSON `levels` (string, null ou objeto) num array válido
const parsedLevels = computed(() => {
  if (!props.course?.levels) return [];
  try {
    const data =
      typeof props.course.levels === 'string'
        ? JSON.parse(props.course.levels)
        : props.course.levels;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
});
</script>

<style scoped>
.course-details {
  max-width: 100%;
}

.course-card-image {
  margin: 1.5rem 0;
  text-align: center;
}

.course-card-image img {
  max-width: 320px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.description-box {
  background: #f9fafb;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  color: #374151;
  line-height: 1.6;
}

.levels-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.level-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.level-item h4 {
  margin: 0;
  font-weight: 600;
  color: #1f2937;
}

.level-item p {
  margin: 0;
  color: #4b5563;
}
</style>
