<!--
  Relatório de Mensagens (SMS/WhatsApp) — envios por tipo de notificação e custos.
  Estilo alinhado com o Relatório Geral (PeriodPicker + KPI cards + tabelas).
  Operacional: não inclui devoluções.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <!-- Toolbar -->
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3 d-print-none">
        <PeriodPicker @update:model-value="v => onPeriodApply(v.start, v.end)" />
        <div class="d-flex gap-2">
          <button class="btn btn-default btn-sm" @click="handleFilter" :disabled="loading">
            <IconRefresh size="15" :class="loading ? 'spin' : ''" />
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status"></div>
      </div>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-else-if="!result" class="text-center py-5 text-muted">
        <IconMessage size="40" class="mb-2 opacity-50" />
        <div>Seleccione um período e clique em <strong>actualizar</strong> para gerar o relatório.</div>
      </div>

      <div v-else>
        <!-- KPIs -->
        <div class="row g-2 mb-3">
          <div class="col-6 col-md">
            <div class="card card-sm h-100">
              <div class="card-body">
                <div class="d-flex align-items-center mb-1">
                  <div class="subheader">Total Mensagens</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-primary-lt text-primary"><IconMessage size="16"/></span>
                </div>
                <div class="h2 mb-0">{{ fmtNum(result.summary?.total_messages ?? 0) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card card-sm h-100">
              <div class="card-body">
                <div class="d-flex align-items-center mb-1">
                  <div class="subheader">Enviadas</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-green-lt text-green"><IconCircleCheck size="16"/></span>
                </div>
                <div class="h2 mb-0 text-green">{{ fmtNum(result.summary?.total_sent ?? 0) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card card-sm h-100">
              <div class="card-body">
                <div class="d-flex align-items-center mb-1">
                  <div class="subheader">Falhadas</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-danger-lt text-danger"><IconCircleX size="16"/></span>
                </div>
                <div class="h2 mb-0 text-danger">{{ fmtNum(result.summary?.total_failed ?? 0) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card card-sm h-100">
              <div class="card-body">
                <div class="d-flex align-items-center mb-1">
                  <div class="subheader">Segmentos</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-teal-lt text-teal"><IconLayoutGrid size="16"/></span>
                </div>
                <div class="h2 mb-0">{{ fmtNum(result.summary?.total_segments ?? 0) }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md">
            <div class="card card-sm h-100">
              <div class="card-body">
                <div class="d-flex align-items-center mb-1">
                  <div class="subheader">Custo Total</div>
                  <span class="ms-auto avatar avatar-xs rounded bg-blue-lt text-blue"><IconCurrencyDollar size="16"/></span>
                </div>
                <div class="h2 mb-0 text-blue">{{ toMoney(result.summary?.total_cost ?? 0) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Por tipo de notificação -->
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="card-title"><IconMailFast size="16" class="me-2 text-muted"/>Por tipo de notificação</h3>
            <div class="card-options">
              <span class="badge bg-blue-lt text-blue">{{ result.byType?.length ?? 0 }} linhas</span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-vcenter table-striped table-bordered mb-0">
                <thead>
                  <tr>
                    <th>Notificação</th>
                    <th>Canal</th>
                    <th class="text-end">Total</th>
                    <th class="text-end text-green">Enviadas</th>
                    <th class="text-end text-danger">Falhadas</th>
                    <th class="text-end">Segmentos</th>
                    <th class="text-end">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!result.byType?.length">
                    <td colspan="7" class="text-center text-muted py-4">Sem mensagens no período.</td>
                  </tr>
                  <tr v-for="(r, i) in result.byType" :key="i">
                    <td>{{ eventLabel(r.event_type) }}</td>
                    <td>{{ channelLabel(r.channel) }}</td>
                    <td class="text-end">{{ fmtNum(r.total) }}</td>
                    <td class="text-end text-green">{{ fmtNum(r.sent) }}</td>
                    <td class="text-end text-danger">{{ fmtNum(r.failed) }}</td>
                    <td class="text-end">{{ fmtNum(r.segments) }}</td>
                    <td class="text-end fw-medium">{{ toMoney(r.cost) }}</td>
                  </tr>
                </tbody>
                <tfoot v-if="result.byType?.length">
                  <tr class="fw-bold">
                    <td colspan="2">TOTAL</td>
                    <td class="text-end">{{ fmtNum(result.summary?.total_messages ?? 0) }}</td>
                    <td class="text-end text-green">{{ fmtNum(result.summary?.total_sent ?? 0) }}</td>
                    <td class="text-end text-danger">{{ fmtNum(result.summary?.total_failed ?? 0) }}</td>
                    <td class="text-end">{{ fmtNum(result.summary?.total_segments ?? 0) }}</td>
                    <td class="text-end">{{ toMoney(result.summary?.total_cost ?? 0) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Por canal -->
        <div class="card mb-4" v-if="result.byChannel?.length">
          <div class="card-header">
            <h3 class="card-title"><IconDeviceMobileMessage size="16" class="me-2 text-muted"/>Por canal</h3>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-vcenter table-striped table-bordered mb-0">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th class="text-end">Total</th>
                    <th class="text-end text-green">Enviadas</th>
                    <th class="text-end">Segmentos</th>
                    <th class="text-end">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in result.byChannel" :key="i">
                    <td>{{ channelLabel(r.channel) }}</td>
                    <td class="text-end">{{ fmtNum(r.total) }}</td>
                    <td class="text-end text-green">{{ fmtNum(r.sent) }}</td>
                    <td class="text-end">{{ fmtNum(r.segments) }}</td>
                    <td class="text-end fw-medium">{{ toMoney(r.cost) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Diário -->
        <div class="card mb-4" v-if="result.daily?.length">
          <div class="card-header">
            <h3 class="card-title"><IconCalendarStats size="16" class="me-2 text-muted"/>Por dia</h3>
            <div class="card-options">
              <span class="badge bg-blue-lt text-blue">{{ result.daily.length }} dias</span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-vcenter table-striped table-bordered mb-0">
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th class="text-end">Mensagens</th>
                    <th class="text-end">Segmentos</th>
                    <th class="text-end">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in result.daily" :key="i">
                    <td>{{ toDate(r.day) }}</td>
                    <td class="text-end">{{ fmtNum(r.total) }}</td>
                    <td class="text-end">{{ fmtNum(r.segments) }}</td>
                    <td class="text-end fw-medium">{{ toMoney(r.cost) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  IconRefresh, IconMessage, IconCircleCheck, IconCircleX,
  IconLayoutGrid, IconCurrencyDollar, IconMailFast,
  IconDeviceMobileMessage, IconCalendarStats,
} from '@tabler/icons-vue'
import PeriodPicker from '../../../common/components/PeriodPicker.vue'
import { ReportAPIService } from '../../../domain/service/ReportService'
import { EVENT_LABELS, CHANNEL_LABELS } from '@/modules/central/features/notifications/application/dtos/notification'

const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<any>(null)
const form = reactive({ start: '', end: '' })

function eventLabel(ev: string | null) {
  if (!ev || ev === '—') return 'Avulsa / manual'
  return (EVENT_LABELS as Record<string, string>)[ev] ?? ev
}
function channelLabel(ch: string) {
  return (CHANNEL_LABELS as Record<string, string>)[ch] ?? ch
}

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
      type: 'messages',
      start: form.start || undefined,
      end: form.end || undefined,
    })
    result.value = (res as any).data || null
  } catch {
    error.value = 'Erro ao carregar relatório'
  } finally {
    loading.value = false
  }
}

const toMoney = (v: number | string) => {
  const num = typeof v === 'string' ? parseFloat(v) : v
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num || 0)
}
const fmtNum = (v: number) => new Intl.NumberFormat('pt-PT').format(v || 0)
const toDate = (v: string) => {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
</style>
