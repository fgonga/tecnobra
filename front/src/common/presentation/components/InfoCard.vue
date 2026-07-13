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
    <div class="info-card" :class="[
        `info-card--${variant}`,
        { 'info-card--copyable': copyable },
        classes
    ]" @click="copyable ? copyValue() : null">
        <div v-if="icon" class="info-icon-wrapper" :class="`info-icon-wrapper`">
            <component :is="icon" class="info-icon" />
        </div>
        <div class="info-content">
            <div class="info-label">{{ label }}</div>

            <!-- Chip variant -->
            <div v-if="variant === 'chip' && value" class="info-chip" :class="`info-chip--${color}`">
                {{ value }}
            </div>

            <!-- Default or highlight variant -->
            <div v-else class="info-value" :class="[
                // `info-value--${status || color}`,
                `info-value`,
                { 'info-value--highlight': variant === 'highlight' }
            ]">
                {{ value || emptyText }}
            </div>

            <div class="info-description" v-if="description">{{ description }}</div>
            <div class="info-actions" v-if="$slots.actions">
                <slot name="actions" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    icon?: any;
    label: string;
    value?: string | number;
    description?: string;
    variant?: 'default' | 'compact' | 'highlight' | 'chip';
    status?: 'active' | 'inactive' | 'warning' | 'success';
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    copyable?: boolean;
    emptyText?: string;
    classes?: string;
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    color: 'primary',
    copyable: false,
    emptyText: '-',
    classes: ''
});

const copyValue = () => {
    if (props.copyable && props.value) {
        navigator.clipboard.writeText(String(props.value));
        // Opcional: adicionar algum feedback visual para o usuário
    }
};

const valueClass = computed(() => {
    if (props.status) {
        return `info-value--${props.status}`;
    }
    if (props.color) {
        return `info-value--${props.color}`;
    }
    return '';
});
</script>

<style scoped>
.info-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
}

.info-card--default {
    background-color: transparent;
}

.info-card--compact {
    padding: var(--space-xs) var(--space-sm);
    gap: var(--space-xs);
}

.info-card--highlight {
    background-color: var(--gray-50);
    border-left: 3px solid var(--primary-color);
}

.info-card--copyable {
    cursor: pointer;
}

.info-card--copyable:hover .info-value {
    text-decoration: underline;
    text-decoration-style: dotted;
}

.info-icon-wrapper {
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.info-icon-wrapper--primary {
    background: var(--primary-gradient);
}

.info-icon-wrapper--secondary {
    background: linear-gradient(135deg, var(--gray-500), var(--gray-600));
}

.info-icon-wrapper--success,
.info-icon-wrapper--active {
    background: linear-gradient(135deg, var(--status-active), #2e7d32);
}

.info-icon-wrapper--error,
.info-icon-wrapper--inactive {
    background: linear-gradient(135deg, #f44336, #d32f2f);
}

.info-icon-wrapper--warning {
    background: linear-gradient(135deg, var(--status-pending), #f57c00);
}

.info-icon-wrapper--info {
    background: linear-gradient(135deg, #2196f3, #1976d2);
}

.info-icon {
    width: 16px;
    height: 16px;
}

.info-content {
    flex: 1;
    min-width: 0;
}

.info-label {
    font-size: 0.75rem;
    color: var(--gray-500);
    font-weight: 500;
    margin-bottom: 0.125rem;
    line-height: 1.2;
}

.info-value {
    font-size: 0.875rem;
    /* font-weight: 600; */
    color: var(--gray-800);
    line-height: 1.2;
    word-break: break-word;
}

.info-value--highlight {
    font-size: 0.95rem;
    font-weight: 700;
}

.info-value--primary {
    color: var(--primary-color);
}

.info-value--secondary {
    color: var(--gray-700);
}

.info-value--success,
.info-value--active {
    color: var(--status-active);
}

.info-value--error,
.info-value--inactive {
    color: #d32f2f;
}

.info-value--warning {
    color: var(--status-pending);
}

.info-value--info {
    color: #1976d2;
}

.info-chip {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
    border: 1px solid;
}

.info-chip--primary {
    color: var(--primary-color);
    background-color: rgba(var(--primary-color-rgb), 0.1);
    border-color: var(--primary-color);
}

.info-chip--secondary {
    color: var(--gray-700);
    background-color: var(--gray-100);
    border-color: var(--gray-300);
}

.info-chip--success {
    color: var(--status-active);
    background-color: rgba(var(--status-active-rgb), 0.1);
    border-color: var(--status-active);
}

.info-chip--error {
    color: #d32f2f;
    background-color: rgba(211, 47, 47, 0.1);
    border-color: #d32f2f;
}

.info-chip--warning {
    color: var(--status-pending);
    background-color: rgba(var(--status-pending-rgb), 0.1);
    border-color: var(--status-pending);
}

.info-chip--info {
    color: #1976d2;
    background-color: rgba(25, 118, 210, 0.1);
    border-color: #1976d2;
}

.info-description {
    font-size: 0.75rem;
    color: var(--gray-500);
    line-height: 1.2;
    margin-top: 0.125rem;
}

.info-actions {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
    margin-top: var(--space-xs);
}
</style>
