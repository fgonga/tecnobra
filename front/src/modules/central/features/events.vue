<template>
  <div class="page-body">
    <div class="container-xl">

      <div class="page-header mb-3">
        <div class="row align-items-center">
          <div class="col">
            <h2 class="page-title">Eventos</h2>
            <p class="text-muted mb-0">Monitorização e debug dos eventos enviados à plataforma de parceiros</p>
          </div>
          <div class="col-auto d-flex gap-2 align-items-center">
            <label class="form-check form-switch mb-0 me-2">
              <input class="form-check-input" type="checkbox" v-model="autoRefresh" />
              <span class="form-check-label small">Auto-refresh (5s)</span>
            </label>
            <button class="btn btn-outline-secondary btn-sm" @click="load" :disabled="loading">
              {{ loading ? 'A carregar...' : 'Atualizar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Contadores -->
      <div class="row g-2 mb-3">
        <div class="col-6 col-md-3" v-for="s in statusSummary" :key="s.status">
          <div
            class="card card-sm"
            :class="[s.borderClass, filters.status === s.status ? s.bgClass : '']"
            style="cursor:pointer; border-width:2px"
            @click="setFilter(s.status)"
          >
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center">
                <div class="small fw-semibold">{{ s.label }}</div>
                <div class="fw-bold fs-4">{{ s.count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-end">
            <div class="col-auto">
              <label class="form-label mb-1 small">Estado</label>
              <select class="form-select form-select-sm" v-model="filters.status" @change="page = 1; load()">
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="processing">A processar</option>
                <option value="processed">Processado</option>
                <option value="failed">Falhou</option>
              </select>
            </div>
            <div class="col-auto">
              <label class="form-label mb-1 small">Tipo</label>
              <select class="form-select form-select-sm" v-model="filters.type" @change="page = 1; load()">
                <option value="">Todos</option>
                <option value="payment_success">payment_success</option>
                <option value="payment_refund">payment_refund</option>
                <option value="course_update">course_update</option>
              </select>
            </div>
            <div class="col-auto ms-auto d-flex align-items-end">
              <span class="text-muted small">{{ total }} evento(s)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela + painel de detalhe -->
      <div class="row g-3">

        <div :class="detail ? 'col-md-5' : 'col-12'">
          <div class="card">
            <div class="card-body p-0">
              <div v-if="loading && !events.length" class="p-4 text-center text-muted">A carregar...</div>
              <div v-else-if="!events.length" class="p-4 text-center text-muted">Sem eventos encontrados.</div>
              <div v-else class="table-responsive">
                <table class="table table-vcenter table-hover table-sm mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Tent.</th>
                      <th>Criado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="ev in events" :key="ev.id"
                      :class="{ 'table-active': detail?.id === ev.id }"
                      style="cursor:pointer"
                      @click="openDetail(ev)"
                    >
                      <td class="text-muted small">#{{ ev.id }}</td>
                      <td><code class="small">{{ ev.type }}</code></td>
                      <td><span class="badge" :class="statusClass(ev.status)">{{ statusLabel(ev.status) }}</span></td>
                      <td class="text-center text-muted small">{{ ev.retry_count }}/{{ ev.max_retries }}</td>
                      <td class="text-muted small">{{ fmtDate(ev.created_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="total > perPage" class="card-footer d-flex align-items-center justify-content-between py-2">
              <span class="text-muted small">Página {{ page }} / {{ Math.ceil(total / perPage) }}</span>
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="page--; load()">Anterior</button>
                <button class="btn btn-sm btn-outline-secondary" :disabled="page * perPage >= total" @click="page++; load()">Seguinte</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Painel de detalhe -->
        <div class="col-md-7" v-if="detail">
          <div class="card" style="position:sticky;top:16px">
            <div class="card-header d-flex align-items-center justify-content-between py-2">
              <div>
                <span class="fw-semibold">Evento #{{ detail.id }}</span>
                <code class="ms-2 small text-muted">{{ detail.type }}</code>
                <span class="badge ms-2" :class="statusClass(detail.status)">{{ statusLabel(detail.status) }}</span>
              </div>
              <button class="btn btn-sm btn-outline-secondary" @click="detail = null">Fechar</button>
            </div>
            <div class="card-body" style="overflow-y:auto;max-height:82vh">

              <!-- Métricas -->
              <div class="row g-2 mb-3 text-center">
                <div class="col-4 border-end">
                  <div class="small text-muted">Tentativas</div>
                  <div class="fw-bold">{{ detail.retry_count }} / {{ detail.max_retries }}</div>
                </div>
                <div class="col-4 border-end">
                  <div class="small text-muted">Criado</div>
                  <div class="small">{{ fmtDate(detail.created_at) }}</div>
                </div>
                <div class="col-4">
                  <div class="small text-muted">Processado</div>
                  <div class="small">{{ fmtDate(detail.processed_at) || '—' }}</div>
                </div>
              </div>

              <!-- Próxima tentativa -->
              <div v-if="detail.next_retry_at" class="alert alert-warning py-2 small mb-3">
                Próxima tentativa automática: <strong>{{ fmtDateFull(detail.next_retry_at) }}</strong>
              </div>

              <!-- Último erro — sempre visível se existir -->
              <div class="mb-3">
                <div class="small fw-semibold text-muted mb-1">Último erro</div>
                <div v-if="detail.last_error" class="alert alert-danger py-2 mb-0">
                  <pre class="mb-0 small" style="white-space:pre-wrap;word-break:break-word">{{ detail.last_error }}</pre>
                </div>
                <div v-else class="text-muted small fst-italic">Sem erros registados</div>
              </div>

              <!-- unique_code -->
              <div class="mb-3">
                <div class="small fw-semibold text-muted mb-1">unique_code</div>
                <code class="small">{{ detail.unique_code }}</code>
              </div>

              <!-- Payload -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="small fw-semibold text-muted">Payload</div>
                  <button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:0.75rem" @click="copyPayload">
                    {{ copied ? 'Copiado!' : 'Copiar JSON' }}
                  </button>
                </div>
                <pre class="bg-dark text-light p-3 rounded small mb-0" style="max-height:300px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:0.72rem">{{ prettyPayload(detail.payload) }}</pre>
              </div>

              <!-- Ações -->
              <div class="d-flex gap-2 flex-wrap">
                <button
                  class="btn btn-warning"
                  :disabled="executing"
                  @click="executeWithLogs(detail)"
                >
                  {{ executing ? 'A executar...' : 'Tentar novamente' }}
                </button>
                <button
                  v-if="detail.status === 'processing'"
                  class="btn btn-outline-secondary"
                  :disabled="executing"
                  @click="executeWithLogs(detail)"
                >
                  Forçar execução
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de execução com logs -->
    <div v-if="execModal" class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,.6)" @click.self="execModal = null">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Execução — Evento #{{ execModal.eventId }}
              <span v-if="execModal.running" class="spinner-border spinner-border-sm ms-2 text-primary"></span>
            </h5>
            <button class="btn-close" :disabled="execModal.running" @click="execModal = null"></button>
          </div>
          <div class="modal-body p-0">

            <!-- Resultado final -->
            <div v-if="!execModal.running && execModal.result" class="p-3 border-bottom">
              <div class="d-flex align-items-center gap-2">
                <span v-if="execModal.result.success" class="badge bg-success fs-6">Sucesso</span>
                <span v-else class="badge bg-danger fs-6">Falhou</span>
                <span v-if="execModal.result.httpStatus" class="badge bg-secondary">HTTP {{ execModal.result.httpStatus }}</span>
              </div>
              <div v-if="execModal.result.httpData" class="mt-2">
                <div class="small text-muted mb-1">Resposta do servidor parceiros:</div>
                <pre class="bg-dark text-light p-2 rounded small mb-0" style="max-height:150px;overflow:auto;white-space:pre-wrap;font-size:0.72rem">{{ JSON.stringify(execModal.result.httpData, null, 2) }}</pre>
              </div>
            </div>

            <!-- Logs -->
            <div class="p-0">
              <div
                ref="logsContainer"
                class="bg-dark text-light p-3"
                style="min-height:300px;max-height:450px;overflow-y:auto;font-family:monospace;font-size:0.75rem"
              >
                <div
                  v-for="(line, i) in execModal.logs"
                  :key="i"
                  :class="line.level === 'error' ? 'text-danger' : 'text-light'"
                  class="mb-1"
                >
                  <span class="text-secondary me-2">{{ fmtTime(line.ts) }}</span>
                  <span :class="line.level === 'error' ? 'text-danger' : 'text-success'" class="me-2 fw-bold">[{{ line.level.toUpperCase() }}]</span>
                  <span style="white-space:pre-wrap;word-break:break-word">{{ line.msg }}</span>
                </div>
                <div v-if="execModal.running" class="text-warning mt-2">
                  <span class="me-1">▶</span> A executar...
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" :disabled="execModal.running" @click="execModal = null">Fechar</button>
            <button
              v-if="!execModal.running"
              class="btn btn-warning"
              @click="executeWithLogs(detail)"
            >
              Executar novamente
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { API } from '@common/domain/services/api'

const events   = ref<any[]>([])
const total    = ref(0)
const page     = ref(1)
const perPage  = ref(30)
const loading  = ref(false)
const executing = ref(false)
const detail   = ref<any | null>(null)
const copied   = ref(false)
const autoRefresh = ref(false)
const filters  = ref({ status: '', type: '' })
const execModal = ref<{
  eventId: number
  running: boolean
  logs: { ts: string; level: string; msg: string }[]
  result: any | null
} | null>(null)
const logsContainer = ref<HTMLElement | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const counts = ref<Record<string, number>>({ pending: 0, processing: 0, processed: 0, failed: 0 })

const statusSummary = computed(() => [
  { status: 'pending',    label: 'Pendentes',   borderClass: 'border-warning', bgClass: 'bg-warning-lt', count: counts.value.pending    ?? 0 },
  { status: 'processing', label: 'A processar', borderClass: 'border-primary', bgClass: 'bg-primary-lt', count: counts.value.processing ?? 0 },
  { status: 'processed',  label: 'Processados', borderClass: 'border-success', bgClass: 'bg-success-lt', count: counts.value.processed  ?? 0 },
  { status: 'failed',     label: 'Com falha',   borderClass: 'border-danger',  bgClass: 'bg-danger-lt',  count: counts.value.failed     ?? 0 },
])

async function load() {
  loading.value = true
  try {
    const params: any = { page: page.value, perPage: perPage.value }
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.type)   params.type   = filters.value.type
    const { data } = await API.get('/api/v1/events', { params })
    events.value = data.data
    total.value  = data.total

    // Actualiza contadores
    const c: Record<string, number> = { pending: 0, processing: 0, processed: 0, failed: 0 }
    for (const ev of events.value) if (ev.status in c) c[ev.status]++
    counts.value = c

    // Actualiza painel de detalhe
    if (detail.value) {
      const updated = events.value.find(e => e.id === detail.value.id)
      if (updated) detail.value = { ...updated }
    }
  } finally {
    loading.value = false
  }
}

// Executa o evento e abre modal com logs
async function executeWithLogs(ev: any) {
  if (!ev) return
  executing.value = true
  execModal.value = { eventId: ev.id, running: true, logs: [], result: null }

  try {
    const { data } = await API.post(`/api/v1/events/${ev.id}/execute`)
    execModal.value.logs   = data.logs   ?? []
    execModal.value.result = data
    execModal.value.running = false
    await load()
  } catch (err: any) {
    const errData = err?.response?.data
    execModal.value.logs = [
      ...(execModal.value.logs ?? []),
      { ts: new Date().toISOString(), level: 'error', msg: errData?.message ?? err?.message ?? 'Erro desconhecido' }
    ]
    execModal.value.result  = { success: false, httpStatus: err?.response?.status }
    execModal.value.running = false
  } finally {
    executing.value = false
    await nextTick()
    if (logsContainer.value) logsContainer.value.scrollTop = logsContainer.value.scrollHeight
  }
}

function openDetail(ev: any) { detail.value = { ...ev } }

function setFilter(status: string) {
  filters.value.status = filters.value.status === status ? '' : status
  page.value = 1
  load()
}

function prettyPayload(payload: any) {
  try {
    const p = typeof payload === 'string' ? JSON.parse(payload) : payload
    if (p?.payload && typeof p.payload === 'string') {
      try { p.payload = JSON.parse(p.payload) } catch { /* mantém string */ }
    }
    return JSON.stringify(p, null, 2)
  } catch { return String(payload) }
}

async function copyPayload() {
  await navigator.clipboard.writeText(prettyPayload(detail.value?.payload))
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function statusClass(s: string) {
  return { pending: 'bg-warning', processing: 'bg-primary', processed: 'bg-success', failed: 'bg-danger' }[s] ?? 'bg-secondary'
}
function statusLabel(s: string) {
  return { pending: 'Pendente', processing: 'A processar', processed: 'Processado', failed: 'Falhou' }[s] ?? s
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
}
function fmtDateFull(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'medium' })
}
function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

watch(autoRefresh, (val) => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (val) refreshTimer = setInterval(load, 5000)
})


onMounted(load)
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>
