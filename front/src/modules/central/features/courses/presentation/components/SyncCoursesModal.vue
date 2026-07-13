<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -->
<template>
  <BModal
    v-model="visible"
    title="Sincronizar cursos com o Thinkific"
    size="lg"
    centered
    :no-close-on-backdrop="isRunning"
    :no-close-on-esc="isRunning"
    no-footer
    @hidden="onHidden"
  >
    <!-- Cabeçalho / progresso -->
    <div class="mb-3">
      <template v-if="phase === 'manifest'">
        <div class="d-flex align-items-center gap-2 text-muted">
          <BSpinner small /> A obter a lista de cursos do Thinkific...
        </div>
      </template>

      <template v-else-if="phase === 'error-manifest'">
        <div class="alert alert-danger mb-0">
          Não foi possível obter a lista de cursos do Thinkific.
          <button class="btn btn-sm btn-danger ms-2" @click="start">Tentar novamente</button>
        </div>
      </template>

      <template v-else>
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong>
            {{ doneCount }} / {{ total }} processados
          </strong>
          <span class="text-muted small">
            <span class="text-success">{{ okCount }} ✓</span>
            <span v-if="errorCount" class="text-danger ms-2">{{ errorCount }} ✗</span>
          </span>
        </div>
        <div class="progress" style="height: 10px">
          <div
            class="progress-bar"
            :class="{
              'bg-success': phase === 'done' && !errorCount,
              'bg-warning': phase === 'done' && errorCount,
            }"
            role="progressbar"
            :style="{ width: progress + '%' }"
          ></div>
        </div>

        <div v-if="phase === 'done'" class="mt-2 small">
          <span v-if="!errorCount" class="text-success">Sincronização concluída com sucesso.</span>
          <span v-else class="text-warning">
            Concluído com {{ errorCount }} falha(s). Podes repetir os que falharam.
          </span>
          <span v-if="deleted.length" class="text-muted d-block">
            {{ deleted.length }} curso(s) removido(s) por já não existirem no Thinkific.
          </span>
        </div>
      </template>
    </div>

    <!-- Barra de pesquisa -->
    <div v-if="items.length" class="input-group input-group-flat mb-2">
      <span class="input-group-text">
        <i class="ti ti-search"></i>
      </span>
      <input
        v-model="search"
        type="text"
        class="form-control"
        placeholder="Pesquisar por nome ou slug..."
      />
      <span v-if="search" class="input-group-text">
        <a href="#" class="link-secondary" @click.prevent="search = ''" title="Limpar">
          <i class="ti ti-x"></i>
        </a>
      </span>
    </div>

    <!-- Lista de cursos -->
    <div v-if="items.length" class="border rounded" style="max-height: 340px; overflow-y: auto">
      <div
        v-if="!filteredItems.length"
        class="text-muted small text-center px-3 py-4"
      >
        Nenhum curso corresponde a "{{ search }}".
      </div>
      <div
        v-for="item in filteredItems"
        :key="item.slug"
        class="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
      >
        <div class="text-truncate me-2">
          <span class="fw-medium">{{ item.name || item.slug }}</span>
          <span class="text-muted small d-block text-truncate">{{ item.slug }}</span>
          <span
            v-if="item.status === 'error' && item.error"
            class="text-danger small d-block text-truncate"
            :title="item.error"
          >{{ item.error }}</span>
        </div>
        <div class="flex-shrink-0">
          <BSpinner v-if="item.status === 'running'" small />
          <span v-else-if="item.status === 'pending'" class="badge bg-secondary-lt">Em espera</span>
          <span v-else-if="item.status === 'ok'" class="badge bg-success-lt">
            {{ item.action === 'created' ? 'Criado' : 'Atualizado' }}
          </span>
          <span
            v-else-if="item.status === 'error'"
            class="badge bg-danger-lt"
            :title="item.error || ''"
          >Falhou</span>
        </div>
      </div>
    </div>

    <!-- Ações -->
    <div class="d-flex justify-content-end gap-2 mt-3">
      <BButton
        v-if="phase === 'done' && errorCount"
        variant="warning"
        :disabled="isRunning"
        @click="retryFailed"
      >
        Repetir falhados ({{ errorCount }})
      </BButton>
      <BButton variant="secondary" :disabled="isRunning" @click="hide">
        {{ phase === 'done' ? 'Fechar' : 'Cancelar' }}
      </BButton>
    </div>
  </BModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CoursesService } from '../../domain/service/CoursesService'

