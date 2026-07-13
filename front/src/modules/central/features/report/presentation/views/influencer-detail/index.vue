<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -->
<template>
  <div class="page-body">
    <div class="container-xl">
      <!-- Toolbar -->
      <div class="d-flex justify-content-end align-items-center gap-2 flex-wrap mb-3 d-print-none">
        <button class="btn btn-primary" @click="handleFilter">
          <IconFilterFilled size="15" class="me-1" /> Filtrar
        </button>
        <button class="btn btn-default" @click="exportExcel">
          <IconFileTypeXls size="15" class="me-1" /> Excel
        </button>
        <button class="btn btn-default" @click="exportPdf">
          <IconFileTypePdf size="15" class="me-1" /> PDF
        </button>
      </div>

      <!-- Filters -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-end">
            <div class="col-md-2">
              <label class="form-label">Início</label>
              <input class="form-control form-control-sm" type="date" v-model="form.start" />
            </div>
            <div class="col-md-2">
              <label class="form-label">Fim</label>
              <input class="form-control form-control-sm" type="date" v-model="form.end" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Influenciador (opcional)</label>
              <InfluencerEntity v-model="form.influencer" />
            </div>
            <div class="col-auto">
              <button class="btn btn-sm btn-ghost-secondary" @click="clearFilters">Limpar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- States -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status"></div>
      </div>
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="handleFilter">Tentar novamente</button>
      </div>
      <div v-else-if="!result" class="text-center py-5 text-muted">
        <IconUsers size="40" class="mb-2 opacity-50" />
        <div>Seleccione um período e clique em <strong>Filtrar</strong> para gerar o relatório.</div>
      </div>

      <div v-else ref="reportEl">

        <!-- KPI Summary -->
        <div class="row g-3 mb-4">
          <div class="col-sm-6 col-lg-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                  <div class="subheader">Influenciadores</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-blue-lt text-blue"><IconUsers size="16"/></span>
                </div>
                <div class="h1 mb-0">{{ result.totals?.total_influencers ?? 0 }}</div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                  <div class="subheader">Total Vendas</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-teal-lt text-teal"><IconShoppingCart size="16"/></span>
                </div>
                <div class="h1 mb-0">{{ fmtNum(result.totals?.total_sales ?? 0) }}</div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                  <div class="subheader">Receita Total</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-green-lt text-green"><IconCurrencyDollar size="16"/></span>
                </div>
                <div class="h1 mb-0 text-green">{{ toMoney(result.totals?.total_revenue ?? 0) }}</div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                  <div class="subheader">Total Comissões</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-purple-lt text-purple"><IconStar size="16"/></span>
                </div>
                <div class="h1 mb-0 text-purple">{{ toMoney(result.totals?.total_commission ?? 0) }}</div>
              </div>
            </div>
          </div>
          <div class="col-sm-6 col-lg-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                  <div class="subheader">Total Devoluções</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-orange-lt text-orange"><IconArrowBackUp size="16"/></span>
                </div>
                <div class="h1 mb-0 text-orange">{{ fmtNum(result.totals?.total_refunds_count ?? 0) }}</div>
                <div class="text-muted small mt-1">{{ toMoney(result.totals?.total_refunds_amount ?? 0) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-header">
                <h3 class="card-title"><IconChartBar size="16" class="me-2 text-muted"/>Vendas por Influenciador</h3>
              </div>
              <div class="card-body">
                <Bar :data="salesBarChart" :options="chartOptions" />
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-header">
                <h3 class="card-title"><IconChartPie size="16" class="me-2 text-muted"/>Distribuição das Vendas</h3>
              </div>
              <div class="card-body d-flex align-items-center justify-content-center">
                <Pie :data="salesPieChart" :options="chartOptions" style="max-height: 280px;" />
              </div>
            </div>
          </div>
        </div>

        <!-- Per-influencer detail -->
        <div
          v-for="inf in result.influencers"
          :key="inf.influencer_id"
          class="card mb-4"
        >
          <div class="card-header">
            <h3 class="card-title">
              <IconUser size="16" class="me-2 text-muted" />
              {{ inf.influencer_name }}
            </h3>
            <div class="card-options gap-2">
              <span class="badge bg-teal-lt text-teal">{{ fmtNum(inf.total_sales) }} vendas</span>
              <span class="badge bg-green-lt text-green">{{ toMoney(inf.total_revenue) }} receita</span>
              <span class="badge bg-purple-lt text-purple">{{ inf.commission_pct }}% · {{ toMoney(inf.total_commission) }}</span>
              <span v-if="inf.total_refunds_count > 0" class="badge bg-orange-lt text-orange">
                <IconArrowBackUp size="12" class="me-1"/>{{ inf.total_refunds_count }} dev. · {{ toMoney(inf.total_refunds_amount) }}
              </span>
            </div>
          </div>

          <!-- Course-level summary row -->
          <div class="card-body pb-0">
            <div class="row g-2 mb-3">
              <div class="col-sm-3 col-6">
                <div class="border rounded p-2 text-center">
                  <div class="subheader small">Bruto</div>
                  <div class="fw-bold">{{ toMoney(inf.total_gross) }}</div>
                </div>
              </div>
              <div class="col-sm-3 col-6">
                <div class="border rounded p-2 text-center">
                  <div class="subheader small">Receita</div>
                  <div class="fw-bold text-green">{{ toMoney(inf.total_revenue) }}</div>
                </div>
              </div>
              <div class="col-sm-3 col-6">
                <div class="border rounded p-2 text-center">
                  <div class="subheader small">Comissão</div>
                  <div class="fw-bold text-purple">{{ toMoney(inf.total_commission) }}</div>
                </div>
              </div>
              <div class="col-sm-3 col-6">
                <div class="border rounded p-2 text-center">
                  <div class="subheader small">Líquido Final</div>
                  <div class="fw-bold text-blue">{{ toMoney(inf.total_revenue - inf.total_commission) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Per-course breakdown table -->
          <div class="table-responsive">
            <table class="table table-vcenter table-striped mb-0">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th class="text-end">Nº Vendas</th>
                  <th class="text-end">Bruto</th>
                  <th class="text-end">Descontos</th>
                  <th class="text-end">Receita</th>
                  <th class="text-end">Comissão (Kz)</th>
                  <th class="text-end text-orange">Dev.</th>
                  <th class="text-end text-orange">Val. Dev.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in inf.courses" :key="course.course_id">
                  <td>
                    <span class="badge bg-blue-lt text-blue me-1">
                      <IconBook size="12" />
                    </span>
                    {{ course.course_name || '-' }}
                  </td>
                  <td class="text-end fw-medium">{{ fmtNum(course.sales) }}</td>
                  <td class="text-end">{{ toMoney(course.gross) }}</td>
                  <td class="text-end text-orange">{{ toMoney(course.discounts) }}</td>
                  <td class="text-end text-green">{{ toMoney(course.revenue) }}</td>
                  <td class="text-end text-purple">{{ toMoney(course.commission_value) }}</td>
                  <td class="text-end text-orange">{{ course.refunds_count ?? 0 }}</td>
                  <td class="text-end text-orange">{{ toMoney(course.refunds_amount ?? 0) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="fw-bold">
                  <td>TOTAL</td>
                  <td class="text-end">{{ fmtNum(inf.total_sales) }}</td>
                  <td class="text-end">{{ toMoney(inf.total_gross) }}</td>
                  <td class="text-end text-orange">{{ toMoney(inf.courses.reduce((s: number, c: any) => s + Number(c.discounts), 0)) }}</td>
                  <td class="text-end text-green">{{ toMoney(inf.total_revenue) }}</td>
                  <td class="text-end text-purple">{{ toMoney(inf.total_commission) }}</td>
                  <td class="text-end text-orange">{{ inf.total_refunds_count ?? 0 }}</td>
                  <td class="text-end text-orange">{{ toMoney(inf.total_refunds_amount ?? 0) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  IconFilterFilled, IconFileTypePdf, IconFileTypeXls,
  IconUsers, IconUser, IconShoppingCart, IconCurrencyDollar, IconStar,
  IconChartBar, IconChartPie, IconBook, IconArrowBackUp,
} from '@tabler/icons-vue'
import InfluencerEntity from '@components/entity/InfluencerEntity.vue'
import { ReportAPIService } from '../../../domain/service/ReportService'
import { exportToPdf } from '@/common/application/utils/export'
import { Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale, ArcElement,
} from 'chart.js'
import * as XLSX from 'xlsx'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<any>(null)
const reportEl = ref<HTMLElement | null>(null)

const form = reactive({ start: '', end: '', influencer: null as any })

function clearFilters() {
  form.start = ''
  form.end = ''
  form.influencer = null
}

async function handleFilter() {
  loading.value = true
  error.value = null
  try {
    const res = await ReportAPIService.report({
      type: 'influencer_by_course',
      start: form.start || undefined,
      end: form.end || undefined,
      influencer: form.influencer?.id || undefined,
    })
    result.value = res.data || null
  } catch {
    error.value = 'Erro ao carregar relatório'
  } finally {
    loading.value = false
  }
}

const COLORS = ['#4429f2', '#28a745', '#ffc107', '#17a2b8', '#6f42c1', '#ff6384', '#36a2eb', '#fd7e14', '#20c997']

const salesBarChart = computed(() => ({
  labels: (result.value?.influencers ?? []).map((i: any) => i.influencer_name),
  datasets: [
    {
      label: 'Nº Vendas',
      backgroundColor: '#4429f2',
      data: (result.value?.influencers ?? []).map((i: any) => i.total_sales),
    },
  ],
}))

const salesPieChart = computed(() => ({
  labels: (result.value?.influencers ?? []).map((i: any) => i.influencer_name),
  datasets: [
    {
      label: 'Vendas',
      backgroundColor: COLORS,
      data: (result.value?.influencers ?? []).map((i: any) => i.total_sales),
    },
  ],
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
}

function exportExcel() {
  if (!result.value?.influencers?.length) return
  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary per influencer
  const summaryRows = result.value.influencers.map((i: any) => ({
    'Influenciador': i.influencer_name,
    'Comissão %': i.commission_pct,
    'Nº Vendas': i.total_sales,
    'Bruto (Kz)': Number(i.total_gross),
    'Receita (Kz)': Number(i.total_revenue),
    'Comissão (Kz)': Number(i.total_commission),
    'Líquido Final (Kz)': Number(i.total_revenue) - Number(i.total_commission),
    'Devoluções': i.total_refunds_count ?? 0,
    'Val. Devoluções (Kz)': Number(i.total_refunds_amount ?? 0),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Resumo')

  // One sheet per influencer
  for (const inf of result.value.influencers) {
    const rows = inf.courses.map((c: any) => ({
      'Curso': c.course_name || '-',
      'Nº Vendas': c.sales,
      'Bruto (Kz)': Number(c.gross),
      'Descontos (Kz)': Number(c.discounts),
      'Receita (Kz)': Number(c.revenue),
      'Comissão (Kz)': Number(c.commission_value),
      'Devoluções': c.refunds_count ?? 0,
      'Val. Devoluções (Kz)': Number(c.refunds_amount ?? 0),
    }))
    const sheetName = inf.influencer_name.substring(0, 31) // Excel sheet name limit
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName)
  }

  XLSX.writeFile(wb, 'relatorio-influenciadores-cursos.xlsx')
}

async function exportPdf() {
  if (!reportEl.value) return
  await exportToPdf(reportEl.value, 'relatorio-influenciadores-cursos')
}

const toMoney = (v: number | string) => {
  const num = typeof v === 'string' ? parseFloat(v) : (v || 0)
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num)
}

const fmtNum = (v: number) => new Intl.NumberFormat('pt-PT').format(v || 0)
</script>

<style scoped>
.table th, .table td { vertical-align: middle; }
</style>
