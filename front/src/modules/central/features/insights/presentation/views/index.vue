<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">

      <!-- ══ ECRÃ DE CONSENTIMENTO ══════════════════════════════════ -->
      <div v-if="!consentGiven" class="row justify-content-center">
        <div class="col-lg-7 col-md-9">
          <div class="card mt-4 border-warning" style="border-top: 4px solid var(--tblr-warning) !important;">
            <div class="card-body p-4">
              <div class="text-center mb-4">
                <span class="avatar avatar-lg rounded bg-warning-lt text-warning mb-3">
                  <IconShieldLock size="28" />
                </span>
                <h3 class="mb-1">Aviso de Privacidade e Consentimento</h3>
                <p class="text-muted small">Antes de activar a análise IA, lê com atenção</p>
              </div>
              <div class="mb-4">
                <div class="fw-semibold mb-2 d-flex align-items-center gap-2">
                  <IconDatabase size="16" class="text-muted" /> Dados que serão enviados à Anthropic
                </div>
                <ul class="list-unstyled mb-0 ps-1">
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Totais agregados de vendas, receita e pagamentos</li>
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Contagens e valores de devoluções por estado</li>
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Performance por curso (nome do curso, nº vendas, receita)</li>
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Performance por influenciador (nome, comissões, receita)</li>
                </ul>
              </div>
              <div class="mb-4">
                <div class="fw-semibold mb-2 d-flex align-items-center gap-2">
                  <IconShieldOff size="16" class="text-muted" /> O que <strong>não</strong> é enviado
                </div>
                <ul class="list-unstyled mb-0 ps-1">
                  <li class="d-flex gap-2 mb-1 small"><IconX size="14" class="text-danger mt-1 flex-shrink-0" /> Dados pessoais de alunos (nome, email, telefone)</li>
                  <li class="d-flex gap-2 mb-1 small"><IconX size="14" class="text-danger mt-1 flex-shrink-0" /> IDs de utilizadores, referências de pagamento individuais</li>
                  <li class="d-flex gap-2 mb-1 small"><IconX size="14" class="text-danger mt-1 flex-shrink-0" /> Dados de acesso, passwords ou credenciais</li>
                </ul>
              </div>
              <div class="alert alert-info mb-4 py-2 px-3 small d-flex flex-wrap">
                <p class="w-100 py-0 my-0">Sobre a Anthropic (fornecedor do Claude):</p>
                <p class="w-100 py-0 my-0">A Anthropic não utiliza os dados enviados via API para treinar os seus modelos. Os dados são processados exclusivamente para gerar a resposta e não são armazenados.</p>
                <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener" class="ms-1 w-100 py-0 my-0">Ver política de privacidade →</a>
              </div>
              <div class="alert alert-warning mb-4 py-2 px-3 small">
                <IconAlertTriangle size="14" class="me-1" />
                <strong>Nota Legal:</strong> O uso desta funcionalidade implica o envio de dados resumidos de negócio a um subprocessador externo (Anthropic, Inc., EUA). Confirma que tens autorização  para o fazer.
              </div>
              <div class="d-flex gap-3">
                <button class="btn btn-primary flex-grow-1" @click="giveConsent">
                  <IconCheck size="16" class="me-1" /> Compreendo e Autorizo
                </button>
                <button class="btn btn-ghost-secondary" @click="$router.back()">Voltar</button>
              </div>
              <p class="text-muted text-center mt-3 mb-0" style="font-size:.7rem">
                Este consentimento é válido para a sessão actual. Ao recarregar a página, será pedido novamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ CONTEÚDO PRINCIPAL ══════════════════════════════════════ -->
      <template v-if="consentGiven">

        <!-- ── HEADER ────────────────────────────────────────────── -->
        <div class="page-header d-print-none mb-3">
          <div class="row align-items-center">
            <div class="col">
              <div class="page-pretitle">Inteligência Artificial</div>
              <h2 class="page-title d-flex align-items-center gap-2">
                <span class="avatar avatar-sm rounded bg-primary-lt text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                </span>
                Insights IA
              </h2>
              <p class="text-muted mb-0">Análise inteligente dos dados de negócio com Claude</p>
            </div>
            <div class="col-auto d-flex gap-2 align-items-center">
              <div v-if="reportData" class="badge bg-success-lt text-success d-flex align-items-center gap-1">
                <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block"></span>
                Contexto carregado · {{ form.start }} → {{ form.end }}
              </div>
              <button class="btn btn-ghost-secondary btn-sm" @click="revokeConsent" title="Revogar consentimento">
                <IconShieldOff size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- ── FILTRO DE PERÍODO ─────────────────────────────────── -->
        <div class="card mb-4">
          <div class="card-body py-3">
            <div class="d-flex align-items-center gap-3 flex-wrap">
              <PeriodPicker @update:model-value="v => onPeriodApply(v.start, v.end)" />
              <div v-if="form.start && form.end" class="text-muted small">
                {{ form.start }} → {{ form.end }}
              </div>
              <div class="ms-auto d-flex gap-2">
                <button class="btn btn-primary btn-sm" @click="loadData" :disabled="loadingData || !form.start || !form.end">
                  <span v-if="loadingData" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  <IconChartBar v-else size="14" class="me-1" />
                  {{ loadingData ? 'A carregar...' : 'Carregar Dados' }}
                </button>
                <button v-if="reportData" class="btn btn-ghost-secondary btn-sm" @click="clearAll">Limpar</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loadError" class="alert alert-danger mb-4">{{ loadError }}</div>

        <!-- ── ESTADO: SEM DADOS ────────────────────────────────── -->
        <div v-if="!reportData && !loadingData && !loadError" class="text-center py-5 text-muted">
          <div class="mb-3 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
          </div>
          <p>Selecciona um período e clica em <strong>Carregar Dados</strong> para activar a análise IA.</p>
        </div>

        <!-- ── CONTEÚDO PRINCIPAL ───────────────────────────────── -->
        <div v-if="reportData">

          <!-- 4 CARDS ─────────────────────────────────────────── -->
          <div class="row g-3 mb-4">
            <div class="col-12 d-flex align-items-center gap-2 mb-1">
              <span class="fw-medium text-muted small">ANÁLISES AUTOMÁTICAS</span>
              <span class="badge bg-primary-lt text-primary">Claude</span>
              <button v-if="!cardsLoading && !cardsLoaded" class="btn btn-sm btn-primary ms-auto" @click="generateCards">
                <IconSparkles size="14" class="me-1" /> Gerar Análises
              </button>
              <button v-if="cardsLoaded && !cardsLoading" class="btn btn-sm btn-ghost-secondary ms-auto" @click="generateCards" title="Regenerar">
                <IconRefresh size="14" class="me-1" /> Regenerar
              </button>
            </div>

            <template v-if="cardsLoading">
              <div class="col-md-6 col-lg-3" v-for="i in 4" :key="i">
                <div class="card h-100"><div class="card-body"><div class="placeholder-glow">
                  <span class="placeholder col-5 mb-2 d-block rounded"></span>
                  <span class="placeholder col-12 mb-1 d-block rounded"></span>
                  <span class="placeholder col-10 mb-1 d-block rounded"></span>
                  <span class="placeholder col-8 d-block rounded"></span>
                </div></div></div>
              </div>
            </template>

            <template v-if="cardsLoaded && !cardsLoading">
              <div class="col-md-6 col-lg-3 msg-enter" v-for="(card, ci) in cardsList" :key="card.key" :style="`animation-delay:${ci * 80}ms`">
                <div class="card h-100" :class="`border-${card.color}`" style="border-top-width: 3px !important; border-top-style: solid !important;">
                  <div class="card-body">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="avatar avatar-xs rounded" :class="`bg-${card.color}-lt text-${card.color}`"><component :is="card.icon" size="14" /></span>
                      <span class="fw-medium small" :class="`text-${card.color}`">{{ card.label }}</span>
                    </div>
                    <p class="text-body small mb-0" style="line-height:1.6">{{ card.text }}</p>
                  </div>
                </div>
              </div>
            </template>

            <template v-if="!cardsLoading && !cardsLoaded">
              <div class="col-md-6 col-lg-3" v-for="card in cardsMeta" :key="card.key">
                <div class="card h-100 opacity-50">
                  <div class="card-body">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="avatar avatar-xs rounded" :class="`bg-${card.color}-lt text-${card.color}`"><component :is="card.icon" size="14" /></span>
                      <span class="fw-medium small" :class="`text-${card.color}`">{{ card.label }}</span>
                    </div>
                    <p class="text-muted small mb-0">Clica em "Gerar Análises" para ver a análise deste tópico.</p>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- ── CHAT ─────────────────────────────────────────── -->
          <div class="chat-shell">

            <!-- Mensagens -->
            <div class="chat-messages" ref="messagesEl">

              <!-- Welcome -->
              <div v-if="messages.length === 0" class="chat-welcome">
                <div class="chat-welcome-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                </div>
                <h4 class="mb-1">Olá! Sou o Claude.</h4>
                <p class="text-muted mb-4 small">Tenho acesso aos dados do período <strong>{{ form.start }} → {{ form.end }}</strong>.<br>Pergunta-me qualquer coisa sobre vendas, devoluções, cursos ou influenciadores.</p>
                <div class="chat-suggestions">
                  <button v-for="s in chatSuggestions" :key="s" class="chat-suggestion" @click="sendSuggestion(s)">{{ s }}</button>
                </div>
              </div>

              <!-- Messages -->
              <template v-else>
                <div
                  v-for="(msg, i) in messages"
                  :key="msg.id"
                  class="chat-message msg-enter"
                  :class="msg.role === 'user' ? 'chat-message--user' : 'chat-message--assistant'"
                >
                  <!-- Avatar -->
                  <div class="chat-avatar" v-if="msg.role === 'assistant'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                  </div>

                  <!-- Bubble -->
                  <div class="chat-bubble" :class="msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'">
                    <div class="chat-text">
                      <template v-if="msg.role === 'assistant'">
                        <span v-if="msg.typing" class="chat-typewriter">{{ msg.displayed }}<span class="chat-cursor" :class="{ 'chat-cursor--blink': msg.typing }">|</span></span>
                        <span v-else>{{ msg.content }}</span>
                      </template>
                      <template v-else>
                        <template v-if="parseUserMsg(msg.content).quote">
                          <span class="chat-quote-line">{{ parseUserMsg(msg.content).quote }}</span>
                        </template>{{ parseUserMsg(msg.content).body }}
                      </template>
                    </div>

                    <!-- Actions on assistant messages -->
                    <div v-if="msg.role === 'assistant' && !msg.typing && msg.content" class="chat-actions">
                      <button class="chat-action-btn" @click="copyMessage(msg.content, msg.id)" :title="copiedId === msg.id ? 'Copiado!' : 'Copiar'">
                        <IconCheck v-if="copiedId === msg.id" size="13" />
                        <IconCopy v-else size="13" />
                      </button>
                      <button v-if="i === messages.length - 1" class="chat-action-btn" @click="regenerate" :disabled="chatLoading" title="Regenerar resposta">
                        <IconRefresh size="13" />
                      </button>
                    </div>

                    <div class="chat-time">{{ msg.time }}</div>
                  </div>
                </div>

                <!-- Typing indicator -->
                <div v-if="chatLoading && !isTypingOut" class="chat-message chat-message--assistant msg-enter">
                  <div class="chat-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                  </div>
                  <div class="chat-bubble chat-bubble--assistant">
                    <div class="typing-dots"><span></span><span></span><span></span></div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Input -->
            <div class="chat-input-area">
              <!-- Quote preview -->
              <div v-if="selectedQuote" class="chat-quote-preview">
                <div class="chat-quote-bar"></div>
                <div class="chat-quote-text">{{ selectedQuote }}</div>
                <button class="chat-quote-dismiss" @click="selectedQuote = null" title="Remover citação">×</button>
              </div>
              <div v-if="chatError" class="chat-error">{{ chatError }}</div>
              <div class="chat-input-row">
                <div class="chat-input-wrap">
                  <textarea
                    ref="inputEl"
                    class="chat-input"
                    :placeholder="chatLoading ? 'Claude está a pensar...' : 'Pergunta algo sobre os dados... (Enter envia, Shift+Enter nova linha)'"
                    v-model="chatInput"
                    @keydown.enter.exact.prevent="sendMessage"
                    @input="autoResize"
                    :disabled="chatLoading"
                    rows="1"
                  ></textarea>
                  <div class="chat-input-hint" v-if="chatInput.length > 0">
                    <span :class="chatInput.length > 3800 ? 'text-danger' : 'text-muted'">{{ chatInput.length }}/4000</span>
                  </div>
                </div>
                <button class="chat-send-btn" @click="sendMessage" :disabled="chatLoading || !chatInput.trim()">
                  <span v-if="chatLoading" class="spinner-border spinner-border-sm" role="status"></span>
                  <IconSend v-else size="16" />
                </button>
              </div>
              <div class="chat-footer-row">
                <span class="text-muted" style="font-size:.7rem">Enter para enviar · Shift+Enter para nova linha</span>
                <button v-if="messages.length > 0" class="chat-clear-btn" @click="clearChat">
                  <IconTrash size="12" class="me-1" /> Limpar conversa
                </button>
              </div>
            </div>
          </div>

        </div>
      </template>
  </div>

  <!-- ══ FLOATING QUOTE BUTTON ════════════════════════════════════ -->
  <Teleport to="body">
    <div
      v-if="quoteBtn.visible"
      class="quote-float-btn"
      :style="`left:${quoteBtn.x}px;top:${quoteBtn.y}px`"
      @mousedown.prevent="applyQuote"
    >
      <IconQuote size="12" class="me-1" /> Citar
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import {
  IconChartBar, IconRefresh, IconSparkles,
  IconTrendingUp, IconArrowBackUp, IconBook, IconStar,
  IconSend, IconTrash, IconCopy, IconCheck,
  IconShieldLock, IconShieldOff, IconDatabase,
  IconX, IconAlertTriangle, IconQuote,
} from '@tabler/icons-vue'
import { ReportAPIService } from '../../../report/domain/service/ReportService'
import PeriodPicker from '../../../report/common/components/PeriodPicker.vue'