type ItemStatus = 'pending' | 'running' | 'ok' | 'error'
interface SyncItem {
  slug: string
  name: string
  productable_type: string
  productable_id: number
  product_id: string
  description: string | null
  price: number
  days_until_expiry: number
  status: ItemStatus
  action?: 'created' | 'updated'
  error?: string
}

const CONCURRENCY = 3

const emit = defineEmits<{ (e: 'done'): void }>()

const visible = ref(false)
const phase = ref<'idle' | 'manifest' | 'error-manifest' | 'syncing' | 'done'>('idle')
const items = ref<SyncItem[]>([])
const deleted = ref<string[]>([])
const search = ref('')
let cancelled = false

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (i) => i.name?.toLowerCase().includes(q) || i.slug?.toLowerCase().includes(q),
  )
})

const total = computed(() => items.value.length)
const okCount = computed(() => items.value.filter((i) => i.status === 'ok').length)
const errorCount = computed(() => items.value.filter((i) => i.status === 'error').length)
const doneCount = computed(() => okCount.value + errorCount.value)
const progress = computed(() => (total.value ? Math.round((doneCount.value / total.value) * 100) : 0))
const isRunning = computed(() => phase.value === 'manifest' || phase.value === 'syncing')

function show() {
  visible.value = true
  start()
}
function hide() {
  cancelled = true
  visible.value = false
}
function onHidden() {
  // Se sincronizou algo, avisa o pai para refrescar a tabela.
  if (okCount.value > 0 || deleted.value.length) emit('done')
}

async function start() {
  cancelled = false
  phase.value = 'manifest'
  items.value = []
  deleted.value = []
  search.value = ''
  try {
    const res = await CoursesService.syncManifest()
    const manifest = res?.data?.items || []
    items.value = manifest.map((p: any) => ({ ...p, status: 'pending' as ItemStatus }))
    if (cancelled) return
    if (!items.value.length) {
      phase.value = 'done'
      return
    }
    await runSync(items.value)
  } catch {
    phase.value = 'error-manifest'
  }
}

async function retryFailed() {
  const failed = items.value.filter((i) => i.status === 'error')
  failed.forEach((i) => {
    i.status = 'pending'
    i.error = undefined
  })
  await runSync(failed)
}

async function runSync(targets: SyncItem[]) {
  phase.value = 'syncing'
  const queue = [...targets]

  const worker = async () => {
    while (queue.length && !cancelled) {
      const item = queue.shift()!
      item.status = 'running'
      try {
        const res = await CoursesService.syncItem(payloadOf(item))
        item.action = res?.data?.status
        item.status = 'ok'
      } catch (err: any) {
        item.status = 'error'
        item.error = err?.response?.data?.message || 'Falha ao sincronizar'
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
  if (cancelled) return

  // Só apaga órfãos quando TODOS foram processados (nenhum ainda pendente/em espera).
  const allProcessed = items.value.every((i) => i.status === 'ok' || i.status === 'error')
  if (allProcessed) {
    try {
      const res = await CoursesService.syncFinalize(items.value.map((i) => i.slug))
      deleted.value = res?.data?.deleted || []
    } catch {
      // Falha na limpeza não invalida a sync; só não removeu órfãos.
    }
  }
  phase.value = 'done'
}

function payloadOf(i: SyncItem) {
  return {
    product_id: i.product_id,
    slug: i.slug,
    name: i.name,
    description: i.description,
    price: i.price,
    days_until_expiry: i.days_until_expiry,
    productable_type: i.productable_type,
    productable_id: i.productable_id,
  }
}

defineExpose({ show, hide })
</script>
