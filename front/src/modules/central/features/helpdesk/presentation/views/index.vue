<template>
  <div class="container-xl py-4">
    <div class="page-header mb-4">
      <div class="row align-items-center">
        <div class="col">
          <h2 class="page-title">Helpdesk</h2>
          <div class="text-muted mt-1">Funções auxiliares e operações manuais</div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <div class="input-group input-group-lg">
        <span class="input-group-text">
          <i class="ti ti-search"></i>
        </span>
        <input
          v-model="search"
          type="text"
          class="form-control"
          placeholder="Pesquisar acção..."
          autofocus
        />
        <button v-if="search" class="btn btn-outline-secondary" @click="search = ''">
          <i class="ti ti-x"></i>
        </button>
      </div>
    </div>

    <div v-if="filteredActions.length" class="row g-3">
      <div
        v-for="action in filteredActions"
        :key="action.id"
        class="col-12 col-sm-6 col-lg-4"
      >
        <div class="card card-link card-link-pop h-100" role="button" @click="openModal(action)">
          <div class="card-body d-flex align-items-start gap-3">
            <span class="avatar avatar-md" :class="`bg-${action.color}-lt text-${action.color}`">
              <i :class="`ti ${action.icon}`"></i>
            </span>
            <div>
              <div class="fw-semibold">{{ action.name }}</div>
              <div class="text-muted small mt-1">{{ action.description }}</div>
              <span class="badge mt-2" :class="`bg-${action.color}-lt text-${action.color}`">
                {{ action.category }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <div class="empty-icon">
        <i class="ti ti-search-off"></i>
      </div>
      <p class="empty-title">Nenhuma acção encontrada</p>
      <p class="empty-subtitle text-muted">Para "{{ search }}"</p>
    </div>
  </div>

  <ModalSendDayResume ref="modalSendDayResume" />
  <ModalReconciliation ref="modalReconciliation" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ModalSendDayResume from '../components/modals/ModalSendDayResume.vue'
import ModalReconciliation from '../components/modals/ModalReconciliation.vue'

interface HelpdeskAction {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  modal: string
}

const search = ref('')

const actions: HelpdeskAction[] = [
  {
    id: 'send-day-resume',
    name: 'Enviar Resumo Diário',
    description: 'Envia o resumo diário de vendas e encomendas para o grupo do WhatsApp.',
    icon: 'ti-brand-whatsapp',
    color: 'green',
    category: 'WhatsApp',
    modal: 'send-day-resume',
  },
  {
    id: 'reconcile-payments',
    name: 'Reconciliar Pagamentos',
    description: 'Compara o estado dos pagamentos no sistema com a AppyPay para identificar webhooks perdidos.',
    icon: 'ti-refresh-alert',
    color: 'orange',
    category: 'AppyPay',
    modal: 'reconcile-payments',
  },
]

const filteredActions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return actions
  return actions.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
  )
})

const modalSendDayResume   = ref<InstanceType<typeof ModalSendDayResume> | null>(null)
const modalReconciliation  = ref<InstanceType<typeof ModalReconciliation> | null>(null)

const modalMap: Record<string, () => void> = {
  'send-day-resume':    () => modalSendDayResume.value?.show(),
  'reconcile-payments': () => modalReconciliation.value?.show(),
}

function openModal(action: HelpdeskAction) {
  modalMap[action.modal]?.()
}
</script>