/* ── Consentimento ────────────────────────────────────────────── */
const consentGiven = ref(false)
function giveConsent()   { consentGiven.value = true }
function revokeConsent() { consentGiven.value = false; clearAll() }

/* ── Estado ───────────────────────────────────────────────────── */
const form        = reactive({ start: '', end: '' })

function onPeriodApply(start: string, end: string) {
  form.start = start
  form.end   = end
}
const loadingData = ref(false)
const reportData  = ref<any>(null)
const loadError   = ref<string | null>(null)

const cardsLoading = ref(false)
const cardsLoaded  = ref(false)
const rawCards     = ref<Record<string, string>>({})

interface ChatMessage {
  id:        number
  role:      'user' | 'assistant'
  content:   string
  displayed: string
  typing:    boolean
  time:      string
}

let _msgId = 0
const messages    = ref<ChatMessage[]>([])
const chatInput   = ref('')
const chatLoading = ref(false)
const chatError   = ref<string | null>(null)
const isTypingOut   = ref(false)
const copiedId      = ref<number | null>(null)
const messagesEl    = ref<HTMLElement | null>(null)
const inputEl       = ref<HTMLTextAreaElement | null>(null)
const selectedQuote = ref<string | null>(null)
const quoteBtn      = reactive({ visible: false, x: 0, y: 0, text: '' })

