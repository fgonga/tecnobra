<!--
 -  Tecnobra — Painel de stock ao vivo: atual vs mínimo vs orçado vs
 -  entregue vs consumido, por obra. Atualiza via socket (stock-update).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <div class="page-pretitle">Recursos</div>
          <h2 class="page-title">Painel de stock</h2>
        </div>
        <select v-model.number="obraId" class="form-select" style="max-width: 260px">
          <option :value="null" disabled>Selecionar obra…</option>
          <option v-for="o in obras" :key="o.id" :value="o.id">{{ o.codigo }} — {{ o.nome }}</option>
        </select>
      </div>

      <div v-if="!obraId" class="card text-center py-5">
        <div class="card-body text-muted">Escolha uma obra para ver o stock.</div>
      </div>

      <div v-else-if="loading" class="text-center py-5"><div class="spinner-border text-primary" /></div>

      <div v-else class="card">
        <div class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Material</th>
                <th class="text-end">Stock atual</th>
                <th class="text-end">Mínimo</th>
                <th class="text-end">Orçado</th>
                <th class="text-end">Entregue</th>
                <th class="text-end">Consumido</th>
                <th class="text-end">Desvio (entregue vs consumido)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in linhas" :key="m.id" :class="m.abaixo_minimo ? 'table-danger' : ''">
                <td>
                  <strong>{{ m.nome }}</strong>
                  <span class="d-block text-muted small">{{ m.categoria || '—' }}</span>
                </td>
                <td class="text-end fw-bold">{{ m.stock_atual }} {{ m.unidade }}</td>
                <td class="text-end text-muted">{{ m.stock_minimo }}</td>
                <td class="text-end">{{ m.orcado }}</td>
                <td class="text-end">{{ m.entregue }}</td>
                <td class="text-end">{{ m.consumido }}</td>
                <td class="text-end">
                  <span :class="m.entregue - m.consumido < 0 ? 'text-danger' : ''">
                    {{ (m.entregue - m.consumido).toFixed(1) }}
                  </span>
                </td>
                <td>
                  <span v-if="m.abaixo_minimo" class="badge bg-red text-red-fg">Stock baixo</span>
                  <span v-else class="badge bg-green text-green-fg">OK</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { socket } from '@common/application/socket'
import { StockService } from '../../domain/service/MateriaisService'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'
import type { IStockRow } from '../../application/dtos'

const obras = ref<any[]>([])
const obraId = ref<number | null>(Number(localStorage.getItem('stock.obraId')) || null)
const linhas = ref<IStockRow[]>([])
const loading = ref(false)

async function carregar() {
  if (!obraId.value) return
  loading.value = true
  try {
    const { data } = await StockService.porObra(obraId.value)
    linhas.value = data
  } finally {
    loading.value = false
  }
}

function onStockUpdate() {
  carregar()
}

watch(obraId, (novo, antigo) => {
  if (antigo) socket.emit('leave-obra', antigo)
  if (novo) {
    localStorage.setItem('stock.obraId', String(novo))
    socket.emit('join-obra', novo)
    carregar()
  }
})

onMounted(async () => {
  const { data } = await ObrasService.index({ perPage: 100, page: 1 } as any)
  obras.value = data.data ?? []
  if (obraId.value) {
    socket.emit('join-obra', obraId.value)
    carregar()
  }
  socket.on('stock-update', onStockUpdate)
})

onUnmounted(() => {
  if (obraId.value) socket.emit('leave-obra', obraId.value)
  socket.off('stock-update', onStockUpdate)
})
</script>
