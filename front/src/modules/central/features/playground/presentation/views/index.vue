<!--
  Playground de sistemas externos (admin).
  Card com tabs por sistema (Vendus, SMS, WhatsApp, Thinkific). Corre chamadas
  reais via backend (/api/v1/playground/run). AppyPay fica de fora.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="page-header mb-3">
        <h2 class="page-title"><i class="ti ti-flask me-2"></i>Playground</h2>
        <p class="text-muted mb-0">Teste as integrações externas diretamente, com chamadas reais.</p>
      </div>

      <div class="card">
        <!-- Tabs por sistema -->
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs" role="tablist">
            <li v-for="(sys, key) in systems" :key="key" class="nav-item">
              <a href="#" class="nav-link" :class="{ active: activeSystem === key }" @click.prevent="selectSystem(key)">
                {{ sys.label }}
                <span v-if="sys.mock" class="badge bg-azure-lt text-azure ms-2">mock</span>
                <span v-else-if="!sys.configured" class="badge bg-yellow-lt text-yellow ms-2">não configurado</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="card-body" v-if="current">
          <!-- Aviso Vendus: modo -->
          <div v-if="activeSystem === 'vendus' && status" class="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <span class="badge" :class="status.vendus.mode === 'normal' ? 'bg-red-lt text-red' : 'bg-azure-lt text-azure'">
              modo: {{ status.vendus.mode }}
            </span>
            <span class="text-muted small">{{ status.vendus.baseUrl }}</span>
          </div>

          <div v-if="current.mock" class="alert alert-info py-2">
            <i class="ti ti-flask-2 me-1"></i>
            <strong>Mock ativo</strong> — as chamadas vão para o mock-server, não para o serviço real.
          </div>
          <div v-else-if="!current.configured" class="alert alert-warning">
            <strong>{{ current.label }} não está configurado.</strong> Verifique as variáveis no <code>.env</code> da API.
          </div>

          <div class="row g-2 mb-2">
            <div class="col-md-4" v-if="resources.length > 1">
              <label class="form-label">Recurso</label>
              <select v-model="resource" class="form-select" @change="onResourceChange">
                <option v-for="r in resources" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Ação</label>
              <select v-model="action" class="form-select" @change="loadExample">
                <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button class="btn btn-primary w-100" :disabled="running || !current.configured" @click="run">
                <span v-if="running" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="ti ti-player-play me-1"></i>Executar
              </button>
            </div>
          </div>

          <div v-if="isDestructive" class="alert alert-danger py-2 mb-2">
            <i class="ti ti-alert-triangle me-1"></i>
            Ação <strong>destrutiva</strong> — envia/cria/cobra dados reais{{ activeSystem === 'vendus' && status?.vendus.mode === 'tests' ? ' (Vendus em modo tests: não comunica à AGT)' : '' }}.
          </div>

          <div class="mb-3">
            <label class="form-label d-flex justify-content-between">
              <span>Argumentos (array JSON)</span>
              <a href="#" class="small" @click.prevent="loadExample">repor exemplo</a>
            </label>
            <textarea
              v-model="argsText"
              class="form-control font-monospace"
              rows="8"
              spellcheck="false"
              :class="{ 'is-invalid': argsError }"
            ></textarea>
            <div v-if="argsError" class="invalid-feedback d-block">{{ argsError }}</div>
            <small class="text-muted">Mapeia para <code>{{ resource }}.{{ action }}(...args)</code>.</small>
          </div>

          <div v-if="response">
            <div class="d-flex align-items-center mb-1">
              <span class="badge me-2" :class="response.ok ? 'bg-green text-white' : 'bg-red text-white'">
                {{ response.ok ? 'OK' : 'ERRO' }}
              </span>
              <span v-if="response.rateLimit?.remaining != null" class="text-muted small">
                créditos restantes: {{ response.rateLimit.remaining }}
              </span>
            </div>
            <pre class="result-box">{{ pretty(response.ok ? response.data : response.error) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PlaygroundService, {
  type PlaygroundStatus,
  type PlaygroundSystem,
} from '../../domain/services/PlaygroundService'
import notification from '@common/application/utils/notification'

const status = ref<PlaygroundStatus | null>(null)
const systems = computed<Record<string, PlaygroundSystem>>(() => status.value?.systems ?? {})

const activeSystem = ref('vendus')
const resource = ref('')
const action = ref('')
const argsText = ref('[]')
const argsError = ref<string | null>(null)
const running = ref(false)
const response = ref<any>(null)

const current = computed<PlaygroundSystem | null>(() => systems.value[activeSystem.value] ?? null)
const resources = computed(() => Object.keys(current.value?.resources ?? {}))
const actions = computed(() => current.value?.resources?.[resource.value]?.methods ?? [])
const isDestructive = computed(() =>
  (current.value?.resources?.[resource.value]?.destructive ?? []).includes(action.value),
)

// Exemplos por `${resource}.${action}` (nomes de recurso são únicos entre sistemas).
const EXAMPLES: Record<string, unknown[]> = {
  // Vendus
  'documents.create': [{
    type: 'FR',
    client: { fiscal_id: '999999990', name: 'Cliente Teste', country: 'AO' },
    items: [{ title: 'Curso de Teste', qty: 1, gross_price: 75000, tax_id: 'NOR', unit_id: 1 }],
  }],
  'documents.cancel': [123, 'engano no NIF'],
  'documents.get': [123],
  'documents.list': [{ type: 'FT', since: '2026-01-01' }],
  'documents.getPdfUrl': [123],
  'clients.create': [{ fiscal_id: '999999990', name: 'Cliente Teste', country: 'AO', email: 'teste@dominio.ao' }],
  'clients.get': [123],
  'clients.list': [{ q: 'teste' }],
  'clients.update': [123, { city: 'Luanda' }],
  'clients.deactivate': [123],
  'clients.remove': [123],
  'clients.findByFiscalId': ['999999990'],
  'products.create': [{ title: 'Curso X', unit_id: 1, gross_price: 50000, tax_id: 'NOR' }],
  'products.get': [123],
  'products.list': [{ q: 'curso' }],
  'products.update': [123, { gross_price: 60000 }],
  'products.deactivate': [123],
  'products.remove': [123],
  'products.findByReference': ['REF001'],
  'registers.list': [],
  'registers.get': [123],
  'registers.apiRegister': [],   // devolve a caixa type="api" → VENDUS_REGISTER_ID
  'paymentMethods.list': [],
  'paymentMethods.getDefault': [],
  'paymentMethods.create': [{ title: 'Multicaixa Express', type: 'CD' }],
  // SMS
  'sms.send': [{ to: '9XXXXXXXX', message: 'Teste do playground' }],
  // WhatsApp
  'whatsapp.send': ['244XXXXXXXXX', 'Teste do playground'],
  // Thinkific
  'thinkific.getUserByEmail': ['teste@dominio.ao'],
  'thinkific.getCourses': [1, 5],
  'thinkific.getCourse': [123],
  'thinkific.getProducts': [1, 5],
  'thinkific.getProduct': [123],
  'thinkific.getBundle': [123],
  'thinkific.getEnrolls': [1, 5],
  'thinkific.createUser': [{ first_name: 'Teste', last_name: 'Playground', email: 'teste@dominio.ao', send_welcome_email: false }],
  'thinkific.safeCreateUser': [{ first_name: 'Teste', last_name: 'Playground', email: 'teste@dominio.ao', send_welcome_email: false }],
  'thinkific.enrollCourseWithExpiry': [123, 456, 365],
  'thinkific.enrollBundleWithExpiry': [123, 456, 365],
  'thinkific.deleteUser': [123],
}

function selectSystem(key: string) {
  activeSystem.value = key
  resource.value = resources.value[0] ?? ''
  action.value = actions.value[0] ?? ''
  response.value = null
  loadExample()
}
function onResourceChange() {
  action.value = actions.value[0] ?? ''
  loadExample()
}
function loadExample() {
  argsText.value = JSON.stringify(EXAMPLES[`${resource.value}.${action.value}`] ?? [], null, 2)
  argsError.value = null
}
function pretty(v: unknown) {
  return JSON.stringify(v, null, 2)
}

async function run() {
  argsError.value = null
  let args: unknown[]
  try {
    args = JSON.parse(argsText.value)
    if (!Array.isArray(args)) throw new Error('Os argumentos têm de ser um array.')
  } catch (e: any) {
    argsError.value = e.message ?? 'JSON inválido'
    return
  }
  running.value = true
  response.value = null
  try {
    const { data } = await PlaygroundService.run({
      system: activeSystem.value,
      resource: resource.value,
      action: action.value,
      args,
    })
    response.value = data
    if (!data.ok) notification.error(data.error?.message ?? 'Erro na chamada')
  } catch (e: any) {
    response.value = { ok: false, error: { message: e?.response?.data?.error?.message ?? e.message } }
  } finally {
    running.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await PlaygroundService.status()
    status.value = data
  } catch {
    /* sem permissão / não autenticado */
  }
  resource.value = resources.value[0] ?? ''
  action.value = actions.value[0] ?? ''
  loadExample()
})
</script>

<style scoped>
.result-box {
  background: var(--tblr-bg-surface-secondary, #f8f9fa);
  border: 1px solid var(--tblr-border-color, #e5e7eb);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  max-height: 420px;
  overflow: auto;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