/* ── Quote selection ──────────────────────────────────────────── */
function onDocumentMouseUp() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.toString().trim()) {
    quoteBtn.visible = false
    return
  }
  const range    = sel.getRangeAt(0)
  const node     = range.commonAncestorContainer
  const el       = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element)
  if (!el?.closest('.chat-bubble--assistant')) {
    quoteBtn.visible = false
    return
  }
  const rect       = range.getBoundingClientRect()
  quoteBtn.text    = sel.toString().trim()
  quoteBtn.visible = true
  quoteBtn.x       = rect.left + rect.width / 2
  quoteBtn.y       = rect.top - 40
}

function applyQuote() {
  selectedQuote.value = quoteBtn.text
  quoteBtn.visible    = false
  window.getSelection()?.removeAllRanges()
  nextTick(() => inputEl.value?.focus())
}

onMounted(()   => document.addEventListener('mouseup', onDocumentMouseUp))
onUnmounted(() => document.removeEventListener('mouseup', onDocumentMouseUp))

/* ── Cards ────────────────────────────────────────────────────── */
const cardsMeta = [
  { key: 'geral',           label: 'Performance Geral',  icon: IconTrendingUp,  color: 'blue'   },
  { key: 'devoluções',      label: 'Devoluções',         icon: IconArrowBackUp, color: 'orange' },
  { key: 'cursos',          label: 'Cursos',             icon: IconBook,        color: 'purple' },
  { key: 'influenciadores', label: 'Influenciadores',    icon: IconStar,        color: 'teal'   },
]
const cardsList = computed(() =>
  cardsMeta.map(m => ({ ...m, text: rawCards.value[m.key] ?? 'Análise não disponível para este tópico.' }))
)

