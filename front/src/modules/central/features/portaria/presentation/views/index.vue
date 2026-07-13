<!--
 -  Tecnobra — Portaria: leitura de QR com a câmara + registo de entrada/saída.
 -  UI touch-first para telemóvel/tablet do segurança. Fora do layout central.
 -  Nota: o acesso à câmara exige HTTPS ou localhost.
-->
<template>
  <div class="portaria min-vh-100 d-flex flex-column">
    <!-- Barra superior -->
    <header class="navbar navbar-expand px-3 py-2 border-bottom bg-white d-print-none">
      <span class="navbar-brand fw-bold">Tecnobra · Portaria</span>
      <div class="ms-auto d-flex align-items-center gap-2">
        <select v-model.number="obraId" class="form-select form-select-sm" style="max-width: 220px">
          <option :value="null" disabled>Selecionar obra…</option>
          <option v-for="o in obras" :key="o.id" :value="o.id">{{ o.codigo }} — {{ o.nome }}</option>
        </select>
        <input
          v-model="portao"
          class="form-control form-control-sm"
          style="max-width: 140px"
          placeholder="Portão"
        />
        <router-link class="btn btn-sm btn-outline-secondary" :to="{ name: 'dashboard' }">Sair</router-link>
      </div>
    </header>

    <main class="flex-grow-1 container-tight py-3 px-3 mx-auto w-100" style="max-width: 560px">
      <!-- Sem obra selecionada -->
      <div v-if="!obraId" class="card text-center py-5">
        <div class="card-body">
          <h3>Escolha a obra para começar</h3>
          <p class="text-muted mb-0">Selecione a obra e, opcionalmente, o portão no topo do ecrã.</p>
        </div>
      </div>

      <template v-else>
        <!-- Modo scanner -->
        <div v-if="modo === 'scan' && !confirmacao" class="card overflow-hidden">
          <div class="ratio ratio-1x1 bg-dark">
            <qrcode-stream
              v-if="cameraAtiva"
              @detect="onDetect"
              @error="onCameraError"
            />
            <div v-else class="d-flex align-items-center justify-content-center text-white text-center p-4">
              <div>
                <p class="mb-2">{{ cameraErro || 'Câmara desligada' }}</p>
                <button class="btn btn-light" @click="cameraAtiva = true">Ligar câmara</button>
              </div>
            </div>
          </div>
          <div class="card-body text-center">
            <p class="text-muted mb-2">Aponte a câmara ao código QR do cartão</p>
            <button class="btn btn-outline-primary w-100" @click="modo = 'manual'">
              Entrada manual (sem QR)
            </button>
          </div>
        </div>

        <!-- Modo manual: pesquisa por nome -->
        <div v-if="modo === 'manual' && !confirmacao" class="card">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h3 class="mb-0">Entrada manual</h3>
              <button class="btn btn-sm btn-outline-secondary" @click="modo = 'scan'">← Voltar ao scanner</button>
            </div>
            <input
              v-model="pesquisa"
              class="form-control form-control-lg mb-3"
              placeholder="Procurar trabalhador por nome…"
              @input="pesquisar"
            />
            <div class="list-group">
              <button
                v-for="t in resultados"
                :key="t.id"
                class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
                @click="selecionarManual(t)"
              >
                <span class="avatar" :style="t.foto ? `background-image: url(${apiBase}${t.foto})` : ''">
                  <template v-if="!t.foto">{{ iniciais(t.nome) }}</template>
                </span>
                <span>
                  <strong>{{ t.nome }}</strong>
                  <span class="d-block text-muted small">{{ t.funcao || '—' }}</span>
                </span>
              </button>
            </div>
            <p v-if="pesquisa && !resultados.length && !aPesquisar" class="text-muted text-center mt-3 mb-0">
              Sem resultados.
            </p>
          </div>
        </div>

        <!-- Cartão de confirmação -->
        <div v-if="confirmacao" class="card">
          <div class="card-body text-center py-4">
            <span
              class="avatar avatar-xl rounded mb-3"
              :style="confirmacao.entidade.foto ? `background-image: url(${apiBase}${confirmacao.entidade.foto})` : ''"
            >
              <template v-if="!confirmacao.entidade.foto">{{ iniciais(confirmacao.entidade.nome) }}</template>
            </span>
            <h2 class="mb-1">{{ confirmacao.entidade.nome }}</h2>
            <p class="text-muted mb-1">
              {{ confirmacao.entidade.funcao || confirmacao.entidade.motivo || '—' }}
              <span v-if="confirmacao.entidade.empresa_nome"> · {{ confirmacao.entidade.empresa_nome }}</span>
            </p>
            <p class="small text-muted mb-4">
              Último registo:
              <template v-if="confirmacao.ultimoMovimento">
                {{ confirmacao.ultimoMovimento.direcao === 'entrada' ? 'Entrada' : 'Saída' }}
                às {{ hora(confirmacao.ultimoMovimento.ocorrido_em) }}
              </template>
              <template v-else>nenhum</template>
            </p>

            <div class="row g-3">
              <div class="col-6">
                <button
                  class="btn btn-success w-100 py-4 fs-2"
                  :class="{ 'opacity-50': confirmacao.direcaoSugerida === 'saida' }"
                  :disabled="aRegistar"
                  @click="registar('entrada')"
                >
                  ENTRADA
                </button>
              </div>
              <div class="col-6">
                <button
                  class="btn btn-danger w-100 py-4 fs-2"
                  :class="{ 'opacity-50': confirmacao.direcaoSugerida === 'entrada' }"
                  :disabled="aRegistar"
                  @click="registar('saida')"
                >
                  SAÍDA
                </button>
              </div>
            </div>

            <button class="btn btn-link text-muted mt-3" @click="cancelarConfirmacao">Cancelar</button>
          </div>
        </div>

        <!-- Flash de sucesso -->
        <transition name="fade">
          <div
            v-if="flash"
            class="alert mt-3 text-center fs-4 py-4"
            :class="flash.direcao === 'entrada' ? 'alert-success' : 'alert-danger'"
          >
            <strong>{{ flash.nome }}</strong><br />
            {{ flash.direcao === 'entrada' ? '✔ Entrada registada' : '✔ Saída registada' }}
          </div>
        </transition>

        <!-- Ocupação atual -->
        <div v-if="ocupacao" class="card mt-3">
          <div class="card-body py-2 d-flex justify-content-around text-center">
            <div><div class="fs-3 fw-bold">{{ ocupacao.total }}</div><div class="text-muted small">No estaleiro</div></div>
            <div><div class="fs-3 fw-bold">{{ ocupacao.trabalhadores }}</div><div class="text-muted small">Trabalhadores</div></div>
            <div><div class="fs-3 fw-bold">{{ ocupacao.visitantes }}</div><div class="text-muted small">Visitantes</div></div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import dayjs from 'dayjs'
