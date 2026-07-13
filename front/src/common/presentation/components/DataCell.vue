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
  <div class="flex-filla">
    <div class="font-weight-medium">{{ mainText || "N/A" }}</div>
    <div v-if="secondaryText" class="text-muted">
      <a v-if="isLink" href="#" >{{ secondaryText }}</a>
      <span v-else class="text-muted small">{{ secondaryText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  mainText: {
    type: [String, Number],
    default: ''
  },
  secondaryText: {
    type: [String, Number],
    default: ''
  },
  isLink: {
    type: Boolean,
    default: false
  }
});
</script>