const chatSuggestions = [
  'Qual o curso com mais devoluções?',
  'Que influenciador gerou mais receita?',
  'Que dia teve maior volume de vendas?',
  'Há algum alerta que deva conhecer?',
  'Como está a taxa de reembolso?',
  'Qual a tendência geral do período?',
]

/* ── Load data ────────────────────────────────────────────────── */
async function loadData() {
  if (!form.start || !form.end) return
  loadingData.value = true
  loadError.value   = null
  cardsLoaded.value = false
  rawCards.value    = {}
  messages.value    = []
  chatError.value   = null
  try {
    const res = await ReportAPIService.report({ type: 'general', start: form.start, end: form.end })
    reportData.value = res.data || null
    await generateCards()
  } catch {
    reportData.value = null
    loadError.value  = 'Erro ao carregar os dados. Verifica a ligação e tenta novamente.'
  } finally {
    loadingData.value = false
  }
}

/* ── Cards ────────────────────────────────────────────────────── */
async function generateCards() {
  if (!reportData.value) return
  cardsLoading.value = true
  cardsLoaded.value  = false
  try {
    const res = await ReportAPIService.insightsCards({
      period:           { start: form.start, end: form.end },
      summary:          reportData.value.summary,
      refundsByStatus:  reportData.value.refundsByStatus,
      dayReport:        reportData.value.dayReport,
      monthReport:      reportData.value.monthReport,
      courseReport:     reportData.value.courseReport,
      influencerReport: reportData.value.influencerReport,
    })
    rawCards.value    = (res as any).data?.cards ?? {}
    cardsLoaded.value = true
  } catch {
    cardsLoaded.value = false
  } finally {
    cardsLoading.value = false
  }
}