import notify from '@common/application/utils/notification'
import { API } from '@common/domain/services/api'
import { socket } from '@common/application/socket'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'
import { TrabalhadoresService } from '@/modules/central/features/trabalhadores/domain/service/TrabalhadoresService'

const apiBase = import.meta.env.VITE_API_URL

const obras = ref<any[]>([])
const obraId = ref<number | null>(Number(localStorage.getItem('portaria.obraId')) || null)
const portao = ref(localStorage.getItem('portaria.portao') || '')

const modo = ref<'scan' | 'manual'>('scan')
const cameraAtiva = ref(true)
const cameraErro = ref('')

const confirmacao = ref<any | null>(null)
const aRegistar = ref(false)
const flash = ref<{ nome: string; direcao: string } | null>(null)

const pesquisa = ref('')
const resultados = ref<any[]>([])
const aPesquisar = ref(false)

const ocupacao = ref<any | null>(null)

const iniciais = (nome: string) =>
  (nome || '').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
const hora = (v: string) => dayjs(v).format('HH:mm')

let bloqueado = false

async function onDetect(codes: any[]) {
  if (bloqueado || confirmacao.value) return
  const raw = codes?.[0]?.rawValue
  if (!raw) return
  bloqueado = true
  try {
    const { data } = await API.post('/api/v1/scan/resolve', { token: raw })
    if (data.tipo === 'equipamento' || data.tipo === 'material') {
      notify.error('Este QR é de um equipamento/material — use o módulo de equipamentos.')
      return
    }
    confirmacao.value = data
  } catch {
    /* erro já notificado pelo interceptor */
  } finally {
    setTimeout(() => (bloqueado = false), 1500)
  }
}

