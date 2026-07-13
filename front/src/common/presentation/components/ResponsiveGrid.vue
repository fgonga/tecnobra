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
    <div class="responsive-grid" :style="gridStyle">
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    columns?: number;
    columnsTablet?: number;
    columnsMobile?: number;
    minWidth?: string;
    gap?: 'sm' | 'md' | 'lg' | 'xl' | 'xs';
}

const props = withDefaults(defineProps<Props>(), {
    columns: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    minWidth: '200px',
    gap: 'xs'
});

const gridStyle = computed(() => {
    return {
        gridTemplateColumns: `repeat(${props.columns}, minmax(${props.minWidth}, 1fr))`,
        gap: getGapSize(props.gap)
    };
});

function getGapSize(gap: string): string {
    switch (gap) {
        case 'xs': return '5px';
        case 'sm': return 'var(--space-md)';
        case 'md': return 'var(--space-lg)';
        case 'lg': return 'var(--space-xl)';
        case 'xl': return 'var(--space-2xl)';
        default: return 'var(--space-xl)';
    }
}
</script>

<style scoped>
.responsive-grid {
    display: grid;
}

@media (max-width: 1024px) {
    .responsive-grid {
        grid-template-columns: repeat(v-bind(columnsTablet), minmax(v-bind(minWidth), 1fr)) !important;
    }
}

@media (max-width: 768px) {
    .responsive-grid {
        grid-template-columns: repeat(v-bind(columnsMobile), minmax(v-bind(minWidth), 1fr)) !important;
    }
}
</style>