/* ── Chat ─────────────────────────────────────────────────────── */
function nowTime() {
  return new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || chatLoading.value) return

  chatError.value  = null
  chatInput.value  = ''
  resetInputHeight()

  const quote   = selectedQuote.value
  selectedQuote.value = null
  const content = quote ? `> ${quote}\n\n${text}` : text

  const userMsg: ChatMessage = { id: ++_msgId, role: 'user', content, displayed: content, typing: false, time: nowTime() }
  messages.value.push(userMsg)
  chatLoading.value = true
  await scrollToBottom()

  try {
    const res = await ReportAPIService.insightsChat({
      messages:         messages.value.map(m => ({ role: m.role, content: m.content })),
      period:           { start: form.start, end: form.end },
      summary:          reportData.value?.summary,
      refundsByStatus:  reportData.value?.refundsByStatus,
      dayReport:        reportData.value?.dayReport,
      monthReport:      reportData.value?.monthReport,
      courseReport:     reportData.value?.courseReport,
      influencerReport: reportData.value?.influencerReport,
    })
    const fullText = (res as any).data?.message ?? ''
    chatLoading.value = false
    await typewriterAppend(fullText)
  } catch {
    chatLoading.value = false
    chatError.value   = 'Erro ao contactar o Claude. Verifica a chave ANTHROPIC_API_KEY.'
    messages.value.pop()
  }
}

