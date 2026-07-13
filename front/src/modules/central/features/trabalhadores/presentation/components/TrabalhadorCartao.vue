<!--
 -  Tecnobra — Separador "Cartão QR" do trabalhador: pré-visualização,
 -  emissão (envia email/WhatsApp) e revogação.
-->
<template>
  <div class="p-4">
    <LoadingState v-if="loading" />
    <div v-else-if="cartao" class="text-center">
      <div class="mb-3">
        <span v-if="cartao.cartao_estado === 'ativo'" class="badge bg-green text-green-fg">Cartão ativo</span>
        <span v-else class="badge bg-red text-red-fg">Cartão revogado</span>
      </div>

      <img
        :src="cartao.qrDataUrl"
        alt="Código QR do cartão"
        class="border rounded p-2 bg-white"
        style="width: 220px; height: 220px"
      />

      <div class="mt-2 small text-muted text-break">
        <a :href="cartao.link" target="_blank" rel="noopener">{{ cartao.link }}</a>
      </div>

      <div class="d-flex justify-content-center gap-2 mt-4 flex-wrap">
        <button class="btn btn-primary" :disabled="busy" @click="emitir(false)">
          <span v-if="busy" class="spinner-border spinner-border-sm me-2" />
          Emitir / reenviar cartão
        </button>
        <button class="btn btn-outline-warning" :disabled="busy" @click="emitir(true)">
          Renovar token
        </button>
        <button
          v-if="cartao.cartao_estado === 'ativo'"
          class="btn btn-outline-danger"
          :disabled="busy"
          @click="revogar"
        >
          Revogar
        </button>
      </div>
      <p class="text-muted small mt-3 mb-0">
        Ao emitir, o trabalhador recebe o cartão por e-mail (com o QR anexado) e por WhatsApp,
        conforme os templates ativos nas definições de notificações.
      </p>
    </div>
    <EmptyState v-else message="Sem informação de cartão" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import notify from '@common/application/utils/notification'
import { CartaoService } from '../../domain/service/TrabalhadoresService'
import type { ICartaoPreview, ITrabalhador } from '../../application/dtos'

const props = defineProps<{ trabalhador?: ITrabalhador | null }>()

const loading = ref(true)
const busy = ref(false)
const cartao = ref<ICartaoPreview | null>(null)

async function load() {
  if (!props.trabalhador?.id) return
  loading.value = true
  try {
    const { data } = await CartaoService.preview(props.trabalhador.id)
    cartao.value = data
  } catch {
    cartao.value = null
  } finally {
    loading.value = false
  }
}

async function emitir(renovar: boolean) {
  if (!props.trabalhador?.id) return
  busy.value = true
  try {
    await CartaoService.emitir(props.trabalhador.id, renovar)
    notify.success(renovar ? 'Token renovado e cartão reenviado.' : 'Cartão emitido e enviado.')
    await load()
  } finally {
    busy.value = false
  }
}

async function revogar() {
  if (!props.trabalhador?.id) return
  busy.value = true
  try {
    await CartaoService.revogar(props.trabalhador.id)
    notify.success('Cartão revogado.')
    await load()
  } finally {
    busy.value = false
  }
}

onMounted(load)
watch(() => props.trabalhador?.id, load)
</script>
