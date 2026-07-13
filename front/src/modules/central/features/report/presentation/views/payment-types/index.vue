<!--
 - Copyright © 2021 - 2025
 - Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <!-- Toolbar -->
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3 d-print-none">
        <PeriodPicker @update:model-value="v => onPeriodApply(v.start, v.end)" />
        <div class="d-flex gap-2">
          <button class="btn btn-default btn-sm" @click="handleFilter" :disabled="loading" title="Atualizar">
            <IconRefresh size="15" :class="loading ? 'spin' : ''" />
          </button>
          <button class="btn btn-default btn-sm" @click="exportExcel">
            <IconFileTypeXls size="15" class="me-1" /> Excel
          </button>
          <button class="btn btn-default btn-sm" @click="exportPdf">
            <IconFileTypePdf size="15" class="me-1" /> PDF
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status"></div>
      </div>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else-if="!result" class="text-center py-5 text-muted">
        <IconCreditCard size="40" class="mb-2 opacity-50" />
        <div>Seleccione um período para gerar o relatório por tipo de pagamento.</div>
      </div>

      <div v-else ref="reportEl" id="payment-types-report">

        <!-- ── RESUMO POR TIPO DE PAGAMENTO (por cima, largura inteira) ── -->
        <div class="card mb-4" v-if="result?.paymentTypeReport?.report?.length">
          <div class="card-header">
            <h3 class="card-title"><IconCreditCard size="16" class="me-2 text-muted"/>Resumo por Tipo de Pagamento</h3>
            <div class="card-options">
              <span class="badge bg-blue-lt text-blue">{{ result.paymentTypeReport.report.length }} tipos</span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-vcenter table-striped table-bordered mb-0">
                <thead>
                  <tr>
                    <th>Tipo de Pagamento</th>
                    <th class="text-end">Nº Vendas</th>
                    <th class="text-end">Bruto</th>
                    <th class="text-end">Descontos</th>
                    <th class="text-end text-orange">Dev.</th>
                    <th class="text-end text-orange">Outras Red.</th>
                    <th class="text-end">Res. Ilíquido</th>
                    <th class="text-end">Encargos</th>
                    <th class="text-end">Líquido</th>
                    <th class="text-end">Comissões</th>
                    <th class="text-end">Líquido Final</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in result.paymentTypeReport.report" :key="r.payment_type">
                    <td><span class="badge" :class="paymentTypeBadge(r.payment_type)">{{ paymentTypeLabel(r.payment_type) }}</span></td>
                    <td class="text-end">{{ r.sales }}</td>
                    <td class="text-end">{{ toMoney(r.gross) }}</td>
                    <td class="text-end">{{ toMoney(r.discounts) }}</td>
                    <td class="text-end text-orange">{{ r.refunds_count ?? 0 }}</td>
                    <td class="text-end text-orange">{{ toMoney(r.refunds_amount ?? 0) }}</td>
                    <td class="text-end">{{ toMoney(r.result_iliquido) }}</td>
                    <td class="text-end">{{ toMoney(r.fees) }}</td>
                    <td class="text-end">{{ toMoney(r.result) }}</td>
                    <td class="text-end">{{ toMoney(r.commissions) }}</td>
                    <td class="text-end fw-medium">{{ toMoney(r.result_final) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="fw-bold">
                    <td>TOTAL</td>
                    <td class="text-end">{{ result.paymentTypeReport.total.sales }}</td>
                    <td class="text-end">{{ toMoney(result.paymentTypeReport.total.gross) }}</td>
                    <td class="text-end">{{ toMoney(result.paymentTypeReport.total.discounts) }}</td>
                    <td class="text-end text-orange">{{ result.paymentTypeReport.total.refunds_count ?? 0 }}</td>
                    <td class="text-end text-orange">{{ toMoney(result.paymentTypeReport.total.refunds_amount ?? 0) }}</td>
                    <td class="text-end">{{ toMoney(result.paymentTypeReport.total.result_iliquido) }}</td>
                    <td class="text-end">{{ toMoney(result.paymentTypeReport.total.fees) }}</td>
                    <td class="text-end">{{ toMoney(result.paymentTypeReport.total.result) }}</td>
                    <td class="text-end">{{ toMoney(result.paymentTypeReport.total.commissions) }}</td>
                    <td class="text-end">{{ toMoney(result.paymentTypeReport.total.result_final) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- ── VENDAS DIÁRIAS POR TIPO DE PAGAMENTO (em tabs, uma por tipo) ── -->
        <div class="card mb-4" v-if="dayByTypeGroups.length">
          <div class="card-header">
            <h3 class="card-title"><IconCalendarStats size="16" class="me-2 text-muted"/>Vendas Diárias por Tipo de Pagamento</h3>
          </div>
          <div class="card-body">
            <BTabs content-class="mt-3">
              <BTab v-for="g in dayByTypeGroups" :key="g.payment_type">
                <template #title>
                  <span class="badge" :class="paymentTypeBadge(g.payment_type)">{{ paymentTypeLabel(g.payment_type) }}</span>
                  <span class="text-muted ms-1">({{ g.rows.length }})</span>
                </template>
                <div class="table-responsive">
                  <table class="table table-vcenter table-striped table-bordered mb-0">
                    <thead>
                      <tr>
                        <th>Dia</th>
                        <th class="text-end">Nº Vendas</th>
                        <th class="text-end">Bruto</th>
                        <th class="text-end">Descontos</th>
                        <th class="text-end text-orange">Dev.</th>
                        <th class="text-end text-orange">Outras Red.</th>
                        <th class="text-end">Res. Ilíquido</th>
                        <th class="text-end">Encargos</th>
                        <th class="text-end">Líquido</th>
                        <th class="text-end">Comissões</th>
                        <th class="text-end">Líquido Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in g.rows" :key="`${r.day}-${r.payment_type}`">
                        <td>{{ toDate(r.day) }}</td>
                        <td class="text-end">{{ r.sales }}</td>
                        <td class="text-end">{{ toMoney(r.gross) }}</td>
                        <td class="text-end">{{ toMoney(r.discounts) }}</td>
                        <td class="text-end text-orange">{{ r.refunds_count ?? 0 }}</td>
                        <td class="text-end text-orange">{{ toMoney(r.refunds_amount ?? 0) }}</td>
                        <td class="text-end">{{ toMoney(r.result_iliquido) }}</td>
                        <td class="text-end">{{ toMoney(r.fees) }}</td>
                        <td class="text-end">{{ toMoney(r.result) }}</td>
                        <td class="text-end">{{ toMoney(r.commissions) }}</td>
                        <td class="text-end fw-medium">{{ toMoney(r.result_final) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="fw-bold">
                        <td>TOTAL</td>
                        <td class="text-end">{{ g.total.sales }}</td>
                        <td class="text-end">{{ toMoney(g.total.gross) }}</td>
                        <td class="text-end">{{ toMoney(g.total.discounts) }}</td>
                        <td class="text-end text-orange">{{ g.total.refunds_count }}</td>
                        <td class="text-end text-orange">{{ toMoney(g.total.refunds_amount) }}</td>
                        <td class="text-end">{{ toMoney(g.total.result_iliquido) }}</td>
                        <td class="text-end">{{ toMoney(g.total.fees) }}</td>
                        <td class="text-end">{{ toMoney(g.total.result) }}</td>
                        <td class="text-end">{{ toMoney(g.total.commissions) }}</td>
                        <td class="text-end">{{ toMoney(g.total.result_final) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </BTab>
            </BTabs>
          </div>
        </div>

        <div v-if="!result?.paymentTypeReport?.report?.length" class="text-center py-5 text-muted">
          Nenhuma venda no período seleccionado.
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  IconFileTypePdf, IconFileTypeXls, IconRefresh, IconCreditCard, IconCalendarStats,
} from '@tabler/icons-vue'
import PeriodPicker from '../../../common/components/PeriodPicker.vue'
import { ReportAPIService } from '../../../domain/service/ReportService'
import { exportToPdf } from '@/common/application/utils/export'
import * as XLSX from 'xlsx'

const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<any>(null)
const reportEl = ref<HTMLElement | null>(null)

const form = reactive({ start: '', end: '' })

function onPeriodApply(start: string, end: string) {
  form.start = start
  form.end = end
  handleFilter()
}

async function handleFilter() {
  loading.value = true
  error.value = null
  try {
    const res = await ReportAPIService.report({
      type: 'payment-type',
      start: form.start || undefined,
      end: form.end || undefined,
    })
    result.value = res.data || null
  } catch {
    error.value = 'Erro ao carregar relatório'
  } finally {
    loading.value = false
  }
}

const paymentTypeLabel = (t: string) =>
  ({ express: 'Express', ref: 'Referência', qr: 'QR', outros: 'Outros' } as Record<string, string>)[t] || 'Outros'

const paymentTypeBadge = (t: string) =>
  ({ express: 'bg-teal-lt text-teal', ref: 'bg-blue-lt text-blue', qr: 'bg-purple-lt text-purple', outros: 'bg-secondary-lt' } as Record<string, string>)[t] || 'bg-secondary-lt'

// Agrupa as vendas diárias por tipo de pagamento → uma tabela por tipo, com total próprio.
const SUM_FIELDS = ['sales', 'gross', 'discounts', 'refunds_count', 'refunds_amount', 'result_iliquido', 'fees', 'result', 'commissions', 'result_final']
const dayByTypeGroups = computed(() => {
  const rows = result.value?.dayPaymentTypeReport?.report ?? []
  const groups: Record<string, any> = {}
  for (const r of rows) {
    const k = r.payment_type
    if (!groups[k]) groups[k] = { payment_type: k, rows: [], total: Object.fromEntries(SUM_FIELDS.map(f => [f, 0])) }
    groups[k].rows.push(r)
    for (const f of SUM_FIELDS) groups[k].total[f] += Number(r[f] || 0)
  }
  return Object.values(groups)
})

function exportExcel() {
  if (!result.value) return
  const wb = XLSX.utils.book_new()

  if (result.value.paymentTypeReport?.report?.length) {
    const rows = result.value.paymentTypeReport.report.map((r: any) => ({
      'Tipo de Pagamento': paymentTypeLabel(r.payment_type), 'Nº Vendas': r.sales,
      'Valor Bruto': Number(r.gross), 'Descontos': Number(r.discounts),
      'Devoluções': r.refunds_count ?? 0, 'Outras Reduções': Number(r.refunds_amount ?? 0),
      'Resultado Ilíquido': Number(r.result_iliquido),
      'Encargos': Number(r.fees), 'Líquido': Number(r.result),
      'Comissões': Number(r.commissions), 'Líquido Final': Number(r.result_final),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Resumo Tipo Pag.')
  }

  if (result.value.dayPaymentTypeReport?.report?.length) {
    const rows = result.value.dayPaymentTypeReport.report.map((r: any) => ({
      'Dia': r.day, 'Tipo': paymentTypeLabel(r.payment_type), 'Nº Vendas': r.sales,
      'Valor Bruto': Number(r.gross), 'Descontos': Number(r.discounts),
      'Devoluções': r.refunds_count ?? 0, 'Outras Reduções': Number(r.refunds_amount ?? 0),
      'Resultado Ilíquido': Number(r.result_iliquido),
      'Encargos': Number(r.fees), 'Líquido': Number(r.result),
      'Comissões': Number(r.commissions), 'Líquido Final': Number(r.result_final),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Diário Tipo Pag.')
  }

  XLSX.writeFile(wb, 'relatorio-tipos-pagamento.xlsx')
}

async function exportPdf() {
  if (!reportEl.value) return
  await exportToPdf(reportEl.value, 'relatorio-tipos-pagamento')
}

const toMoney = (v: number | string) => {
  const num = typeof v === 'string' ? parseFloat(v) : v
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num || 0)
}

const toDate = (v: string) => {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