async function typewriterAppend(text: string) {
  const msg: ChatMessage = { id: ++_msgId, role: 'assistant', content: text, displayed: '', typing: true, time: nowTime() }
  messages.value.push(msg)
  isTypingOut.value = true

  const idx   = messages.value.length - 1
  const chars = [...text]  // handle Unicode correctly
  const delay = Math.max(8, Math.min(20, 2000 / chars.length))  // adaptive speed

  await scrollToBottom()

  for (let i = 0; i < chars.length; i++) {
    messages.value[idx].displayed += chars[i]
    if (i % 3 === 0) await scrollToBottom()
    await sleep(delay)
  }

  messages.value[idx].typing = false
  isTypingOut.value = false
  await scrollToBottom()
}

async function regenerate() {
  if (chatLoading.value || messages.value.length < 2) return
  // Remove last assistant message and re-send
  const lastAssistant = messages.value[messages.value.length - 1]
  if (lastAssistant.role !== 'assistant') return
  messages.value.pop()

  chatLoading.value = true
  await scrollToBottom()

  try {
    const res = await ReportAPIService.insightsChat({
      messages:         messages.value.map(m => ({ role: m.role, content: m.content })),
      period:           { start: form.start, end: form.end },
      summary:          reportData.value?.summary,
      refundsByStatus:  reportData.value?.refundsByStatus,
      dayReport:        reportData.value?.dayReport,
      monthReport:      reportData.value?.monthReport,
      courseReport:     reportData.value?.courseReport,
      influencerReport: reportData.value?.influencerReport,
    })
    const fullText = (res as any).data?.message ?? ''
    chatLoading.value = false
    await typewriterAppend(fullText)
  } catch {
    chatLoading.value = false
    chatError.value   = 'Erro ao regenerar. Tenta novamente.'
  }
}

async function copyMessage(text: string, id: number) {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => { copiedId.value = null }, 2000)
  } catch { /* silent */ }
}

async function sendSuggestion(text: string) {
  chatInput.value = text
  await sendMessage()
}

/* ── Helpers ──────────────────────────────────────────────────── */
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

/** Splits a message like "> quoted\n\nbody" into { quote, body } */
function parseUserMsg(content: string): { quote: string | null; body: string } {
  if (!content.startsWith('> ')) return { quote: null, body: content }
  const newline = content.indexOf('\n\n')
  if (newline === -1) return { quote: null, body: content }
  return {
    quote: content.slice(2, newline),
    body:  content.slice(newline + 2),
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
  }
}

function autoResize() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function resetInputHeight() {
  if (inputEl.value) inputEl.value.style.height = 'auto'
}

function clearChat() {
  messages.value  = []
  chatInput.value = ''
  chatError.value = null
  resetInputHeight()
}

function clearAll() {
  reportData.value  = null
  rawCards.value    = {}
  cardsLoaded.value = false
  loadError.value   = null
  form.start = ''
  form.end   = ''
  clearAll_chat()
}

function clearAll_chat() {
  messages.value    = []
  chatInput.value   = ''
  chatError.value   = null
}
</script>

<style scoped>
/* ── Chat shell ──────────────────────────────────────────────── */
.chat-shell {
  border: 1px solid var(--tblr-border-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--tblr-bg-surface);
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

/* ── Messages area ───────────────────────────────────────────── */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.25rem;
  min-height: 400px;
  max-height: 580px;
  scroll-behavior: smooth;
}

