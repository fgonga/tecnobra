<!--
 -  Tecnobra — Relatório de materiais: orçado vs entregue vs consumido.
-->
<template>
  <div class="container-xl">
    <FiltrosRelatorio :busy="busy" @aplicar="carregar" @export-excel="exportarExcel" @export-pdf="exportarPdf" />

    <div ref="conteudo">
      <div v-if="linhas.length" class="card mb-3">
        <div class="card-header"><h3 class="card-title">Orçado vs entregue vs consumido</h3></div>
        <div class="card-body" style="height: 280px">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Material</th>
                <th class="text-end">Orçado</th>
                <th class="text-end">Entregue</th>
                <th class="text-end">Consumido</th>
                <th class="text-end">Stock atual</th>
                <th class="text-end">Desvio vs orçado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in linhas" :key="m.id" :class="m.stock_atual <= m.stock_minimo ? 'table-danger' : ''">
                <td>
                  <strong>{{ m.nome }}</strong>
                  <span class="d-block text-muted small">{{ m.unidade }} · {{ m.categoria || '—' }}</span>
                </td>
                <td class="text-end">{{ m.orcado }}</td>
                <td class="text-end">{{ m.entregue }}</td>
                <td class="text-end">{{ m.consumido }}</td>
                <td class="text-end fw-bold">{{ m.stock_atual }}</td>
                <td class="text-end">
                  <span v-if="m.desvio_pct === null" class="text-muted">—</span>
                  <span v-else :class="m.desvio_pct > 0 ? 'text-danger' : 'text-success'">
                    {{ m.desvio_pct > 0 ? '+' : '' }}{{ m.desvio_pct }}%
                  </span>
                </td>
              </tr>
              <tr v-if="!busy && !linhas.length">
                <td colspan="6" class="text-center text-muted py-4">Sem materiais.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import FiltrosRelatorio from './FiltrosRelatorio.vue'
import { RelatoriosService, type RelatorioParams } from '../../domain/service/RelatoriosService'
import { exportToExcel, exportToPdf } from '@common/application/utils/export'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const busy = ref(false)
const dados = ref<any | null>(null)
const conteudo = ref<HTMLElement | null>(null)

const linhas = computed(() => dados.value?.linhas ?? [])

async function carregar(params: RelatorioParams) {
  busy.value = true
  try {
    const { data } = await RelatoriosService.materiais(params)
    dados.value = data
  } finally {
    busy.value = false
  }
}

const chartData = computed(() => ({
  labels: linhas.value.map((m: any) => m.nome),
  datasets: [
    { label: 'Orçado', data: linhas.value.map((m: any) => m.orcado), backgroundColor: '#adb5bd' },
    { label: 'Entregue', data: linhas.value.map((m: any) => m.entregue), backgroundColor: '#206bc4' },
    { label: 'Consumido', data: linhas.value.map((m: any) => m.consumido), backgroundColor: '#f59f00' },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
  scales: { y: { beginAtZero: true } },
}

function exportarExcel() {
  exportToExcel(
    linhas.value.map((m: any) => ({
      Material: m.nome,
      Unidade: m.unidade,
      Categoria: m.categoria,
      'Orçado': m.orcado,
      Entregue: m.entregue,
      Consumido: m.consumido,
      'Stock atual': m.stock_atual,
      'Stock mínimo': m.stock_minimo,
      'Desvio (%)': m.desvio_pct,
    })),
    'relatorio-materiais',
    'Materiais'
  )
}

function exportarPdf() {
  if (conteudo.value) exportToPdf(conteudo.value, 'relatorio-materiais')
}
</script>
