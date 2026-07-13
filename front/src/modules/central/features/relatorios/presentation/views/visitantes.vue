<!--
 -  Tecnobra — Relatório de visitantes.
-->
<template>
  <div class="container-xl">
    <FiltrosRelatorio :busy="busy" @aplicar="carregar" @export-excel="exportarExcel" @export-pdf="exportarPdf" />

    <div ref="conteudo">
      <div v-if="dados?.por_motivo?.length" class="row row-cards mb-3">
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Visitantes por motivo</h3></div>
            <div class="card-body" style="height: 240px">
              <Pie :data="chartData" :options="chartOptions" />
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Visitante</th><th>Empresa</th><th>Motivo</th><th>Anfitrião</th>
                <th class="text-end">Entradas</th><th>Primeira visita</th><th>Última visita</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in dados?.linhas ?? []" :key="l.id">
                <td><strong>{{ l.nome }}</strong></td>
                <td class="text-muted">{{ l.empresa || '—' }}</td>
                <td class="text-muted">{{ l.motivo || '—' }}</td>
                <td class="text-muted">{{ l.anfitriao || '—' }}</td>
                <td class="text-end fw-bold">{{ Number(l.entradas) }}</td>
                <td class="text-muted">{{ fmt(l.primeira_visita) }}</td>
                <td class="text-muted">{{ fmt(l.ultima_visita) }}</td>
              </tr>
              <tr v-if="!busy && !(dados?.linhas ?? []).length">
                <td colspan="7" class="text-center text-muted py-4">Sem visitas no período.</td>
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
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import dayjs from 'dayjs'
import FiltrosRelatorio from './FiltrosRelatorio.vue'
import { RelatoriosService, type RelatorioParams } from '../../domain/service/RelatoriosService'
import { exportToExcel, exportToPdf } from '@common/application/utils/export'

ChartJS.register(ArcElement, Tooltip, Legend)

const busy = ref(false)
const dados = ref<any | null>(null)
const conteudo = ref<HTMLElement | null>(null)

const fmt = (v?: string | null) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—')

async function carregar(params: RelatorioParams) {
  busy.value = true
  try {
    const { data } = await RelatoriosService.visitantes(params)
    dados.value = data
  } finally {
    busy.value = false
  }
}

const CORES = ['#206bc4', '#2fb344', '#f59f00', '#d63939', '#ae3ec9', '#17a2b8', '#74b816']

const chartData = computed(() => ({
  labels: (dados.value?.por_motivo ?? []).map((m: any) => m.motivo),
  datasets: [
    {
      data: (dados.value?.por_motivo ?? []).map((m: any) => Number(m.visitantes)),
      backgroundColor: CORES,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right' as const } },
}

function exportarExcel() {
  exportToExcel(
    (dados.value?.linhas ?? []).map((l: any) => ({
      Visitante: l.nome,
      Empresa: l.empresa,
      Motivo: l.motivo,
      'Anfitrião': l.anfitriao,
      Entradas: Number(l.entradas),
      'Primeira visita': l.primeira_visita,
      'Última visita': l.ultima_visita,
    })),
    'relatorio-visitantes',
    'Visitantes'
  )
}

function exportarPdf() {
  if (conteudo.value) exportToPdf(conteudo.value, 'relatorio-visitantes')
}
</script>