function onCameraError(err: any) {
  cameraAtiva.value = false
  cameraErro.value =
    err?.name === 'NotAllowedError'
      ? 'Permissão de câmara negada.'
      : err?.name === 'InsecureContextError'
        ? 'A câmara exige HTTPS (ou localhost).'
        : `Erro de câmara: ${err?.name ?? 'desconhecido'}`
}

let pesquisaTimer: ReturnType<typeof setTimeout> | null = null
function pesquisar() {
  if (pesquisaTimer) clearTimeout(pesquisaTimer)
  pesquisaTimer = setTimeout(async () => {
    if (!pesquisa.value.trim()) {
      resultados.value = []
      return
    }
    aPesquisar.value = true
    try {
      const { data } = await TrabalhadoresService.index({
        search: pesquisa.value,
        searchable: ['nome', 'documento'],
        perPage: 8,
        page: 1,
        filters: obraId.value ? [{ field: 'obra_id', operator: '=', value: obraId.value }] : [],
      } as any)
      resultados.value = data.data ?? []
    } finally {
      aPesquisar.value = false
    }
  }, 300)
}

function selecionarManual(t: any) {
  confirmacao.value = {
    tipo: 'trabalhador',
    entidade: t,
    ultimoMovimento: null,
    direcaoSugerida: null,
    manual: true,
  }
}

function cancelarConfirmacao() {
  confirmacao.value = null
  pesquisa.value = ''
  resultados.value = []
}

async function registar(direcao: 'entrada' | 'saida') {
  if (!confirmacao.value) return
  aRegistar.value = true
  try {
    const payload: Record<string, any> = {
      direcao,
      portao: portao.value || null,
    }
    if (confirmacao.value.manual) {
      payload.tipo_entidade = confirmacao.value.tipo
      payload.entidade_id = confirmacao.value.entidade.id
      payload.metodo = 'manual'
    } else {
      // reusa o token do QR resolvido? o resolve não devolve o token — guarda-o
      payload.tipo_entidade = confirmacao.value.tipo
      payload.entidade_id = confirmacao.value.entidade.id
      payload.metodo = 'qr'
    }
    await API.post('/api/v1/scan/checkin', payload)
    flash.value = { nome: confirmacao.value.entidade.nome, direcao }
    setTimeout(() => (flash.value = null), 2500)
    cancelarConfirmacao()
    await carregarOcupacao()
  } finally {
    aRegistar.value = false
  }
}

async function carregarObras() {
  const { data } = await ObrasService.index({ perPage: 100, page: 1 } as any)
  obras.value = data.data ?? []
  if (obraId.value && !obras.value.some((o) => o.id === obraId.value)) obraId.value = null
}

async function carregarOcupacao() {
  if (!obraId.value) return
  try {
    const { data } = await API.get(`/api/v1/obras/${obraId.value}/ocupacao`)
    ocupacao.value = data
  } catch {
    ocupacao.value = null
  }
}

watch(obraId, (novo, antigo) => {
  if (antigo) socket.emit('leave-obra', antigo)
  if (novo) {
    localStorage.setItem('portaria.obraId', String(novo))
    socket.emit('join-obra', novo)
    carregarOcupacao()
  }
})
watch(portao, (v) => localStorage.setItem('portaria.portao', v))

function onPresenceUpdate(payload: any) {
  if (payload?.ocupacao) {
    ocupacao.value = { ...(ocupacao.value ?? {}), ...payload.ocupacao }
  }
}

onMounted(async () => {
  await carregarObras()
  if (obraId.value) {
    socket.emit('join-obra', obraId.value)
    carregarOcupacao()
  }
  socket.on('presence-update', onPresenceUpdate)
})

onUnmounted(() => {
  if (obraId.value) socket.emit('leave-obra', obraId.value)
  socket.off('presence-update', onPresenceUpdate)
})
</script>

<style scoped>
.portaria {
  background: var(--tblr-bg-surface-secondary, #f6f8fb);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
