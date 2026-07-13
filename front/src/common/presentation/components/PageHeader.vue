<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<template>
  <div class="page-header" :class="headerClass">
    <div style="width:100%;;display: flex; justify-content: space-between; align-items: center;">
      <div class="header-content">
        <h2 class="header-title">{{ title }}</h2>
        <div class="header-meta" v-if="metaItems.length > 0">
          <div v-for="item in metaItems" :key="item.label" class="meta-item">
            <component :is="item.icon" class="meta-icon" />
            <span>{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div class="status-badge" :class="statusClass" v-if="status">
        <component :is="statusIcon" class="status-icon" />
        <span class="status-label">{{ statusLabel }}</span>
      </div>
    </div>

    <div class="d-flex justify-content-between flex-wrap w-100" v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconAlertTriangle,
  IconPlayerPause
} from '@tabler/icons-vue';

interface MetaItem {
  label: string;
  value: string;
  icon: any;
}

interface Props {
  title: string;
  status?: string;
  statusLabel?: string;
  metaItems?: MetaItem[];
  variant?: 'default' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
  metaItems: () => [],
  variant: 'default'
});

const headerClass = computed(() => ({
  'page-header--compact': props.variant === 'compact'
}));

const statusClass = computed(() => {
  if (!props.status) return '';

  const statusClasses = {
    active: 'status-active',
    inactive: 'status-inactive',
    pending: 'status-pending',
    suspended: 'status-suspended',
    installed: 'status-active',
    new: 'status-pending',
    interested: 'status-pending',
    not_interested: 'status-inactive'
  };

  return statusClasses[props.status as keyof typeof statusClasses] || 'status-default';
});

const statusIcon = computed(() => {
  if (!props.status) return null;

  const statusIcons = {
    active: IconCircleCheck,
    inactive: IconCircleX,
    pending: IconClock,
    suspended: IconPlayerPause,
    installed: IconCircleCheck,
    new: IconAlertTriangle,
    interested: IconAlertTriangle,
    not_interested: IconCircleX
  };

  return statusIcons[props.status as keyof typeof statusIcons] || null;
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--primary-gradient);
  color: white;
  /* border-radius: var(--radius-xl); */
  /* margin-bottom: var(--space-xl); */
  margin-top: -8px;
}

.page-header--compact {
  padding: var(--space-lg);
  gap: var(--space-lg);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.status-badge.status-active {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.3);
}

.status-badge.status-inactive {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.3);
}

.status-badge.status-pending {
  background: rgba(255, 152, 0, 0.2);
  border-color: rgba(255, 152, 0, 0.3);
}

.status-badge.status-suspended {
  background: rgba(158, 158, 158, 0.2);
  border-color: rgba(158, 158, 158, 0.3);
}

.status-icon {
  width: 24px;
  height: 24px;
}

.status-label {
  font-weight: 600;
  font-size: 1rem;
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.header-meta {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  opacity: 0.9;
  font-size: 0.9rem;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
}

.meta-icon {
  width: 16px;
  height: 16px;
}

.header-actions {
  display: flex;
  gap: var(--space-sm);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-md);
  }

  .header-meta {
    justify-content: center;
  }
}
</style>
