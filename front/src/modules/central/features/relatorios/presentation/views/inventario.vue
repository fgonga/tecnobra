<!--
 -  Tecnobra — Relatório de inventário (equipamentos).
-->
<template>
  <div class="container-xl">
    <FiltrosRelatorio :busy="busy" @aplicar="carregar" @export-excel="exportarExcel" @export-pdf="exportarPdf" />

    <div ref="conteudo">
      <div v-if="dados" class="row row-cards mb-3">
        <div class="col-6 col-md-2" v-for="e in dados.estados" :key="e.estado">
          <div class="card">
            <div class="card-body text-center py-3">
              <div class="h2 mb-0">{{ Number(e.total) }}</div>
              <div class="text-muted small">{{ ESTADO_LABEL[e.estado] ?? e.estado }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-header"><h3 class="card-title">Em uso agora</h3></div>
        <div class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr><th>Equipamento</th><th>Código</th><th>Categoria</th><th>Responsável</th><th>Levantado em</th></tr>
            </thead>
            <tbody>
              <tr v-for="e in dados?.em_uso ?? []" :key="e.id">
                <td><strong>{{ e.nome }}</strong></td>
                <td class="text-muted">{{ e.codigo || '—' }}</td>
                <td class="text-muted">{{ e.categoria === 'equipamento' ? 'Equipamento' : 'Ferramenta' }}</td>
                <td>{{ e.responsavel || '—' }}</td>
                <td class="text-muted">{{ fmt(e.levantado_em) }}</td>
              </tr>
              <tr v-if="!(dados?.em_uso ?? []).length">
                <td colspan="5" class="text-center text-muted py-3">Nenhum equipamento em uso.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">Danificados / desaparecidos no período</h3></div>
        <div class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr><th>Equipamento</th><th>Código</th><th>Estado</th><th>Responsável</th><th>Quando</th><th>Obs.</th></tr>
            </thead>
            <tbody>
              <tr v-for="(d, i) in dados?.danos ?? []" :key="i">
                <td><strong>{{ d.nome }}</strong></td>
                <td class="text-muted">{{ d.codigo || '—' }}</td>
                <td>
                  <span v-if="d.estado_devolucao === 'danificado'" class="badge bg-orange text-orange-fg">Danificado</span>
                  <span v-else class="badge bg-red text-red-fg">Desaparecido</span>
                </td>
                <td>{{ d.responsavel || '—' }}</td>
                <td class="text-muted">{{ fmt(d.ocorrido_em) }}</td>
                <td class="text-muted">{{ d.obs || '—' }}</td>
              </tr>
              <tr v-if="!(dados?.danos ?? []).length">
                <td colspan="6" class="text-center text-muted py-3">Sem ocorrências no período.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import FiltrosRelatorio from './FiltrosRelatorio.vue'
import { RelatoriosService, type RelatorioParams } from '../../domain/service/RelatoriosService'
import { exportToExcel, exportToPdf } from '@common/application/utils/export'

const busy = ref(false)
const dados = ref<any | null>(null)
const conteudo = ref<HTMLElement | null>(null)

const ESTADO_LABEL: Record<string, string> = {
  disponivel: 'Disponíveis',
  em_uso: 'Em uso',
  danificado: 'Danificados',
  fora_servico: 'Fora de serviço',
  desaparecido: 'Desaparecidos',
}

const fmt = (v?: string | null) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—')

async function carregar(params: RelatorioParams) {
  busy.value = true
  try {
    const { data } = await RelatoriosService.inventario(params)
    dados.value = data
  } finally {
    busy.value = false
  }
}

function exportarExcel() {
  exportToExcel(
    (dados.value?.em_uso ?? []).map((e: any) => ({
      Equipamento: e.nome,
      'Código': e.codigo,
      Categoria: e.categoria,
      'Responsável': e.responsavel,
      'Levantado em': e.levantado_em,
    })),
    'relatorio-inventario',
    'Em uso'
  )
}

function exportarPdf() {
  if (conteudo.value) exportToPdf(conteudo.value, 'relatorio-inventario')
}
</script>
