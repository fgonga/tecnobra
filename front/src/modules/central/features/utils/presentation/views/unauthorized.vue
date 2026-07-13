<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte,
  -  é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
-->

<template>
  <div class="page page-center">
    <div class="container-tight py-5 text-center">
      <div class="empty">
        <div class="empty-icon mb-3">
          <IconLock size="72" stroke="1.5" class="text-danger mb-3" />
        </div>
        <p class="empty-title h3 mb-2">Acesso Não Autorizado</p>
        <p class="empty-subtitle text-muted">
          Lamentamos, mas não tem permissão para aceder a esta secção do sistema.
        </p>
        <div class="empty-action mt-4">
          <router-link to="/central/dashboard" class="btn btn-primary">
            <i class="ti ti-home me-1"></i> Voltar ao Início
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IconLock, IconHome } from '@tabler/icons-vue'
</script>

<style scoped>
.page-center {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tblr-bg-surface, #f8f9fa);
}
.empty-icon i {
  line-height: 1;
}
</style>
