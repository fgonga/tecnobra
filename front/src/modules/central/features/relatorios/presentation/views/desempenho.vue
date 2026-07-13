<!--
 -  Tecnobra — Relatório de desempenho (produtividade por trabalhador/métrica).
-->
<template>
  <div>
    <FiltrosRelatorio :busy="busy" @aplicar="carregar" @export-excel="exportarExcel" @export-pdf="exportarPdf" />

    <div ref="conteudo">
      <div v-if="linhas.length" class="card mb-3">
        <div class="card-header"><h3 class="card-title">Total por trabalhador</h3></div>
        <div class="card-body" style="height: 260px">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Trabalhador</th><th>Função</th><th>Métrica</th>
                <th class="text-end">Total</th>
                <th class="text-end">Dias</th>
                <th class="text-end">Média/dia</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(l, i) in linhas" :key="i">
                <td><strong>{{ l.nome }}</strong></td>
                <td class="text-muted">{{ l.funcao || '—' }}</td>
                <td>{{ l.metrica }} ({{ l.unidade }})</td>
                <td class="text-end fw-bold">{{ Number(l.total) }}</td>
                <td class="text-end">{{ Number(l.dias) }}</td>
                <td class="text-end">{{ Number(l.media_dia) }}</td>
              </tr>
              <tr v-if="!busy && !linhas.length">
                <td colspan="6" class="text-center text-muted py-4">Sem registos de desempenho no período.</td>
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
    const { data } = await RelatoriosService.desempenho(params)
    dados.value = data
  } finally {
    busy.value = false
  }
}

const chartData = computed(() => ({
  labels: linhas.value.map((l: any) => `${l.nome} (${l.metrica})`),
  datasets: [
    {
      label: 'Total',
      data: linhas.value.map((l: any) => Number(l.total)),
      backgroundColor: '#2fb344',
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true } },
}

function exportarExcel() {
  exportToExcel(
    linhas.value.map((l: any) => ({
      Trabalhador: l.nome,
      'Função': l.funcao,
      'Métrica': l.metrica,
      Unidade: l.unidade,
      Total: Number(l.total),
      Dias: Number(l.dias),
      'Média/dia': Number(l.media_dia),
    })),
    'relatorio-desempenho',
    'Desempenho'
  )
}

function exportarPdf() {
  if (conteudo.value) exportToPdf(conteudo.value, 'relatorio-desempenho')
}
</script>
