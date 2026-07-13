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
    <div class="empty-state">
        <div class="empty-state-container">
            <div class="empty-state-icon">
                <i class="ti ti-clipboard-x"></i>
            </div>
            <h3 class="empty-state-title">{{ message || 'Nenhum item encontrado' }}</h3>
            <p class="empty-state-description">
                {{ description || 'Assim que alguma informação for adicionada, ela será exibida aqui.' }}
            </p>
            <slot name="action"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps({
    message: {
        type: String,
        default: 'Nenhum item encontrado'
    },
    description: {
        type: String,
        default: 'Assim que alguma informação for adicionada, ela será exibida aqui.'
    }
});
</script>

<style scoped>
.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3rem 1rem;
    text-align: center;
}

.empty-state-container {
    max-width: 450px;
}

.empty-state-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    border-radius: 50%;
    background-color: rgba(var(--tblr-secondary-rgb), 0.1);
    color: var(--tblr-secondary);
    font-size: 2.5rem;
}

.empty-state-title {
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.25rem;
    color: var(--tblr-body-color);
}

.empty-state-description {
    margin-bottom: 1.5rem;
    color: var(--tblr-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
}
</style>
