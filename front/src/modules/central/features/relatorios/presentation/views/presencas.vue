<!--
 -  Tecnobra — Relatório de presenças (frequência por trabalhador).
-->
<template>
  <div class="container-xl">
    <FiltrosRelatorio :busy="busy" @aplicar="carregar" @export-excel="exportarExcel" @export-pdf="exportarPdf" />

    <div ref="conteudo">
      <div v-if="dados" class="row row-cards mb-3">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Trabalhadores presentes por dia</h3></div>
            <div class="card-body" style="height: 240px">
              <Line :data="chartData" :options="chartOptions" />
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center py-4">
              <div class="h1 mb-0">{{ dados.linhas.length }}</div>
              <div class="text-muted">Trabalhadores com presenças no período</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Trabalhador</th><th>Função</th><th>Empresa</th>
                <th class="text-end">Dias presentes</th>
                <th class="text-end">Entradas</th><th class="text-end">Saídas</th>
                <th>Primeira entrada</th><th>Última saída</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in dados?.linhas ?? []" :key="l.id">
                <td><strong>{{ l.nome }}</strong></td>
                <td class="text-muted">{{ l.funcao || '—' }}</td>
                <td class="text-muted">{{ l.empresa || '—' }}</td>
                <td class="text-end fw-bold">{{ Number(l.dias_presentes) }}</td>
                <td class="text-end">{{ Number(l.entradas) }}</td>
                <td class="text-end">{{ Number(l.saidas) }}</td>
                <td class="text-muted">{{ l.primeira_entrada || '—' }}</td>
                <td class="text-muted">{{ l.ultima_saida || '—' }}</td>
              </tr>
              <tr v-if="!busy && !(dados?.linhas ?? []).length">
                <td colspan="8" class="text-center text-muted py-4">Sem presenças no período.</td>
              </tr>
            </tbody>
            <tfoot v-if="dados?.linhas?.length">
              <tr>
                <th colspan="3">Totais</th>
                <th class="text-end">{{ totais.dias }}</th>
                <th class="text-end">{{ totais.entradas }}</th>
                <th class="text-end">{{ totais.saidas }}</th>
                <th colspan="2"></th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import dayjs from 'dayjs'
import FiltrosRelatorio from './FiltrosRelatorio.vue'
import { RelatoriosService, type RelatorioParams } from '../../domain/service/RelatoriosService'
import { exportToExcel, exportToPdf } from '@common/application/utils/export'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

const busy = ref(false)
const dados = ref<any | null>(null)
const conteudo = ref<HTMLElement | null>(null)

async function carregar(params: RelatorioParams) {
  busy.value = true
  try {
    const { data } = await RelatoriosService.presencas(params)
    dados.value = data
  } finally {
    busy.value = false
  }
}

const totais = computed(() => {
  const linhas = dados.value?.linhas ?? []
  return {
    dias: linhas.reduce((s: number, l: any) => s + Number(l.dias_presentes), 0),
    entradas: linhas.reduce((s: number, l: any) => s + Number(l.entradas), 0),
    saidas: linhas.reduce((s: number, l: any) => s + Number(l.saidas), 0),
  }
})

const chartData = computed(() => ({
  labels: (dados.value?.por_dia ?? []).map((d: any) => dayjs(d.dia).format('DD/MM')),
  datasets: [
    {
      label: 'Trabalhadores',
      data: (dados.value?.por_dia ?? []).map((d: any) => Number(d.trabalhadores)),
      borderColor: '#206bc4',
      backgroundColor: 'rgba(32,107,196,0.1)',
      fill: true,
      tension: 0.3,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}

function exportarExcel() {
  exportToExcel(
    (dados.value?.linhas ?? []).map((l: any) => ({
      Trabalhador: l.nome,
      'Função': l.funcao,
      Empresa: l.empresa,
      'Dias presentes': Number(l.dias_presentes),
      Entradas: Number(l.entradas),
      'Saídas': Number(l.saidas),
      'Primeira entrada': l.primeira_entrada,
      'Última saída': l.ultima_saida,
    })),
    'relatorio-presencas',
    'Presenças'
  )
}

function exportarPdf() {
  if (conteudo.value) exportToPdf(conteudo.value, 'relatorio-presencas')
}
</script>
