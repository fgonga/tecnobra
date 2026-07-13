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
    <div class="info-section animate-fade-in-up">
        <div class="section-header">
            <component :is="icon" class="section-icon" />
            <h3 class="section-title">{{ title }}</h3>
            <div class="section-actions" v-if="$slots.actions">
                <slot name="actions" />
            </div>
        </div>
        <div class="section-content">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title: string;
    icon: any;
}

defineProps<Props>();
</script>

<style scoped>
.info-section {
    background: var(--white);
    border-radius: 0px;
    padding: var(--space-lg);
    margin-bottom: 0px;
    /* box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); */
    box-shadow: none;
    /* border: 1px solid var(--gray-200); */
    border-width: 0px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    padding-bottom: var(--space-md);
    border-bottom: 2px solid var(--gray-50);
}

.section-icon {
    width: 24px;
    height: 24px;
    color: var(--primary-color);
    background: rgba(102, 126, 234, 0.1);
    border-radius: var(--radius-md);
    padding: 4px;
    flex-shrink: 0;
}

.section-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--gray-700);
    flex: 1;
}

.section-actions {
    display: flex;
    gap: var(--space-sm);
}

.section-content {
    /* O conteúdo será definido pelo slot */
}

@media (max-width: 768px) {
    .info-section {
        padding: var(--space-md);
    }

    .section-header {
        flex-wrap: wrap;
    }
}
</style>
