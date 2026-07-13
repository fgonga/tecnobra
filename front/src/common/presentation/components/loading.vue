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
  <div class="page page-center" style="height: 100vh">
    <div class="container container-slim py-4">
      <div class="text-center">
        <slot/>
        <div class="progress progress-sm">
          <div class="progress-bar progress-bar-indeterminate"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "loading"
}
</script>

<style scoped>

</style>
