<!--
 -  Tecnobra — Cartão digital público (/c/:token).
 -  Página mobile-first e imprimível: o trabalhador/visitante abre a ligação
 -  recebida por e-mail/WhatsApp e apresenta o QR na portaria.
-->
<template>
  <div class="cartao-page d-flex align-items-center justify-content-center min-vh-100 p-3">
    <div v-if="loading" class="text-center">
      <div class="spinner-border text-primary" />
    </div>

    <div v-else-if="erro" class="card text-center" style="max-width: 420px; width: 100%">
      <div class="card-body py-5">
        <h2 class="mb-2">Cartão não encontrado</h2>
        <p class="text-muted mb-0">Este cartão não existe, foi revogado ou expirou.</p>
      </div>
    </div>

    <div v-else-if="card" class="card cartao shadow" style="max-width: 420px; width: 100%">
      <div class="card-header d-flex align-items-center justify-content-between">
        <strong>Tecnobra</strong>
        <span class="badge" :class="card.tipo === 'trabalhador' ? 'bg-blue text-blue-fg' : 'bg-purple text-purple-fg'">
          {{ card.tipo === 'trabalhador' ? 'Trabalhador' : 'Visitante' }}
        </span>
      </div>
      <div class="card-body text-center">
        <span
          class="avatar avatar-xl rounded mb-3"
          :style="card.foto ? `background-image: url(${apiBase}${card.foto})` : ''"
        >
          <template v-if="!card.foto">{{ iniciais(card.nome) }}</template>
        </span>
        <h2 class="mb-0">{{ card.nome }}</h2>
        <p class="text-muted mb-1">{{ card.subtitulo || '—' }}</p>
        <p class="text-muted small mb-3">
          <span v-if="card.empresa">{{ card.empresa }}</span>
          <span v-if="card.empresa && card.obra"> · </span>
          <span v-if="card.obra">{{ card.obra }}</span>
        </p>

        <img :src="card.qrDataUrl" alt="Código QR" class="border rounded p-2 bg-white" style="width: 240px; height: 240px" />

        <p v-if="card.validade?.ate" class="text-muted small mt-3 mb-0">
          Válido de {{ fmt(card.validade.de) }} até {{ fmt(card.validade.ate) }}
        </p>
      </div>
      <div class="card-footer text-center d-print-none">
        <button class="btn btn-outline-primary btn-sm" @click="imprimir">Imprimir cartão</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'

type CardPayload = {
  tipo: 'trabalhador' | 'visitante'
  nome: string
  subtitulo: string
  empresa: string | null
  obra: string | null
  foto: string | null
  validade: { de: string | null; ate: string | null } | null
  qrDataUrl: string
}

const route = useRoute()
const apiBase = import.meta.env.VITE_API_URL
const loading = ref(true)
const erro = ref(false)
const card = ref<CardPayload | null>(null)

const iniciais = (nome: string) =>
  (nome || '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

const fmt = (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—')

const imprimir = () => window.print()

onMounted(async () => {
  try {
    // Endpoint público — sem interceptors de auth do API service
    const { data } = await axios.get(`${apiBase}/api/public/cards/${route.params.token}`)
    card.value = data
  } catch {
    erro.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.cartao-page {
  background: var(--tblr-bg-surface-secondary, #f6f8fb);
}
@media print {
  .cartao-page {
    background: #fff;
  }
  .cartao {
    box-shadow: none !important;
    border: 1px solid #ddd;
  }
}
</style>
