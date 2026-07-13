<template>
  <ModalForm
    ref="modal"
    title="Reconciliar Pagamentos"
    :busy="busy"
    :errors="error"
    size="xl"
    @submit="handleSubmit"
  >
    <div class="row g-3 mb-3">
      <div class="col-md-6">
        <label class="form-label">Data inicial</label>
        <input v-model="form.start" type="date" class="form-control" :max="today" @change="activeRange = ''" />
      </div>
      <div class="col-md-6">
        <label class="form-label">Data final</label>
        <input v-model="form.end" type="date" class="form-control" :max="today" @change="activeRange = ''" />
      </div>
    </div>

    <div class="d-flex align-items-center gap-2 flex-wrap mb-3">
      <button
        v-for="r in quickRanges"
        :key="r.label"
        type="button"
        class="btn btn-sm"
        :class="activeRange === r.label ? 'btn-primary' : 'btn-outline-secondary'"
        @click="applyRange(r)"
      >
        {{ r.label }}
      </button>

      <div class="ms-auto d-flex gap-2">
        <button
          type="button"
          class="btn btn-sm btn-primary"
          :disabled="busy || applying || !form.start || !form.end"
          @click="handleSubmit"
        >
          <i class="ti ti-refresh me-1"></i>
          {{ busy ? 'Verificando...' : (result ? 'Verificar novamente' : 'Verificar') }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-warning"
          :disabled="!hasActions || applying || busy"
          @click="confirmApply"
        >
          <i class="ti ti-tool me-1"></i>
          {{ applying ? 'Aplicando...' : `Aplicar reconciliação${hasActions ? ` (${actionableCount})` : ''}` }}
        </button>
      </div>
    </div>

    <div v-if="result" class="row g-2 mb-3">
      <div class="col-12 col-md-6">
        <div class="card border-primary">
          <div class="card-body p-3">
            <div class="text-uppercase text-muted small fw-bold mb-2">AppyPay (fonte da verdade)</div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-success"><i class="ti ti-check"></i> Pagos</span>
              <span class="fw-bold">{{ result.summary.appy_success_count }} · {{ formatCurrency(result.summary.appy_success_amount) }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-danger"><i class="ti ti-x"></i> Não pagos</span>
              <span class="fw-bold">{{ result.summary.appy_unpaid_count }} · {{ formatCurrency(result.summary.appy_unpaid_amount) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="card">
          <div class="card-body p-3">
            <div class="text-uppercase text-muted small fw-bold mb-2">Sistema</div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-success"><i class="ti ti-check"></i> Pagos</span>
              <span class="fw-bold">{{ result.summary.db_paid_count }} · {{ formatCurrency(result.summary.db_paid_amount) }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-danger"><i class="ti ti-x"></i> Não pagos</span>
              <span class="fw-bold">{{ result.summary.db_unpaid_count }} · {{ formatCurrency(result.summary.db_unpaid_amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="result && hasActions" class="alert alert-warning mb-3">
      <div class="fw-bold mb-2"><i class="ti ti-alert-triangle"></i> Ações sugeridas</div>
      <div class="row g-2">
        <div v-if="result.summary.apply_paid_count" class="col-md-4">
          <span class="badge bg-success-lt text-success me-1">{{ result.summary.apply_paid_count }}</span>
          <span class="small">confirmar como pago ({{ formatCurrency(result.summary.apply_paid_amount) }})</span>
        </div>
        <div v-if="result.summary.apply_failed_count" class="col-md-4">
          <span class="badge bg-secondary-lt me-1">{{ result.summary.apply_failed_count }}</span>
          <span class="small">marcar como falhado ({{ formatCurrency(result.summary.apply_failed_amount) }})</span>
        </div>
        <div v-if="result.summary.reverse_count" class="col-md-4">
          <span class="badge bg-danger-lt text-danger me-1">{{ result.summary.reverse_count }}</span>
          <span class="small">reverter ({{ formatCurrency(result.summary.reverse_amount) }})</span>
        </div>
      </div>
    </div>

    <div v-if="result" class="d-flex gap-2 mb-2 align-items-center flex-wrap">
      <select v-model="filter" class="form-select form-select-sm" style="max-width: 280px;">
        <option value="all">Todos ({{ result.summary.total }})</option>
        <option value="actionable">Com ação ({{ actionableCount }})</option>
        <option value="match">OK ({{ result.summary.match }})</option>
      </select>
      <input v-model="search" class="form-control form-control-sm" style="max-width: 280px;" placeholder="Procurar código/cliente..." />
    </div>

    <div v-if="applyResults.length" class="alert mb-3" :class="hasFailedApplies ? 'alert-danger' : 'alert-success'">
      <div class="fw-bold mb-2">
        <i class="ti" :class="hasFailedApplies ? 'ti-alert-circle' : 'ti-check'"></i>
        Resultado: {{ appliedOk }} aplicado(s), {{ appliedFail }} com erro
      </div>
      <div v-if="hasFailedApplies" class="small">
        <div v-for="r in applyResults.filter(x => !x.ok)" :key="r.code">
          <code>{{ r.code }}</code> — {{ r.error }}
        </div>
      </div>
    </div>

    <div v-if="result" class="table-responsive border rounded" style="max-height: 50vh;">
      <table class="table table-sm table-vcenter table-hover mb-0">
        <thead class="sticky-top bg-light">
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th class="text-end">Valor</th>
            <th>Sistema</th>
            <th>AppyPay</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.payment_id" :class="rowClass(item)">
            <td><code class="small">{{ item.code }}</code></td>
            <td class="text-truncate" style="max-width: 180px;">{{ item.customer_name || '—' }}</td>
            <td><span class="text-muted small">{{ item.payment_type || '—' }}</span></td>
            <td class="text-end">
              <div>{{ formatCurrency(item.amount) }}</div>
              <div v-if="item.appy_amount !== null && item.appy_amount !== item.amount" class="small text-danger">
                Appy: {{ formatCurrency(item.appy_amount) }}
              </div>
            </td>
            <td>
              <span class="badge" :class="dbStatusBadge(item.db_status)">{{ item.db_status }}</span>
            </td>
            <td>
              <span v-if="item.appy_status" class="badge" :class="appyStatusBadge(item.appy_status)">{{ item.appy_status }}</span>
              <span v-else class="text-muted small">não encontrado</span>
              <div v-if="item.appy_updated_at" class="text-muted" style="font-size: 11px;">
                {{ formatDate(item.appy_updated_at) }}
              </div>
            </td>
            <td>
              <span class="badge" :class="actionBadgeClass(item.recommended_action)">
                {{ actionLabel(item.recommended_action) }}
              </span>
            </td>
          </tr>
          <tr v-if="!filteredItems.length">
            <td colspan="7" class="text-center text-muted py-4">Nenhum pagamento corresponde ao filtro.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="result && !result.items.length" class="alert alert-info mt-3">
      Nenhum pagamento encontrado neste período.
    </div>

    <template #footer>
      <div class="d-flex w-100 justify-content-end">
        <button type="button" class="btn btn-light" @click="modal?.canHide()">
          Fechar
        </button>
      </div>
    </template>
  </ModalForm>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import ModalForm from '@components/ModalForm.vue'
import {
  HelpdeskAPIService,
  type ReconciliationResult,
  type ReconciliationItem,
  type RecommendedAction,
  type ApplyResult,
} from '../../../domain/service/HelpdeskService'
import { formatCurrency } from '@/common/application/utils/table'

const modal    = ref<InstanceType<typeof ModalForm> | null>(null)
const busy     = ref(false)
const applying = ref(false)
const error    = ref('')
const result   = ref<ReconciliationResult | null>(null)
const filter   = ref<'all' | 'actionable' | 'match'>('all')
const search   = ref('')
const applyResults = ref<ApplyResult['results']>([])

const form = ref({ start: '', end: '' })
const activeRange = ref('')

const today = computed(() => dayjs().format('YYYY-MM-DD'))

const quickRanges = [
  { label: 'Hoje',          start: () => dayjs().format('YYYY-MM-DD'),                  end: () => dayjs().format('YYYY-MM-DD') },
  { label: 'Ontem',         start: () => dayjs().subtract(1, 'day').format('YYYY-MM-DD'), end: () => dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
  { label: 'Últimos 7 dias',start: () => dayjs().subtract(6, 'day').format('YYYY-MM-DD'), end: () => dayjs().format('YYYY-MM-DD') },
  { label: 'Este mês',      start: () => dayjs().startOf('month').format('YYYY-MM-DD'),  end: () => dayjs().format('YYYY-MM-DD') },
]

const isActionable = (a: RecommendedAction) => a === 'apply_paid' || a === 'apply_failed' || a === 'reverse'

const actionableCount = computed(() => {
  if (!result.value) return 0
  return result.value.items.filter((i) => isActionable(i.recommended_action)).length
})

const hasActions = computed(() => actionableCount.value > 0)

const filteredItems = computed<ReconciliationItem[]>(() => {
  if (!result.value) return []
  let items = result.value.items
  if (filter.value === 'actionable') items = items.filter((i) => isActionable(i.recommended_action))
  else if (filter.value === 'match') items = items.filter((i) => i.match)
  const q = search.value.trim().toLowerCase()
  if (q) {
    items = items.filter((i) =>
      i.code.toLowerCase().includes(q) ||
      (i.customer_name?.toLowerCase().includes(q) ?? false)
    )
  }
  return items
})

const appliedOk      = computed(() => applyResults.value.filter((r) => r.ok).length)
const appliedFail    = computed(() => applyResults.value.filter((r) => !r.ok).length)
const hasFailedApplies = computed(() => appliedFail.value > 0)

const applyRange = (r: typeof quickRanges[number]) => {
  form.value.start  = r.start()
  form.value.end    = r.end()
  activeRange.value = r.label
}

const formatDate = (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm')

const dbStatusBadge = (s: string) => {
  if (s === 'paid')     return 'bg-success-lt text-success'
  if (s === 'refunded') return 'bg-purple-lt text-purple'
  if (s === 'failed')   return 'bg-danger-lt text-danger'
  if (s === 'pending')  return 'bg-warning-lt text-warning'
  return 'bg-muted-lt text-muted'
}

const appyStatusBadge = (s: string) => {
  if (s === 'Success')   return 'bg-success-lt text-success'
  if (s === 'Failed')    return 'bg-danger-lt text-danger'
  if (s === 'Pending' || s === 'Requested') return 'bg-warning-lt text-warning'
  return 'bg-muted-lt text-muted'
}

const actionLabel = (a: RecommendedAction) => {
  if (a === 'apply_paid')   return 'Confirmar pago'
  if (a === 'apply_failed') return 'Marcar falhado'
  if (a === 'reverse')      return 'Reverter (estorno)'
  if (a === 'manual')       return 'Verificar manual'
  return 'OK'
}

const actionBadgeClass = (a: RecommendedAction) => {
  if (a === 'apply_paid')   return 'bg-success-lt text-success'
  if (a === 'apply_failed') return 'bg-secondary-lt'
  if (a === 'reverse')      return 'bg-danger-lt text-danger'
  if (a === 'manual')       return 'bg-warning-lt text-warning'
  return 'bg-muted-lt text-muted'
}

const rowClass = (i: ReconciliationItem) => {
  if (i.recommended_action === 'reverse')      return 'table-danger'
  if (i.recommended_action === 'apply_paid')   return 'table-success'
  if (i.recommended_action === 'apply_failed') return 'table-warning'
  if (i.recommended_action === 'manual')       return 'table-warning'
  return ''
}

const show = () => {
  form.value         = { start: dayjs().format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') }
  activeRange.value  = 'Hoje'
  result.value       = null
  error.value        = ''
  filter.value       = 'all'
  search.value       = ''
  applyResults.value = []
  modal.value?.show()
}

const handleSubmit = async () => {
  busy.value = true
  error.value = ''
  applyResults.value = []
  try {
    const res = await HelpdeskAPIService.reconcilePayments(form.value.start, form.value.end)
    result.value = (res as any).data ?? (res as ReconciliationResult)
  } catch (e: any) {
    error.value = e?.message ?? 'Erro ao reconciliar pagamentos.'
  } finally {
    busy.value = false
  }
}

const confirmApply = async () => {
  if (!result.value) return
  const reverseCount = result.value.summary.reverse_count
  let confirmMsg = `Aplicar reconciliação para ${actionableCount.value} pagamento(s)?`
  if (reverseCount > 0) {
    confirmMsg += `\n\n⚠️ ${reverseCount} pagamento(s) serão revertidos (estorno + desmatrícula). Esta ação não é facilmente reversível.`
  }
  if (!window.confirm(confirmMsg)) return

  const codes = result.value.items
    .filter((i) => isActionable(i.recommended_action))
    .map((i) => i.code)

  applying.value = true
  applyResults.value = []
  try {
    const res = await HelpdeskAPIService.applyReconciliation(codes)
    const data: ApplyResult = (res as any).data ?? (res as ApplyResult)
    applyResults.value = data.results
    // Re-rodar para refletir o novo estado
    if (data.results.some((r) => r.ok)) {
      await handleSubmit()
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Erro ao aplicar reconciliação.'
  } finally {
    applying.value = false
  }
}

defineExpose({ show })
</script>