/* ── Welcome ─────────────────────────────────────────────────── */
.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 320px;
  padding: 2rem;
}
.chat-welcome-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--tblr-primary-lt);
  color: var(--tblr-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  justify-content: center;
  max-width: 560px;
}
.chat-suggestion {
  border: 1px solid var(--tblr-border-color);
  background: var(--tblr-bg-surface);
  color: var(--tblr-body-color);
  border-radius: 20px;
  padding: .35rem .85rem;
  font-size: .8rem;
  cursor: pointer;
  transition: all .15s;
}
.chat-suggestion:hover {
  border-color: var(--tblr-primary);
  color: var(--tblr-primary);
  background: var(--tblr-primary-lt);
}

/* ── Message row ─────────────────────────────────────────────── */
.chat-message {
  display: flex;
  gap: .75rem;
  margin-bottom: 1.25rem;
  align-items: flex-start;
}
.chat-message--user {
  flex-direction: row-reverse;
}
.chat-message--user .chat-bubble {
  align-items: flex-end;
}

/* ── Avatar ──────────────────────────────────────────────────── */
.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--tblr-primary-lt);
  color: var(--tblr-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

/* ── Bubble ──────────────────────────────────────────────────── */
.chat-bubble {
  display: flex;
  flex-direction: column;
  max-width: 75%;
  position: relative;
}
.chat-bubble--user .chat-text {
  background: var(--tblr-primary-lt, #e8f0fe);
  color: var(--tblr-primary-fg, var(--tblr-primary));
  border-radius: 18px 18px 4px 18px;
  padding: .6rem 1rem;
  font-size: .875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid rgba(var(--tblr-primary-rgb), .15);
}
.chat-bubble--assistant .chat-text {
  background: var(--tblr-bg-surface-secondary, #f4f6fa);
  color: var(--tblr-body-color);
  border-radius: 4px 18px 18px 18px;
  padding: .75rem 1rem;
  font-size: .875rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid var(--tblr-border-color);
}
/* quoted text inside user bubble */
.chat-bubble--user .chat-text blockquote,
.chat-bubble--user .chat-text [data-quote] {
  border-left: 2px solid rgba(var(--tblr-primary-rgb), .4);
  margin: 0 0 .4rem 0;
  padding: .1rem .6rem;
  opacity: .7;
  font-size: .82rem;
}

/* ── Typewriter cursor ───────────────────────────────────────── */
.chat-cursor { opacity: 1; }
.chat-cursor--blink {
  animation: blink .6s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }

/* ── Message actions ─────────────────────────────────────────── */
.chat-actions {
  display: flex;
  gap: .25rem;
  margin-top: .35rem;
  opacity: 0;
  transition: opacity .15s;
}
.chat-bubble:hover .chat-actions { opacity: 1; }
.chat-action-btn {
  border: none;
  background: transparent;
  color: var(--tblr-muted);
  padding: .2rem .35rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background .15s, color .15s;
}
.chat-action-btn:hover:not(:disabled) {
  background: var(--tblr-border-color);
  color: var(--tblr-body-color);
}
.chat-action-btn:disabled { opacity: .4; cursor: default; }

/* ── Timestamp ───────────────────────────────────────────────── */
.chat-time {
  font-size: .68rem;
  color: var(--tblr-muted);
  margin-top: .25rem;
  padding: 0 .25rem;
  opacity: 0;
  transition: opacity .15s;
}
.chat-bubble:hover .chat-time { opacity: 1; }
.chat-message--user .chat-time { text-align: right; }

/* ── Typing dots ─────────────────────────────────────────────── */
.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: .6rem .75rem;
}
.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tblr-muted);
  animation: dot-bounce 1.3s infinite ease-in-out;
}
.typing-dots span:nth-child(2) { animation-delay: .2s; }
.typing-dots span:nth-child(3) { animation-delay: .4s; }
@keyframes dot-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .4; }
  30%            { transform: translateY(-6px); opacity: 1; }
}

