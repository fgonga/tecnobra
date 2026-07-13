<template>
  <div class="page-body">
    <div class="container-xl">

      <!-- ── HEADER ─────────────────────────────────────────────────────── -->
      <div class="page-header d-print-none mb-3">
        <div class="row align-items-center">
          <div class="col">
            <div class="page-pretitle">Análise</div>
            <h2 class="page-title">Recuperação &amp; Conversão</h2>
            <p class="text-muted mb-0">Taxa de conversão, encomendas recuperadas e campanhas de recuperação</p>
          </div>
          <div class="col-auto ms-auto d-flex align-items-center gap-2 flex-wrap">
            <PeriodPicker @update:model-value="onPeriodApply" />
            <button class="btn btn-default btn-sm" @click="loadAll" :disabled="statsLoading">
              <IconRefresh size="15" :class="statsLoading ? 'spin' : ''" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── KPI CARDS ──────────────────────────────────────────────────── -->
      <div class="row g-3 mb-4">
        <!-- Taxa de Conversão -->
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card card-sm h-100">
            <div class="card-body">
              <div class="text-muted small mb-1">Taxa de Conversão</div>
              <div class="fw-bold fs-3" :class="conversionColor">{{ stats?.conversionRate ?? '—' }}%</div>
              <div class="text-muted" style="font-size:.75rem">{{ stats?.completed ?? 0 }} completadas / {{ stats?.total ?? 0 }}</div>
            </div>
          </div>
        </div>
        <!-- Recuperadas Admin -->
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card card-sm h-100">
            <div class="card-body">
              <div class="text-muted small mb-1">Recuperadas (painel)</div>
              <div class="fw-bold fs-3 text-success">{{ stats?.recoveryRecovered ?? '—' }}</div>
              <div class="text-muted" style="font-size:.75rem">Taxa {{ stats?.recoveryRate ?? 0 }}% · {{ stats?.recoverySent ?? 0 }} enviadas</div>
            </div>
          </div>
        </div>
        <!-- Abandonos Recuperados -->
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card card-sm h-100">
            <div class="card-body">
              <div class="text-muted small mb-1">Abandonos Recuperados</div>
              <div class="fw-bold fs-3 text-teal">{{ stats?.abandonedRecovered ?? '—' }}</div>
              <div class="text-muted" style="font-size:.75rem">Taxa {{ stats?.abandonedRate ?? 0 }}% · {{ stats?.abandonedSent ?? 0 }} enviadas</div>
            </div>
          </div>
        </div>
        <!-- Valor Recuperado -->
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card card-sm h-100">
            <div class="card-body">
              <div class="text-muted small mb-1">Valor Recuperado</div>
              <div class="fw-bold fs-3 text-green">{{ toMoney(totalRecoveredValue) }}</div>
              <div class="text-muted" style="font-size:.75rem">Kz — todas as campanhas</div>
            </div>
          </div>
        </div>
        <!-- Por Recuperar -->
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card card-sm h-100">
            <div class="card-body">
              <div class="text-muted small mb-1">Por Recuperar</div>
              <div class="fw-bold fs-3 text-orange">{{ stats?.pendingRecovery ?? '—' }}</div>
              <div class="text-muted" style="font-size:.75rem">sem mensagem enviada</div>
            </div>
          </div>
        </div>
        <!-- Canceladas -->
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card card-sm h-100">
            <div class="card-body">
              <div class="text-muted small mb-1">Canceladas</div>
              <div class="fw-bold fs-3 text-danger">{{ stats?.canceled ?? '—' }}</div>
              <div class="text-muted" style="font-size:.75rem">{{ stats?.pending ?? 0 }} pendentes</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TABELA DE ENCOMENDAS ────────────────────────────────────────── -->
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h3 class="card-title mb-0">Encomendas Recuperáveis</h3>
          <div v-if="selected.length" class="d-flex align-items-center gap-2">
            <span class="text-muted small">{{ selected.length }} selecionada(s)</span>
            <button class="btn btn-sm btn-success" @click="openModal">
              <IconSend size="14" class="me-1" /> Recuperar
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="card-body border-bottom pb-3">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-2">
              <label class="form-label mb-1 small">De</label>
              <input type="date" class="form-control form-control-sm" v-model="filters.start" />
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label mb-1 small">Até</label>
              <input type="date" class="form-control form-control-sm" v-model="filters.end" />
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label mb-1 small">Estado</label>
              <select class="form-select form-select-sm" v-model="filters.status">
                <option value="">Todos</option>
                <option value="canceled">Cancelados</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label mb-1 small">Pesquisa</label>
              <input type="text" class="form-control form-control-sm" placeholder="Nome ou código..." v-model="filters.search" @keyup.enter="applyFilters" />
            </div>
            <div class="col-auto">
              <button class="btn btn-sm btn-primary" @click="applyFilters" :disabled="ordersLoading">Filtrar</button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="ordersLoading" class="card-body text-center py-5">
          <div class="spinner-border" role="status"></div>
        </div>

        <!-- Tabela -->
        <div v-else class="table-responsive">
          <table class="table table-vcenter table-hover card-table">
            <thead>
              <tr>
                <th style="width:36px">
                  <input type="checkbox" class="form-check-input" :checked="allSelected" @change="toggleAll" :indeterminate="someSelected" />
                </th>
                <th>Estado</th>
                <th>Código</th>
                <th>Cliente</th>
                <th>Curso</th>
                <th>Valor</th>
                <th>Criado em</th>
                <th>Notificado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!orders.length">
                <td colspan="8" class="text-center text-muted py-4">Nenhuma encomenda encontrada.</td>
              </tr>
              <tr v-for="o in orders" :key="o.id" :class="{ 'table-active': selected.includes(o.id) }">
                <td>
                  <input type="checkbox" class="form-check-input"
                    :checked="selected.includes(o.id)"
                    @change="toggleOne(o.id, $event)" />
                </td>
                <td>
                  <span class="badge" :class="o.status === 'canceled' ? 'bg-danger-lt text-danger' : 'bg-warning-lt text-warning'">
                    {{ o.status === 'canceled' ? 'Cancelado' : 'Pendente' }}
                  </span>
                </td>
                <td class="text-muted font-monospace small">{{ o.code }}</td>
                <td>
                  <div>{{ o.customer_name || '—' }}</div>
                  <div class="text-muted small">{{ o.customer_phone || '' }}</div>
                </td>
                <td class="text-muted small">{{ o.course_name || '—' }}</td>
                <td class="fw-semibold">{{ toMoney(o.subtotal) }} Kz</td>
                <td class="text-muted small">{{ formatDate(o.created_at) }}</td>
                <td>
                  <span v-if="o.recovery_notified_at" class="badge bg-green-lt text-green" :title="formatDate(o.recovery_notified_at)">
                    <IconCheck size="12" class="me-1" />Enviado
                  </span>
                  <span v-else class="text-muted small">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginação -->
        <div class="card-footer d-flex align-items-center justify-content-between">
          <div class="text-muted small">{{ ordersTotal }} encomenda(s) · Página {{ page }} de {{ totalPages || 1 }}</div>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-default" :disabled="page <= 1" @click="prevPage">‹ Anterior</button>
            <button class="btn btn-sm btn-default" :disabled="page >= totalPages" @click="nextPage">Próxima ›</button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ── MODAL DE MENSAGEM ───────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="showModal" class="modal modal-blur show d-block" tabindex="-1" @click.self="showModal = false">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Enviar Mensagem de Recuperação</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">

            <!-- Variáveis -->
            <div class="mb-3">
              <label class="form-label small fw-semibold">Variáveis disponíveis <span class="text-muted">(clica para inserir)</span></label>
              <div class="d-flex gap-2 flex-wrap">
                <span v-for="v in variables" :key="v.key"
                  class="badge bg-blue-lt text-blue"
                  style="cursor:pointer; user-select:none;"
                  @click="insertVariable(v.key)"
                  :title="v.desc">
                  {{ v.key }}
                </span>
              </div>
            </div>

            <!-- Templates prontos -->
            <div class="mb-3">
              <label class="form-label small fw-semibold">Templates prontos</label>
              <div class="row g-2">
                <div
                  v-for="(t, i) in messageTemplates"
                  :key="i"
                  class="col-12 col-md-6"
                >
                  <div
                    class="card card-sm"
                    :class="selectedTemplate === i ? 'border-primary' : ''"
                    style="cursor:pointer;"
                    @click="applyTemplate(i)"
                  >
                    <div class="card-body py-2 px-3">
                      <div class="d-flex align-items-center gap-2">
                        <span class="avatar avatar-xs rounded" :class="t.color">{{ t.icon }}</span>
                        <div>
                          <div class="fw-medium small">{{ t.name }}</div>
                          <div class="text-muted" style="font-size:.72rem">{{ t.desc }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Template -->
            <div class="mb-3">
              <label class="form-label small fw-semibold">Mensagem <span class="text-muted fw-normal">(podes editar livremente)</span></label>
              <textarea
                ref="textareaRef"
                class="form-control font-monospace"
                rows="9"
                v-model="messageTemplate"
                placeholder="Escreve a tua mensagem..."
              ></textarea>
            </div>

            <!-- Preview -->
            <div v-if="previewOrder" class="mb-1">
              <label class="form-label small fw-semibold text-muted">Pré-visualização ({{ previewOrder.customer_name || 'Cliente' }})</label>
              <pre class="bg-light p-3 rounded small" style="white-space:pre-wrap;word-break:break-word">{{ renderPreview(previewOrder) }}</pre>
            </div>

            <!-- Resultado do envio -->
            <div v-if="sendResult" class="alert" :class="sendResult.failed ? 'alert-warning' : 'alert-success'">
              <IconCircleCheck size="16" class="me-1" />
              {{ sendResult.sent }} enviada(s) com sucesso
              <span v-if="sendResult.failed"> · {{ sendResult.failed }} falhada(s)</span>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="showModal = false">Cancelar</button>
            <button class="btn btn-success" @click="doSend" :disabled="sendLoading || !messageTemplate.trim()">
              <span v-if="sendLoading" class="spinner-border spinner-border-sm me-1"></span>
              <IconSend v-else size="14" class="me-1" />
              Enviar para {{ selected.length }} encomenda(s)
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop show"></div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { IconRefresh, IconSend, IconCheck, IconCircleCheck } from '@tabler/icons-vue'
import PeriodPicker from '../../../report/common/components/PeriodPicker.vue'
import { RecoveryAPIService } from '../../domain/service/RecoveryService'
import toMoney from '@/common/application/utils/money'
import dayjs from 'dayjs'

// ── State ──────────────────────────────────────────────────────────────────
const statsLoading  = ref(false)
const ordersLoading = ref(false)
const sendLoading   = ref(false)
const stats         = ref<any>(null)
const orders        = ref<any[]>([])
const ordersTotal   = ref(0)
const page          = ref(1)
const perPage       = 20
const selected      = ref<number[]>([])
const showModal     = ref(false)
const sendResult    = ref<any>(null)
const textareaRef   = ref<HTMLTextAreaElement | null>(null)

const filters = reactive({
  start:  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  end:    dayjs().format('YYYY-MM-DD'),
  status: '',
  search: '',
})

const messageTemplate = ref(
`Olá {nome}! 👋

Notámos que não conseguiste concluir a tua inscrição (ref. {codigo}).

✅ Já podes tentar novamente:
{link}

Precisas de ajuda? Fala connosco:
https://wa.me/message/TFRDLMMC2L2TG1`
)

const variables = [
  { key: '{nome}',   desc: 'Primeiro nome do cliente' },
  { key: '{codigo}', desc: 'Código da encomenda' },
  { key: '{link}',   desc: 'Link direto para o checkout' },
  { key: '{valor}',  desc: 'Valor da encomenda em Kz' },
]

const messageTemplates = [
  {
    name: 'Recuperação geral',
    desc: 'Inscrição não concluída — tom amigável',
    icon: '👋',
    color: 'bg-blue-lt',
    body:
`Olá {nome}! 👋

Notámos que não conseguiste concluir a tua inscrição (ref. {codigo}).

✅ Já podes tentar novamente:
{link}

Precisas de ajuda? Fala connosco:
https://wa.me/message/TFRDLMMC2L2TG1`,
  },
  {
    name: 'Dificuldade no pagamento',
    desc: 'Para ordens com pagamento falhado',
    icon: '💳',
    color: 'bg-orange-lt',
    body:
`Olá {nome}!

Reparámos que houve uma dificuldade com o pagamento da tua inscrição (ref. {codigo}, {valor}).

O problema já foi resolvido — podes tentar novamente aqui:
{link}

Qualquer dúvida estamos disponíveis:
https://wa.me/message/TFRDLMMC2L2TG1`,
  },
  {
    name: 'Urgência — vagas limitadas',
    desc: 'Cria sentido de urgência',
    icon: '⚡',
    color: 'bg-yellow-lt',
    body:
`{nome}, as vagas estão quase esgotadas! ⚡

A tua inscrição (ref. {codigo}) ainda está por confirmar. Não percas o teu lugar no curso.

Finaliza aqui em menos de 2 minutos:
{link}`,
  },
  {
    name: 'Oferta especial',
    desc: 'Para reactivar com desconto ou incentivo',
    icon: '🎁',
    color: 'bg-green-lt',
    body:
`Olá {nome}! 🎁

Temos uma surpresa para ti — fala connosco antes de finalizares a tua inscrição (ref. {codigo}) e descobre a oferta especial que preparámos.

Acede aqui:
{link}

Ou fala connosco directamente:
https://wa.me/message/TFRDLMMC2L2TG1`,
  },
]

const selectedTemplate = ref<number | null>(null)

function applyTemplate(index: number) {
  selectedTemplate.value = index
  messageTemplate.value  = messageTemplates[index].body
}

// ── Computed ───────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(ordersTotal.value / perPage))
const allSelected  = computed(() => orders.value.length > 0 && selected.value.length === orders.value.length)
const someSelected = computed(() => selected.value.length > 0 && selected.value.length < orders.value.length)
const previewOrder = computed(() => orders.value.find(o => selected.value.includes(o.id)) ?? orders.value[0] ?? null)
const totalRecoveredValue = computed(() => ((stats.value?.recoveryValue ?? 0) + (stats.value?.abandonedValue ?? 0)))
const conversionColor = computed(() => {
  const r = stats.value?.conversionRate ?? 0
  if (r >= 60) return 'text-success'
  if (r >= 30) return 'text-warning'
  return 'text-danger'
})

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(v: string) {
  return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'
}

function renderPreview(order: any): string {
  const firstName = (order.customer_name || 'Cliente').split(' ')[0]
  return messageTemplate.value
    .replace(/\{nome\}/g,   firstName)
    .replace(/\{codigo\}/g, order.code)
    .replace(/\{link\}/g,   `https://checkout.academiatreesix.com/cart/${order.code}`)
    .replace(/\{valor\}/g,  `${toMoney(order.subtotal ?? 0)} Kz`)
}

function insertVariable(v: string) {
  const ta = textareaRef.value
  if (!ta) { messageTemplate.value += v; return }
  const start = ta.selectionStart ?? messageTemplate.value.length
  const end   = ta.selectionEnd   ?? messageTemplate.value.length
  messageTemplate.value = messageTemplate.value.slice(0, start) + v + messageTemplate.value.slice(end)
  setTimeout(() => {
    ta.focus()
    ta.selectionStart = ta.selectionEnd = start + v.length
  })
}

// ── API calls ──────────────────────────────────────────────────────────────
async function loadStats() {
  statsLoading.value = true
  try {
    const { data } = await RecoveryAPIService.stats({ start: filters.start, end: filters.end })
    stats.value = data
  } catch { /* silent */ } finally { statsLoading.value = false }
}

async function loadOrders() {
  ordersLoading.value = true
  try {
    const { data } = await RecoveryAPIService.orders({ ...filters, page: page.value, perPage })
    orders.value = data.data
    ordersTotal.value = data.total
  } catch { /* silent */ } finally { ordersLoading.value = false }
}

function loadAll() { loadStats(); loadOrders() }

function applyFilters() { page.value = 1; selected.value = []; loadOrders() }

function onPeriodApply(p: { start: string; end: string }) {
  filters.start = p.start
  filters.end   = p.end
  page.value    = 1
  selected.value = []
  loadAll()
}

// ── Seleção ────────────────────────────────────────────────────────────────
function toggleAll(e: Event) {
  selected.value = (e.target as HTMLInputElement).checked
    ? orders.value.map(o => o.id)
    : []
}

function toggleOne(id: number, e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    if (!selected.value.includes(id)) selected.value.push(id)
  } else {
    selected.value = selected.value.filter(x => x !== id)
  }
}

// ── Paginação ──────────────────────────────────────────────────────────────
function prevPage() { if (page.value > 1) { page.value--; loadOrders() } }
function nextPage() { if (page.value < totalPages.value) { page.value++; loadOrders() } }

// ── Modal & envio ──────────────────────────────────────────────────────────
function openModal() { sendResult.value = null; showModal.value = true }

async function doSend() {
  sendLoading.value = true
  try {
    const { data } = await RecoveryAPIService.send({
      orderIds: selected.value,
      message:  messageTemplate.value,
    })
    sendResult.value = data
    await loadOrders()
    await loadStats()
    selected.value = []
  } catch { /* silent */ } finally { sendLoading.value = false }
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(loadAll)
</script>

<style scoped>
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
