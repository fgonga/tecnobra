<!--
  Cartões com os dados da referência Multicaixa (Entidade / Referência / Valor / Válida até).
  Partilhado entre o wizard desktop (Step2.vue) e a página única mobile (CheckoutForm.vue)
  para não divergirem.
-->
<template>
  <div class="w-100 mx-auto" style="max-width: 480px">
    <div class="alert alert-success w-100 mb-2 py-2 text-center" role="alert">
      <div class="w-100">
        <h4 class="alert-heading fw-bold mb-1">Referência gerada com sucesso</h4>
        <p class="mb-0 small">
          Use os dados abaixo para pagar no Multicaixa Express, ATM ou Internet Banking.
        </p>
      </div>
    </div>
    <div class="w-100 mb-3">
      <!-- Entidade — card inteiro clicável: clicou, copiou -->
      <div
        class="ref-row d-flex justify-content-between align-items-center border rounded p-2 mb-2 ref-copy"
        role="button"
        title="Clique para copiar"
        @click="copy(entity, 'entity')"
      >
        <span class="text-muted">Entidade</span>
        <div class="text-end">
          <strong class="fs-3 d-block lh-1">{{ entity }}</strong>
          <small :class="copied === 'entity' ? 'text-success' : 'text-muted'">
            {{ copied === 'entity' ? 'Copiado!' : 'Toque para copiar' }}
          </small>
        </div>
      </div>
      <!-- Referência — card inteiro clicável: clicou, copiou -->
      <div
        class="ref-row d-flex justify-content-between align-items-center border rounded p-2 mb-2 ref-copy"
        role="button"
        title="Clique para copiar"
        @click="copy(referenceNumber, 'reference')"
      >
        <span class="text-muted">Referência</span>
        <div class="text-end">
          <strong class="fs-3 d-block lh-1">{{ referenceNumber }}</strong>
          <small :class="copied === 'reference' ? 'text-success' : 'text-muted'">
            {{ copied === 'reference' ? 'Copiado!' : 'Toque para copiar' }}
          </small>
        </div>
      </div>
      <div class="ref-row d-flex justify-content-between align-items-center border rounded p-2 mb-2">
        <span class="text-muted">Valor</span>
        <strong class="fs-3">{{ toMoney(amount) }} Kz</strong>
      </div>
      <div class="ref-row d-flex justify-content-between align-items-center border rounded p-2">
        <span class="text-muted">Válida até</span>
        <strong class="fs-3 text-end">{{ formatDueDate(dueDate) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import toMoney from '@common/application/utils/money.ts'
import notification from '@/common/application/utils/notification'

defineProps<{
  entity: string
  referenceNumber: string
  amount: number
  dueDate: string
}>()

const copied = ref<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const COPY_LABELS: Record<string, string> = {
  entity: 'Entidade copiada',
  reference: 'Referência copiada',
}

async function copy(value: string | number, field: string) {
  const text = String(value ?? '')
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // fallback para contextos sem Clipboard API (http / browsers antigos)
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = field
  notification.success(COPY_LABELS[field] ?? 'Copiado')
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = null), 1500)
}

function formatDueDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}
</script>

<style scoped>
/* Todos os cards com a mesma altura (compacta), independente de 1 ou 2 linhas. */
.ref-row {
  min-height: 4rem;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}
.ref-row small {
  font-size: 0.7rem;
  line-height: 1;
}
.ref-copy {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.ref-copy:hover {
  background-color: var(--tblr-bg-surface-secondary, #f8f9fa);
}
.ref-copy:active {
  background-color: var(--tblr-bg-surface-tertiary, #f1f3f5);
}
</style>