/* ── Input area ──────────────────────────────────────────────── */
.chat-input-area {
  border-top: 1px solid var(--tblr-border-color);
  padding: .875rem 1rem .625rem;
  background: var(--tblr-bg-surface);
}
.chat-error {
  font-size: .8rem;
  color: var(--tblr-danger);
  margin-bottom: .5rem;
  padding: .35rem .65rem;
  background: var(--tblr-danger-lt);
  border-radius: 6px;
}
.chat-input-row {
  display: flex;
  gap: .5rem;
  align-items: flex-end;
}
.chat-input-wrap {
  flex: 1;
  position: relative;
  border: 1.5px solid var(--tblr-border-color);
  border-radius: 12px;
  transition: border-color .15s;
  background: var(--tblr-bg-surface);
}
.chat-input-wrap:focus-within {
  border-color: var(--tblr-primary);
  box-shadow: 0 0 0 3px rgba(var(--tblr-primary-rgb), .1);
}
.chat-input {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  padding: .65rem .9rem .65rem .9rem;
  font-size: .875rem;
  line-height: 1.5;
  color: var(--tblr-body-color);
  outline: none;
  min-height: 42px;
  max-height: 160px;
  overflow-y: auto;
  border-radius: 12px;
}
.chat-input::placeholder { color: var(--tblr-muted); }
.chat-input:disabled { opacity: .6; cursor: not-allowed; }
.chat-input-hint {
  position: absolute;
  bottom: .35rem;
  right: .65rem;
  font-size: .65rem;
  pointer-events: none;
}
.chat-send-btn {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: none;
  background: var(--tblr-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity .15s, transform .1s;
}
.chat-send-btn:hover:not(:disabled) { opacity: .9; transform: scale(1.04); }
.chat-send-btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

.chat-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: .4rem;
}
.chat-clear-btn {
  border: none;
  background: transparent;
  color: var(--tblr-muted);
  font-size: .7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color .15s;
}
.chat-clear-btn:hover { color: var(--tblr-danger); }

/* ── Message enter animation ─────────────────────────────────── */
.msg-enter {
  animation: msg-in .25s ease both;
}
@keyframes msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Quote line in user bubble (> prefix becomes visual block) ── */
.chat-bubble--user .chat-text .chat-quote-line {
  border-left: 2px solid rgba(var(--tblr-primary-rgb), .45);
  padding-left: .5rem;
  margin-bottom: .35rem;
  opacity: .7;
  font-size: .82rem;
  display: block;
}

/* ── Floating cite button (fixed, above selection) ───────────── */
.quote-float-btn {
  position: fixed;
  transform: translateX(-50%);
  z-index: 9999;
  background: var(--tblr-body-color, #1a1a2e);
  color: #fff;
  font-size: .75rem;
  font-weight: 500;
  padding: .28rem .7rem;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
  user-select: none;
  animation: msg-in .12s ease both;
  pointer-events: auto;
}
.quote-float-btn:hover {
  opacity: .85;
}

/* ── Quote preview above input ───────────────────────────────── */
.chat-quote-preview {
  display: flex;
  align-items: flex-start;
  gap: .5rem;
  background: var(--tblr-primary-lt, #e8f0fe);
  border-left: 3px solid var(--tblr-primary);
  border-radius: 0 6px 6px 0;
  padding: .4rem .6rem;
  margin-bottom: .5rem;
  font-size: .8rem;
  color: var(--tblr-body-color);
  animation: msg-in .15s ease both;
}
.chat-quote-bar {
  display: none; /* border-left handles it */
}
.chat-quote-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: .8;
  font-style: italic;
}
.chat-quote-dismiss {
  border: none;
  background: transparent;
  color: var(--tblr-muted);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 .1rem;
  flex-shrink: 0;
}
.chat-quote-dismiss:hover { color: var(--tblr-danger); }
</style>
