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
        <IconChartBar size="40" class="mb-2 opacity-50" />
        <div>Seleccione um período e clique em <strong>Filtrar</strong> para gerar o relatório.</div>
      </div>

      <div v-else ref="reportEl" id="general-report">

        <!-- ── INSIGHTS IA ───────────────────────────────────────────────── -->
        <div class="card mb-4 border-primary" v-if="result && !insightDismissed">
          <div class="card-body">
            <div class="d-flex align-items-start gap-3">
              <span class="avatar avatar-sm rounded bg-primary-lt text-primary flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
              </span>
              <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-1">
                  <span class="fw-medium text-primary me-2">Análise IA</span>
                  <span class="badge bg-primary-lt text-primary">Claude</span>
                </div>

                <div v-if="insightLoading" class="text-muted small d-flex align-items-center gap-2">
                  <div class="spinner-border spinner-border-sm" role="status"></div>
                  A analisar os dados do período...
                </div>
                <div v-else-if="insightError" class="text-danger small">{{ insightError }}</div>
                <div v-else-if="insightText" class="text-body">{{ insightText }}</div>
                <div v-else class="text-muted small">
                  Clica em <strong>Analisar</strong> para gerar um resumo executivo do período com IA.
                </div>
              </div>

              <div class="d-flex gap-2 flex-shrink-0">
                <button
                  v-if="!insightText && !insightLoading"
                  class="btn btn-sm btn-primary"
                  @click="generateInsight"
                >
                  Analisar
                </button>
                <button
                  v-if="insightText && !insightLoading"
                  class="btn btn-sm btn-success"
                  @click="insightDismissed = true"
                  title="Útil — dispensar"
                >
                  Útil
                </button>
                <button
                  class="btn btn-sm btn-ghost-secondary"
                  @click="insightDismissed = true"
                  title="Dispensar"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>


  <!-- ── RESUMO + KPIs ─────────────────────────────────────────────── -->
        <div class="row g-3 mb-4">
          <!-- Resumo Geral — cascata financeira -->
          <div class="col-md-5 d-flex">
            <div class="card w-100 mb-0">
              <div class="card-header">
                <h3 class="card-title fw-bold">
                  <IconChartBar size="16" class="me-2 text-muted"/> Resumo Geral do Período
                </h3>
                <div class="card-options">
                  <span class="text-muted small">{{ form.start }} → {{ form.end }}</span>
                </div>
              </div>
              <div class="card-body p-0">
                <table class="table table-bordered mb-0" style="font-size:.875rem; max-width: 480px">
                  <tbody>
                    <tr>
                      <td class="ps-3 text-muted" style="width:60%">Nº Vendas</td>
                      <td class="text-end fw-semibold">{{ result.dayReport?.total?.sales ?? 0 }}</td>
                    </tr>
                    <tr>
                      <td class="ps-3 fw-semibold">Valor Bruto</td>
                      <td class="text-end fw-bold text-blue">{{ toMoney(result.dayReport?.total?.gross ?? 0) }}</td>
                    </tr>
                    <tr>
                      <td class="ps-3 text-muted">− Descontos</td>
                      <td class="text-end text-muted">{{ toMoney(result.dayReport?.total?.discounts ?? 0) }}</td>
                    </tr>
                    <tr>
                      <td class="ps-3 text-orange">− Devoluções ({{ result.dayReport?.total?.refunds_count ?? 0 }})</td>
                      <td class="text-end text-orange">{{ toMoney(result.dayReport?.total?.refunds_amount ?? 0) }}</td>
                    </tr>
                    <tr style="background-color: var(--tblr-bg-surface-secondary)">
                      <td class="ps-3 fw-semibold">= Resultado Ilíquido</td>
                      <td class="text-end fw-bold">{{ toMoney(result.dayReport?.total?.result_iliquido ?? 0) }}</td>
                    </tr>
                    <tr>
                      <td class="ps-3 text-danger">− Encargos de plataforma</td>
                      <td class="text-end text-danger">{{ toMoney(result.dayReport?.total?.fees ?? 0) }}</td>
                    </tr>
                    <tr style="background-color: var(--tblr-bg-surface-secondary)">
                      <td class="ps-3 fw-semibold">= Líquido</td>
                      <td class="text-end fw-bold">{{ toMoney(result.dayReport?.total?.result ?? 0) }}</td>
                    </tr>
                    <tr>
                      <td class="ps-3 text-purple">− Comissões parceiros</td>
                      <td class="text-end text-purple">{{ toMoney(result.dayReport?.total?.commissions ?? 0) }}</td>
                    </tr>
                    <tr style="background-color: var(--tblr-bg-surface-secondary); border-top:2px solid var(--tblr-border-color)">
                      <td class="ps-3 fw-bold" style="font-size:1rem">= Líquido Final</td>
                      <td class="text-end fw-bold text-success" style="font-size:1rem">{{ toMoney(result.dayReport?.total?.result_final ?? 0) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- KPIs -->
          <div class="col-md-7">
            <div class="row g-3">
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Total de Pedidos</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-primary-lt text-primary"><IconShoppingCart size="16"/></span>
                    </div>
                    <div class="h1 mb-0">{{ fmtNum(result.summary?.total_orders ?? 0) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Total de Pagamentos</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-teal-lt text-teal"><IconCreditCard size="16"/></span>
                    </div>
                    <div class="h1 mb-0">{{ fmtNum(result.summary?.total_payments ?? 0) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Receita Bruta</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-blue-lt text-blue"><IconCurrencyDollar size="16"/></span>
                    </div>
                    <div class="h1 mb-0">{{ toMoney(result.summary?.total_revenue ?? 0) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Líquido Final</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-green-lt text-green"><IconTrendingUp size="16"/></span>
                    </div>
                    <div class="h1 mb-0 text-green">{{ toMoney(result.dayReport?.total?.result_final ?? 0) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Total Devoluções</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-orange-lt text-orange"><IconArrowBackUp size="16"/></span>
                    </div>
                    <div class="h1 mb-0 text-orange">{{ fmtNum(result.summary?.total_refunds ?? 0) }}</div>
                    <div class="text-muted small mt-1">{{ toMoney(result.summary?.total_refunds_amount ?? 0) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Dev. Pendentes</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-yellow-lt text-yellow"><IconClock size="16"/></span>
                    </div>
                    <div class="h1 mb-0 text-yellow">{{ fmtNum(result.refundsByStatus?.pending?.total ?? 0) }}</div>
                    <div class="text-muted small mt-1">{{ toMoney(result.refundsByStatus?.pending?.amount ?? 0) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Dev. Aprovadas</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-success-lt text-success"><IconCircleCheck size="16"/></span>
                    </div>
                    <div class="h1 mb-0 text-success">{{ fmtNum(result.refundsByStatus?.approved?.total ?? 0) }}</div>
                    <div class="text-muted small mt-1">{{ toMoney(result.refundsByStatus?.approved?.amount ?? 0) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="card">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                      <div class="subheader">Dev. Rejeitadas</div>
                      <span class="ms-auto avatar avatar-xs rounded bg-danger-lt text-danger"><IconCircleX size="16"/></span>
                    </div>
                    <div class="h1 mb-0 text-danger">{{ fmtNum(result.refundsByStatus?.rejected?.total ?? 0) }}</div>
                    <div class="text-muted small mt-1">{{ toMoney(result.refundsByStatus?.rejected?.amount ?? 0) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ── VENDAS DIÁRIAS ─────────────────────────────────────────── -->
        <div class="card mb-4" v-if="result?.dayReport?.report?.length">
          <div class="card-header">
            <h3 class="card-title"><IconCalendarStats size="16" class="me-2 text-muted"/>Vendas Diárias</h3>
            <div class="card-options">
              <span class="badge bg-blue-lt text-blue">{{ result.dayReport.report.length }} dias</span>
            </div>
          </div>
          <div class="card-body p-0">
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
                  <tr v-for="r in result.dayReport.report" :key="r.day" class="cursor-pointer" @click="openDay(r)">
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
                    <td class="text-end">{{ result.dayReport.total.sales }}</td>
                    <td class="text-end">{{ toMoney(result.dayReport.total.gross) }}</td>
                    <td class="text-end">{{ toMoney(result.dayReport.total.discounts) }}</td>
                    <td class="text-end text-orange">{{ result.dayReport.total.refunds_count ?? 0 }}</td>
                    <td class="text-end text-orange">{{ toMoney(result.dayReport.total.refunds_amount ?? 0) }}</td>
                    <td class="text-end">{{ toMoney(result.dayReport.total.result_iliquido) }}</td>
                    <td class="text-end">{{ toMoney(result.dayReport.total.fees) }}</td>
                    <td class="text-end">{{ toMoney(result.dayReport.total.result) }}</td>
                    <td class="text-end">{{ toMoney(result.dayReport.total.commissions) }}</td>
                    <td class="text-end">{{ toMoney(result.dayReport.total.result_final) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

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

        <!-- ── POR CURSO ───────────────────────────────────────────────── -->
        <div class="card mb-4" v-if="result?.courseReport?.report?.length">
          <div class="card-header">
            <h3 class="card-title"><IconBook size="16" class="me-2 text-muted"/>Vendas por Curso</h3>
            <div class="card-options">
              <span class="badge bg-purple-lt text-purple">{{ result.courseReport.report.length }} cursos</span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-vcenter table-striped table-bordered mb-0">
                <thead>
                  <tr>
                    <th>Curso</th>
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
                  <tr v-for="r in result.courseReport.report" :key="r.course_id" class="cursor-pointer" @click="openCourse(r)">
                    <td>{{ r.course_name || '-' }}</td>
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
                    <td class="text-end">{{ result.courseReport.total.sales }}</td>
                    <td class="text-end">{{ toMoney(result.courseReport.total.gross) }}</td>
                    <td class="text-end">{{ toMoney(result.courseReport.total.discounts) }}</td>
                    <td class="text-end text-orange">{{ result.courseReport.total.refunds_count ?? 0 }}</td>
                    <td class="text-end text-orange">{{ toMoney(result.courseReport.total.refunds_amount ?? 0) }}</td>
                    <td class="text-end">{{ toMoney(result.courseReport.total.result_iliquido) }}</td>
                    <td class="text-end">{{ toMoney(result.courseReport.total.fees) }}</td>
                    <td class="text-end">{{ toMoney(result.courseReport.total.result) }}</td>
                    <td class="text-end">{{ toMoney(result.courseReport.total.commissions) }}</td>
                    <td class="text-end">{{ toMoney(result.courseReport.total.result_final) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- ── POR INFLUENCIADOR ──────────────────────────────────────── -->
        <div class="card mb-4" v-if="result?.influencerReport?.report?.length">
          <div class="card-header">
            <h3 class="card-title"><IconStar size="16" class="me-2 text-muted"/>Vendas por Influenciador</h3>
            <div class="card-options">
              <span class="badge bg-teal-lt text-teal">{{ result.influencerReport.report.length }} influenciadores</span>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-vcenter table-striped table-bordered mb-0">
                <thead>
                  <tr>
                    <th>Influenciador</th>
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
                  <tr v-for="r in result.influencerReport.report" :key="r.influencer_id" class="cursor-pointer" @click="openInfluencer(r)">
                    <td>{{ r.influencer_name }}</td>
                    <td class="text-end">{{ r.sales }}</td>
                    <td class="text-end">{{ toMoney(r.gross) }}</td>
                    <td class="text-end">{{ toMoney(r.discounts) }}</td>
                    <td class="text-end text-orange">{{ r.refunds_count ?? 0 }}</td>
                    <td class="text-end text-orange">{{ toMoney(r.refunds_amount ?? 0) }}</td>
                    <td class="text-end">{{ toMoney(r.result_iliquido) }}</td>
                    <td class="text-end">{{ toMoney(r.fees) }}</td>
                    <td class="text-end">{{ toMoney(r.result) }}</td>
                    <td class="text-end">{{ toMoney(r.influencerCommissionReceiver) }}</td>
                    <td class="text-end fw-medium">{{ toMoney(r.result_final) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="fw-bold">
                    <td>TOTAL</td>
                    <td class="text-end">{{ result.influencerReport.total.sales }}</td>
                    <td class="text-end">{{ toMoney(result.influencerReport.total.gross) }}</td>
                    <td class="text-end">{{ toMoney(result.influencerReport.total.discounts) }}</td>
                    <td class="text-end text-orange">{{ result.influencerReport.total.refunds_count ?? 0 }}</td>
                    <td class="text-end text-orange">{{ toMoney(result.influencerReport.total.refunds_amount ?? 0) }}</td>
                    <td class="text-end">{{ toMoney(result.influencerReport.total.result_iliquido) }}</td>
                    <td class="text-end">{{ toMoney(result.influencerReport.total.fees) }}</td>
                    <td class="text-end">{{ toMoney(result.influencerReport.total.result) }}</td>
                    <td class="text-end">{{ toMoney(result.influencerReport.total.influencerCommissionReceiver) }}</td>
                    <td class="text-end">{{ toMoney(result.influencerReport.total.result_final) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- ── DEVOLUÇÕES (lista por estado) ─────────────────────────── -->
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="card-title"><IconArrowBackUp size="16" class="me-2 text-orange"/>Devoluções no Período</h3>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4" v-for="(v, k) in refundsStatusAll" :key="k">
                <div class="card card-sm">
                  <div class="card-body">
                    <div class="d-flex align-items-center gap-3">
                      <span class="avatar rounded"
                        :class="k === 'pending' ? 'bg-yellow-lt text-yellow' : k === 'approved' ? 'bg-success-lt text-success' : 'bg-danger-lt text-danger'">
                        <IconClock v-if="k === 'pending'" size="18"/>
                        <IconCircleCheck v-else-if="k === 'approved'" size="18"/>
                        <IconCircleX v-else size="18"/>
                      </span>
                      <div>
                        <div class="fw-bold">{{ k === 'pending' ? 'Pendentes' : k === 'approved' ? 'Aprovadas' : 'Rejeitadas' }}</div>
                        <div class="text-muted small">{{ v.total }} devoluções · {{ toMoney(v.amount) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-12" v-if="!Object.keys(result.refundsByStatus || {}).length">
                <p class="text-muted mb-0">Nenhuma devolução no período seleccionado.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- ══ SIDEBAR DE DETALHE ═══════════════════════════════════════════ -->
  <Teleport to="body">
    <transition name="sidebar-fade">
      <div v-if="sidebar.open" class="report-sidebar-overlay" @click.self="closeSidebar">
        <div class="report-sidebar">
          <!-- Header -->
          <div class="report-sidebar-header">
            <div>
              <div class="text-muted small mb-1">{{ sidebar.subtitle }}</div>
              <h4 class="mb-0">{{ sidebar.title }}</h4>
            </div>
            <button class="btn btn-ghost-secondary btn-sm" @click="closeSidebar">
              <IconX size="16" />
            </button>
          </div>

          <!-- Search -->
          <div v-if="!sidebar.loading" class="px-3 pt-2 pb-1 border-bottom">
            <input
              v-model="sidebarSearch"
              type="text"
              class="form-control form-control-sm"
              placeholder="Filtrar por estudante, curso, parceiro..."
            />
          </div>

          <!-- Loading -->
          <div v-if="sidebar.loading" class="text-center py-5">
            <div class="spinner-border" role="status"></div>
          </div>

          <!-- Empty -->
          <div v-else-if="!sidebar.rows.length" class="text-center text-muted py-5 px-3">
            Nenhuma venda encontrada para este período.
          </div>
          <div v-else-if="!sidebarFilteredRows.length" class="text-center text-muted py-4 px-3 small">
            Nenhum resultado para "<em>{{ sidebarSearch }}</em>".
          </div>

          <!-- Lista de vendas -->
          <div v-else class="report-sidebar-body">
            <div class="report-sidebar-summary">
              <span class="badge bg-blue-lt text-blue">{{ sidebarFilteredRows.length }} vendas</span>
              <span class="fw-semibold text-success ms-2">{{ toMoney(sidebarFilteredRows.reduce((s: number, r: any) => s + Number(r.amount), 0)) }}</span>
            </div>
            <div
              v-for="row in sidebarFilteredRows"
              :key="row.payment_id"
              class="report-sidebar-row"
            >
              <div class="d-flex align-items-start justify-content-between gap-2">
                <div class="flex-grow-1 min-w-0">
                  <div class="fw-medium text-truncate">{{ row.customer_name || '—' }}</div>
                  <div class="text-muted small">{{ row.course_name || '—' }}</div>
                  <div class="d-flex gap-2 mt-1 flex-wrap">
                    <span v-if="row.coupon_code" class="badge bg-purple-lt text-purple">{{ row.coupon_code }}</span>
                    <span v-if="row.influencer_name" class="badge bg-teal-lt text-teal">{{ row.influencer_name }}</span>
                    <span class="text-muted" style="font-size:.75rem">{{ row.payment_code }}</span>
                  </div>
                </div>
                <div class="text-end flex-shrink-0">
                  <div class="fw-semibold text-success">{{ toMoney(row.amount) }}</div>
                  <div class="text-muted small">{{ formatDate(row.paid_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  IconFilterFilled, IconFileTypePdf, IconFileTypeXls, IconRefresh,
  IconShoppingCart, IconCreditCard, IconCurrencyDollar, IconTrendingUp,
  IconArrowBackUp, IconClock, IconCircleCheck, IconCircleX,
  IconCalendarStats, IconBook, IconStar, IconChartBar, IconX,
} from '@tabler/icons-vue'
import PeriodPicker from '../../../common/components/PeriodPicker.vue'
import { ReportAPIService } from '../../../domain/service/ReportService'
import { exportToExcel, exportToPdf } from '@/common/application/utils/export'
import * as XLSX from 'xlsx'

const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<any>(null)
const reportEl = ref<HTMLElement | null>(null)

const insightLoading = ref(false)
const insightText = ref<string | null>(null)
const insightError = ref<string | null>(null)
const insightDismissed = ref(false)

const form = reactive({ start: '', end: '' })

/* ── Sidebar ──────────────────────────────────────────────────── */
const sidebar = reactive({
  open: false,
  title: '',
  subtitle: '',
  loading: false,
  rows: [] as any[],
})

const sidebarSearch = ref('')
watch(() => sidebar.open, (v) => { if (!v) sidebarSearch.value = '' })

const sidebarFilteredRows = computed(() => {
  const q = sidebarSearch.value.trim().toLowerCase()
  if (!q) return sidebar.rows
  return sidebar.rows.filter((r: any) =>
    (r.customer_name || '').toLowerCase().includes(q) ||
    (r.course_name   || '').toLowerCase().includes(q) ||
    (r.influencer_name || '').toLowerCase().includes(q) ||
    (r.coupon_code   || '').toLowerCase().includes(q) ||
    (r.payment_code  || '').toLowerCase().includes(q)
  )
})

function closeSidebar() { sidebar.open = false }

async function openSidebar(title: string, subtitle: string, params: Record<string, any>) {
  sidebar.title    = title
  sidebar.subtitle = subtitle
  sidebar.rows     = []
  sidebar.loading  = true
  sidebar.open     = true
  try {
    const res = await ReportAPIService.sales({ start: form.start || undefined, end: form.end || undefined, ...params })
    sidebar.rows = (res as any).data ?? res ?? []
  } catch {
    sidebar.rows = []
  } finally {
    sidebar.loading = false
  }
}

function openInfluencer(r: any) {
  openSidebar(r.influencer_name, 'Vendas do Parceiro', { influencer_id: r.influencer_id })
}
function openCourse(r: any) {
  openSidebar(r.course_name || 'Curso', 'Vendas por Curso', { course_id: r.course_id })
}
function openDay(r: any) {
  openSidebar(toDate(r.day), 'Vendas Diárias', { day: r.day })
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

function formatDate(val: string) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function onPeriodApply(start: string, end: string) {
  form.start = start
  form.end = end
  handleFilter()
}

async function handleFilter() {
  loading.value = true
  error.value = null
  insightText.value = null
  insightError.value = null
  insightDismissed.value = false
  try {
    const res = await ReportAPIService.report({
      type: 'general',
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

async function generateInsight() {
  if (!result.value) return
  insightLoading.value = true
  insightError.value = null
  try {
    const res = await ReportAPIService.insights({
      period: { start: form.start || null, end: form.end || null },
      summary: result.value.summary,
      refundsByStatus: result.value.refundsByStatus,
      dayReport: result.value.dayReport,
      paymentTypeReport: result.value.paymentTypeReport,
      courseReport: result.value.courseReport,
      influencerReport: result.value.influencerReport,
    })
    insightText.value = (res as any).data?.insight ?? null
  } catch {
    insightError.value = 'Erro ao gerar análise. Verifica a chave ANTHROPIC_API_KEY.'
  } finally {
    insightLoading.value = false
  }
}

// Always show all 3 status keys even if 0
const refundsStatusAll = computed(() => {
  const base: Record<string, { total: number; amount: number }> = {
    pending:  { total: 0, amount: 0 },
    approved: { total: 0, amount: 0 },
    rejected: { total: 0, amount: 0 },
  }
  const src = result.value?.refundsByStatus || {}
  for (const k of Object.keys(src)) base[k] = src[k]
  return base
})

function exportExcel() {
  if (!result.value) return
  const wb = XLSX.utils.book_new()

  // Sheet 1: Resumo Geral do Período (cascata financeira)
  const t = result.value.dayReport?.total ?? {}
  const summaryRows = [
    { 'Indicador': 'Período',                   'Valor': `${form.start} → ${form.end}` },
    { 'Indicador': '',                           'Valor': '' },
    { 'Indicador': 'Nº Vendas',                 'Valor': t.sales ?? 0 },
    { 'Indicador': 'Valor Bruto',               'Valor': Number(t.gross ?? 0) },
    { 'Indicador': '− Descontos',               'Valor': Number(t.discounts ?? 0) },
    { 'Indicador': '− Devoluções (qtd)',         'Valor': t.refunds_count ?? 0 },
    { 'Indicador': '− Devoluções (valor)',       'Valor': Number(t.refunds_amount ?? 0) },
    { 'Indicador': '= Resultado Ilíquido',       'Valor': Number(t.result_iliquido ?? 0) },
    { 'Indicador': '− Encargos de plataforma',  'Valor': Number(t.fees ?? 0) },
    { 'Indicador': '= Líquido',                 'Valor': Number(t.result ?? 0) },
    { 'Indicador': '− Comissões parceiros',     'Valor': Number(t.commissions ?? 0) },
    { 'Indicador': '= LÍQUIDO FINAL',           'Valor': Number(t.result_final ?? 0) },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Resumo')

  // Sheet 2: Diário
  if (result.value.dayReport?.report?.length) {
    const rows = result.value.dayReport.report.map((r: any) => ({
      'Dia': r.day, 'Nº Vendas': r.sales, 'Valor Bruto': Number(r.gross),
      'Descontos': Number(r.discounts), 'Devoluções': r.refunds_count ?? 0,
      'Outras Reduções': Number(r.refunds_amount ?? 0),
      'Resultado Ilíquido': Number(r.result_iliquido),
      'Encargos': Number(r.fees), 'Líquido': Number(r.result),
      'Comissões': Number(r.commissions), 'Líquido Final': Number(r.result_final),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Diário')
  }

  // Sheet 3: Diário por Tipo de Pagamento
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

  // Sheet 4: Resumo por Tipo de Pagamento
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

  // Sheet 4: Cursos
  if (result.value.courseReport?.report?.length) {
    const rows = result.value.courseReport.report.map((r: any) => ({
      'Curso': r.course_name || '-', 'Nº Vendas': r.sales, 'Valor Bruto': Number(r.gross),
      'Descontos': Number(r.discounts), 'Devoluções': r.refunds_count ?? 0,
      'Outras Reduções': Number(r.refunds_amount ?? 0),
      'Resultado Ilíquido': Number(r.result_iliquido),
      'Encargos': Number(r.fees), 'Líquido': Number(r.result),
      'Comissões': Number(r.commissions), 'Líquido Final': Number(r.result_final),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Cursos')
  }

  // Sheet 5: Influenciadores
  if (result.value.influencerReport?.report?.length) {
    const rows = result.value.influencerReport.report.map((r: any) => ({
      'Influenciador': r.influencer_name, 'Nº Vendas': r.sales,
      'Bruto (Kz)': Number(r.gross), 'Descontos (Kz)': Number(r.discounts),
      'Receita (Kz)': Number(r.revenue), 'Comissão %': r.influencerCommission,
      'Comissão (Kz)': Number(r.influencerCommissionReceiver),
      'Líquido Final (Kz)': Number(r.result_final),
      'Devoluções': r.refunds_count ?? 0, 'Val. Dev. (Kz)': Number(r.refunds_amount ?? 0),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Influenciadores')
  }

  XLSX.writeFile(wb, 'relatorio-geral.xlsx')
}

async function exportPdf() {
  if (!reportEl.value) return
  await exportToPdf(reportEl.value, 'relatorio-geral')
}

const toMoney = (v: number | string) => {
  const num = typeof v === 'string' ? parseFloat(v) : v
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num || 0)
}

const fmtNum = (v: number) => new Intl.NumberFormat('pt-PT').format(v)

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
.cursor-pointer { cursor: pointer; }
.cursor-pointer:hover td { background: var(--tblr-active-bg, rgba(0,0,0,.04)); }
</style>

<style>
/* Sidebar — não-scoped para funcionar com Teleport */
.report-sidebar-overlay {
  position: fixed; inset: 0; z-index: 1050;
  background: rgba(0,0,0,.35);
  display: flex; justify-content: flex-end;
}
.report-sidebar {
  width: 420px; max-width: 100vw;
  background: var(--tblr-bg-surface, #fff);
  height: 100%; display: flex; flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,.15);
}
.report-sidebar-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid var(--tblr-border-color, #e6e7e9);
}
.report-sidebar-summary {
  padding: .75rem 1.25rem;
  border-bottom: 1px solid var(--tblr-border-color, #e6e7e9);
  background: var(--tblr-bg-surface-secondary, #f8f8f8);
}
.report-sidebar-body {
  flex: 1; overflow-y: auto;
}
.report-sidebar-row {
  padding: .85rem 1.25rem;
  border-bottom: 1px solid var(--tblr-border-color, #e6e7e9);
  transition: background .15s;
}
.report-sidebar-row:last-child { border-bottom: none; }
.report-sidebar-row:hover { background: var(--tblr-active-bg, rgba(0,0,0,.03)); }

/* Transição do sidebar */
.sidebar-fade-enter-active, .sidebar-fade-leave-active {
  transition: opacity .2s;
}
.sidebar-fade-enter-active .report-sidebar,
.sidebar-fade-leave-active .report-sidebar {
  transition: transform .25s cubic-bezier(.4,0,.2,1);
}
.sidebar-fade-enter-from, .sidebar-fade-leave-to { opacity: 0; }
.sidebar-fade-enter-from .report-sidebar,
.sidebar-fade-leave-to .report-sidebar { transform: translateX(100%); }
</style>
