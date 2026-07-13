<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">
    <div class="container-xl">

      <!-- ── PAGE HEADER ────────────────────────────────────────── -->
      <div class="page-header d-print-none mb-3">
        <div class="row align-items-center">
          <div class="col">
            <div class="page-pretitle">Visão geral</div>
            <h2 class="page-title">Painel de Controlo</h2>
          </div>
          <div class="col-auto ms-auto d-print-none d-flex align-items-center gap-2">
            <PeriodPicker :model-value="initialPeriod" @update:model-value="v => onPeriodApply(v.start, v.end)" />
            <button class="btn btn-icon btn-ghost-secondary" :disabled="loading"
                    @click="refresh" title="Actualizar">
              <IconRefresh size="16" :class="{ 'animate-spin': loading }" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── INSIGHTS IA ──────────────────────────────────────────── -->
      <div class="card mb-4 border-primary" v-if="!insightDismissed">
        <div class="card-body">
          <div class="d-flex align-items-start gap-3">
            <span class="avatar avatar-sm rounded bg-primary-lt text-primary flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
            </span>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center mb-1">
                <span class="fw-medium text-primary me-2">Análise IA</span>
                <span class="badge bg-primary-lt text-primary">Claude</span>
                <span v-if="insightConsentGiven" class="badge bg-success-lt text-success ms-2 d-flex align-items-center gap-1">
                  <IconCheck size="10" /> Consentimento activo
                </span>
              </div>
              <div v-if="insightLoading" class="text-muted small d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                A analisar os dados do painel...
              </div>
              <div v-else-if="insightError" class="text-danger small">{{ insightError }}</div>
              <div v-else-if="insightText" class="text-body small" style="white-space:pre-line">{{ insightText }}</div>
              <div v-else class="text-muted small">
                Clica em <strong>Analisar</strong> para gerar um resumo executivo do período com IA.
              </div>
            </div>
            <div class="d-flex gap-2 flex-shrink-0">
              <button v-if="!insightText && !insightLoading" class="btn btn-sm btn-primary" @click="handleInsightAnalyze">
                Analisar
              </button>
              <button v-if="insightText && !insightLoading" class="btn btn-sm btn-ghost-secondary" @click="handleInsightAnalyze" title="Regenerar">
                <IconRefresh size="13" />
              </button>
              <button v-if="insightText && !insightLoading" class="btn btn-sm btn-success" @click="insightDismissed = true" title="Útil — dispensar">
                Útil
              </button>
              <button class="btn btn-sm btn-ghost-secondary" @click="insightDismissed = true" title="Dispensar">✕</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── MODAL DE CONSENTIMENTO IA ──────────────────────────── -->
      <Teleport to="body">
        <div v-if="showConsentModal" class="modal fade show d-block" style="background:rgba(0,0,0,0.5);z-index:1055">
          <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-body p-4">

                <div class="text-center mb-4">
                  <span class="avatar avatar-lg rounded bg-warning-lt text-warning mb-3">
                    <IconShieldLock size="28" />
                  </span>
                  <h3 class="mb-1">Aviso de Privacidade e Consentimento</h3>
                  <p class="text-muted small">Antes de activar a análise IA, lê com atenção</p>
                </div>

                <div class="mb-4">
                  <div class="fw-semibold mb-2 d-flex align-items-center gap-2">
                    <IconDatabase size="16" class="text-muted" /> Dados que serão enviados à Anthropic
                  </div>
                  <ul class="list-unstyled mb-0 ps-1">
                    <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Totais agregados de vendas, receita e pagamentos</li>
                    <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Contagens e valores de devoluções por estado</li>
                    <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Indicadores do painel (ticket médio, taxa de conversão, parceiros)</li>
                  </ul>
                </div>

                <div class="mb-4">
                  <div class="fw-semibold mb-2 d-flex align-items-center gap-2">
                    <IconShieldOff size="16" class="text-muted" /> O que <strong>não</strong> é enviado
                  </div>
                  <ul class="list-unstyled mb-0 ps-1">
                    <li class="d-flex gap-2 mb-1 small"><IconX size="14" class="text-danger mt-1 flex-shrink-0" /> Dados pessoais de alunos (nome, email, telefone)</li>
                    <li class="d-flex gap-2 mb-1 small"><IconX size="14" class="text-danger mt-1 flex-shrink-0" /> IDs de utilizadores, referências de pagamento individuais</li>
                    <li class="d-flex gap-2 mb-1 small"><IconX size="14" class="text-danger mt-1 flex-shrink-0" /> Dados de acesso, passwords ou credenciais</li>
                  </ul>
                </div>

                <div class="alert alert-info mb-4 py-2 px-3 small">
                  <p class="mb-1">Sobre a Anthropic (fornecedor do Claude):</p>
                  <p class="mb-1">A Anthropic não utiliza os dados enviados via API para treinar os seus modelos. Os dados são processados exclusivamente para gerar a resposta e não são armazenados.</p>
                  <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener">Ver política de privacidade →</a>
                </div>

                <div class="alert alert-warning mb-4 py-2 px-3 small">
                  <IconAlertTriangle size="14" class="me-1" />
                  <strong>Nota Legal:</strong> O uso desta funcionalidade implica o envio de dados resumidos de negócio a um subprocessador externo (Anthropic, Inc., EUA).
                  Confirma que tens autorização da tua organização para o fazer.
                </div>

                <div class="d-flex gap-3">
                  <button class="btn btn-primary flex-grow-1" @click="giveInsightConsent">
                    <IconCheck size="16" class="me-1" /> Compreendo e Autorizo
                  </button>
                  <button class="btn btn-ghost-secondary" @click="showConsentModal = false">
                    Cancelar
                  </button>
                </div>

                <p class="text-muted text-center mt-3 mb-0" style="font-size:.7rem">
                  Este consentimento é válido para a sessão actual. Ao recarregar a página, será pedido novamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <BOverlay :show="loading" rounded="sm" opacity="0.15">

        <!-- ══════════════════════════════════════════════════════════
             SECÇÃO 1 — SAÚDE FINANCEIRA
             O quê: os 4 números mais importantes do negócio
        ═══════════════════════════════════════════════════════════ -->
        <div class="subheader mb-2 text-uppercase">Saúde Financeira</div>
        <div class="row row-deck row-cards mb-4">

          <!-- Receita Total -->
          <div class="col-sm-6 col-xl-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="subheader">Receita Total</div>
                  <div class="ms-auto">
                    <span class="avatar avatar-xs rounded bg-green-lt text-green">
                      <IconCurrencyDollar size="16" />
                    </span>
                  </div>
                </div>
                <div class="h1 mb-0" style="font-size:1.35rem">{{ toMoney(totals.revenue) }}</div>
                <div class="d-flex align-items-center gap-2 mt-2 mb-3">
                  <span v-if="trends.revenue !== null"
                        class="d-inline-flex align-items-center gap-1 badge"
                        :class="trends.revenue >= 0 ? 'bg-success-lt text-success' : 'bg-danger-lt text-danger'">
                    <component :is="trends.revenue >= 0 ? IconTrendingUp : IconTrendingDown" size="13" />
                    {{ Math.abs(trends.revenue).toFixed(1) }}%
                  </span>
                  <span class="text-muted small">vs período anterior</span>
                </div>
                <div v-if="sparklines.revenue.length > 1" class="sparkline-wrap">
                  <svg width="100%" :height="SH" :viewBox="`0 0 ${SW} ${SH}`" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#2fb344" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#2fb344" stop-opacity="0"/>
                      </linearGradient>
                    </defs>
                    <path :d="sparkAreaPath(sparklines.revenue)" fill="url(#grad-revenue)" />
                    <path :d="sparkLinePath(sparklines.revenue)" fill="none" stroke="#2fb344" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Pedidos Concluídos -->
          <div class="col-sm-6 col-xl-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="subheader">Pedidos Concluídos</div>
                  <div class="ms-auto">
                    <span class="avatar avatar-xs rounded bg-primary-lt text-primary">
                      <IconShoppingCart size="16" />
                    </span>
                  </div>
                </div>
                <div class="h1 mb-0">{{ fmtNum(ordersStatus.completed ?? 0) }}</div>
                <div class="d-flex align-items-center gap-2 mt-2 mb-3">
                  <span v-if="trends.orders !== null"
                        class="d-inline-flex align-items-center gap-1 badge"
                        :class="trends.orders >= 0 ? 'bg-success-lt text-success' : 'bg-danger-lt text-danger'">
                    <component :is="trends.orders >= 0 ? IconTrendingUp : IconTrendingDown" size="13" />
                    {{ Math.abs(trends.orders).toFixed(1) }}%
                  </span>
                  <span class="text-muted small">vs período anterior</span>
                </div>
                <div v-if="sparklines.orders.length > 1" class="sparkline-wrap">
                  <svg width="100%" :height="SH" :viewBox="`0 0 ${SW} ${SH}`" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad-orders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#206bc4" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#206bc4" stop-opacity="0"/>
                      </linearGradient>
                    </defs>
                    <path :d="sparkAreaPath(sparklines.orders)" fill="url(#grad-orders)" />
                    <path :d="sparkLinePath(sparklines.orders)" fill="none" stroke="#206bc4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Taxa de Conversão -->
          <div class="col-sm-6 col-xl-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="subheader">Taxa de Conversão</div>
                  <div class="ms-auto">
                    <span class="avatar avatar-xs rounded bg-teal-lt text-teal">
                      <IconCash size="16" />
                    </span>
                  </div>
                </div>
                <div class="h1 mb-0">{{ conversionRate }}%</div>
                <div class="text-muted small mt-1 mb-3">
                  {{ fmtNum(paymentsStatus.paid ?? 0) }} pagos de {{ fmtNum(totalPayments) }} totais
                </div>
                <div class="progress progress-sm mb-2">
                  <div class="progress-bar bg-success" :style="{ width: conversionRate + '%' }"></div>
                  <div class="progress-bar bg-warning opacity-60" :style="{ width: pendingRate + '%' }"></div>
                  <div class="progress-bar bg-danger opacity-60" :style="{ width: failedRate + '%' }"></div>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted" style="font-size:.65rem">✓ Pagos {{ conversionRate }}%</span>
                  <span class="text-muted" style="font-size:.65rem">⏳ {{ pendingRate }}%</span>
                  <span class="text-muted" style="font-size:.65rem">✗ {{ failedRate }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Ticket Médio -->
          <div class="col-sm-6 col-xl-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <div class="subheader">Ticket Médio</div>
                  <div class="ms-auto">
                    <span class="avatar avatar-xs rounded bg-cyan-lt text-cyan">
                      <IconCurrencyDollar size="16" />
                    </span>
                  </div>
                </div>
                <div class="h1 mb-0" style="font-size:1.35rem">{{ toMoney(avgTicket) }}</div>
                <div class="text-muted small mt-1 mb-3">por transação paga</div>
                <div class="d-flex gap-2 mt-3">
                  <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-info-lt)">
                    <div class="fw-bold text-info small">{{ fmtNum(totals.courses) }}</div>
                    <div class="text-muted" style="font-size:.65rem">Cursos</div>
                  </div>
                  <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-purple-lt)">
                    <div class="fw-bold text-purple small">{{ fmtNum(totals.bundles) }}</div>
                    <div class="text-muted" style="font-size:.65rem">Bundles</div>
                  </div>
                  <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-secondary-lt)">
                    <div class="fw-bold text-secondary small">{{ fmtNum(totals.users) }}</div>
                    <div class="text-muted" style="font-size:.65rem">Alunos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             SECÇÃO 2 — TENDÊNCIA TEMPORAL
             O quê: como evoluíram os pagamentos ao longo do período
        ═══════════════════════════════════════════════════════════ -->
        <div class="subheader mb-2 text-uppercase">Evolução no Período</div>
        <div class="row mb-4">
             <div class="col-md-12 mb-3">
            <div class="card h-100">
              <div class="card-header">
                <h3 class="card-title d-flex align-items-center gap-2">
                  <span class="avatar avatar-xs rounded bg-green-lt text-green"><IconCurrencyDollar size="15" /></span>
                  Receita por Estado
                </h3>
                <div class="card-options">
                  <span class="text-muted small fw-medium">{{ toMoney(totalRevenue) }}</span>
                </div>
              </div>
              <div class="card-body">
                <div class="row g-3 mb-3">
                  <div class="col-3 text-center">
                    <div class="fw-bold text-success h3 mb-1">{{ toMoney(paymentsRevenue.paid ?? 0) }}</div>
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <span class="badge badge-dot bg-success"></span>
                      <span class="text-muted small">Pagos</span>
                    </div>
                    <div class="text-muted" style="font-size:.7rem">{{ paymentsStatus.paid ?? 0 }} transacções</div>
                  </div>
                  <div class="col-3 text-center">
                    <div class="fw-bold text-warning h3 mb-1">{{ toMoney(paymentsRevenue.pending ?? 0) }}</div>
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <span class="badge badge-dot bg-warning"></span>
                      <span class="text-muted small">Pendentes</span>
                    </div>
                    <div class="text-muted" style="font-size:.7rem">{{ paymentsStatus.pending ?? 0 }} transacções</div>
                  </div>
                  <div class="col-3 text-center">
                    <div class="fw-bold text-danger h3 mb-1">{{ toMoney(paymentsRevenue.failed ?? 0) }}</div>
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <span class="badge badge-dot bg-danger"></span>
                      <span class="text-muted small">Falhados</span>
                    </div>
                    <div class="text-muted" style="font-size:.7rem">{{ paymentsStatus.failed ?? 0 }} transacções</div>
                  </div>
                  <div class="col-3 text-center">
                    <div class="fw-bold text-purple h3 mb-1">{{ toMoney(refundsStatus.approved?.amount ?? 0) }}</div>
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <span class="badge badge-dot bg-purple"></span>
                      <span class="text-muted small">Devolvidos</span>
                    </div>
                    <div class="text-muted" style="font-size:.7rem">{{ refundsStatus.approved?.total ?? 0 }} devoluções</div>
                  </div>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted small">Taxa de conversão</span>
                  <span class="small fw-medium text-success">{{ conversionRate }}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-success" :style="{ width: conversionRate + '%' }"></div>
                  <div class="progress-bar bg-warning opacity-50" :style="{ width: pendingRate + '%' }"></div>
                  <div class="progress-bar bg-danger opacity-50" :style="{ width: failedRate + '%' }"></div>
                  <div class="progress-bar bg-purple opacity-50" :style="{ width: refundedRate + '%' }"></div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                  <span class="text-muted" style="font-size:.65rem">Pagos {{ conversionRate }}%</span>
                  <span class="text-muted" style="font-size:.65rem">Pendentes {{ pendingRate }}%</span>
                  <span class="text-muted" style="font-size:.65rem">Falhados {{ failedRate }}%</span>
                  <span class="text-muted" style="font-size:.65rem">Devolvidos {{ refundedRate }}%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <div>
                  <h3 class="card-title">Evolução dos Pagamentos</h3>
                  <div class="card-subtitle">Volume de transações por estado ao longo do período</div>
                </div>
                <div class="card-options gap-3">
                  <span class="d-inline-flex align-items-center gap-1 text-muted small">
                    <span style="width:10px;height:3px;border-radius:2px;background:#2fb344;display:inline-block"></span>Pagos
                  </span>
                  <span class="d-inline-flex align-items-center gap-1 text-muted small">
                    <span style="width:10px;height:3px;border-radius:2px;background:#f59f00;display:inline-block"></span>Pendentes
                  </span>
                  <span class="d-inline-flex align-items-center gap-1 text-muted small">
                    <span style="width:10px;height:3px;border-radius:2px;background:#d63939;display:inline-block"></span>Falhados
                  </span>
                  <span class="d-inline-flex align-items-center gap-1 text-muted small">
                    <span style="width:10px;height:3px;border-radius:2px;background:#ae3ec9;display:inline-block"></span>Devolvidos
                  </span>
                </div>
              </div>
              <div class="card-body pt-2 pb-3">
                <Line :data="evolutionLine.data" :options="evolutionLine.options" style="max-height:200px" />
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             SECÇÃO 3 — FUNIL DE TRANSAÇÕES
             O quê: estado detalhado de pedidos, pagamentos e receita
        ═══════════════════════════════════════════════════════════ -->
        <div class="subheader mb-2 text-uppercase">Funil de Transações</div>
        <div class="row row-deck row-cards mb-4">

          <!-- Estado dos Pedidos -->
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-header">
                <h3 class="card-title d-flex align-items-center gap-2">
                  <span class="avatar avatar-xs rounded bg-primary-lt text-primary"><IconShoppingCart size="15" /></span>
                  Estado dos Pedidos
                </h3>
                <div class="card-options">
                  <span class="text-muted small fw-medium">{{ fmtNum(totalOrders) }}</span>
                </div>
              </div>
              <div class="card-body">
                <div v-for="(v, key) in ordersStatus" :key="key" class="mb-3 last-mb-0">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="d-flex align-items-center gap-2 small">
                      <span :class="statusDot(key)"></span>
                      {{ formatOrderStatus(key) }}
                    </span>
                    <span class="small fw-bold">{{ fmtNum(v) }}
                      <span class="text-muted fw-normal">({{ pct(v, totalOrders) }}%)</span>
                    </span>
                  </div>
                  <div class="progress progress-sm">
                    <div :class="progressBar(key)" :style="{ width: pct(v, totalOrders) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado dos Pagamentos -->
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-header">
                <h3 class="card-title d-flex align-items-center gap-2">
                  <span class="avatar avatar-xs rounded bg-cyan-lt text-cyan"><IconCash size="15" /></span>
                  Estado dos Pagamentos
                </h3>
                <div class="card-options">
                  <span class="text-muted small fw-medium">{{ fmtNum(totalPayments) }}</span>
                </div>
              </div>
              <div class="card-body">
                <div v-for="(v, key) in paymentsStatus" :key="key" class="mb-3 last-mb-0">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="d-flex align-items-center gap-2 small">
                      <span :class="statusDot(key)"></span>
                      {{ formatPaymentStatus(key) }}
                    </span>
                    <span class="small fw-bold">{{ fmtNum(v) }}
                      <span class="text-muted fw-normal">({{ pct(v, totalPayments) }}%)</span>
                    </span>
                  </div>
                  <div class="progress progress-sm">
                    <div :class="progressBar(key)" :style="{ width: pct(v, totalPayments) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Receita por Estado -->

        </div>

        <!-- ══════════════════════════════════════════════════════════
             SECÇÃO 4 — PRODUTOS, DEVOLUÇÕES & PARCEIROS
             O quê: mix de produtos vendidos + itens de atenção
        ═══════════════════════════════════════════════════════════ -->
        <div class="subheader mb-2 text-uppercase">Produtos, Devoluções &amp; Parceiros</div>
        <div class="row row-deck row-cards mb-4">

          <!-- Produtos: Cursos + Bundles -->
          <div class="col-lg-4">
            <div class="card h-100">
              <div class="card-header">
                <h3 class="card-title d-flex align-items-center gap-2">
                  <span class="avatar avatar-xs rounded bg-indigo-lt text-indigo"><IconBook size="15" /></span>
                  Produtos Vendidos
                </h3>
                <div class="card-options">
                  <span class="text-muted small">{{ fmtNum(totals.courses + totals.bundles) }} pedidos</span>
                </div>
              </div>
              <div class="card-body">
                <!-- Cursos -->
                <div class="mb-4">
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="d-flex align-items-center gap-2 small fw-medium">
                      <span class="badge badge-dot bg-info"></span>Cursos
                    </span>
                    <span class="small text-muted">{{ coursesBundlesPct.courses }}% do total</span>
                  </div>
                  <div class="progress progress-sm mb-2">
                    <div class="progress-bar bg-info" :style="{ width: coursesBundlesPct.courses + '%' }"></div>
                  </div>
                  <div class="d-flex gap-2 mt-1">
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-info-lt)">
                      <div class="fw-bold text-info small">{{ toMoney(courseTypeRevenue.course?.revenue ?? 0) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Receita</div>
                    </div>
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-secondary-lt)">
                      <div class="fw-bold text-secondary small">{{ fmtNum(totals.courses) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Pedidos</div>
                    </div>
                  </div>
                </div>
                <!-- Separador -->
                <hr class="my-3" />
                <!-- Bundles -->
                <div>
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="d-flex align-items-center gap-2 small fw-medium">
                      <span class="badge badge-dot bg-purple"></span>Bundles
                    </span>
                    <span class="small text-muted">{{ coursesBundlesPct.bundles }}% do total</span>
                  </div>
                  <div class="progress progress-sm mb-2">
                    <div class="progress-bar bg-purple" :style="{ width: coursesBundlesPct.bundles + '%' }"></div>
                  </div>
                  <div class="d-flex gap-2 mt-1">
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-purple-lt)">
                      <div class="fw-bold text-purple small">{{ toMoney(courseTypeRevenue.bundle?.revenue ?? 0) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Receita</div>
                    </div>
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-secondary-lt)">
                      <div class="fw-bold text-secondary small">{{ fmtNum(totals.bundles) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Pedidos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Devoluções -->
          <div class="col-lg-4">
            <div class="card h-100" :class="(refundsStatus.pending?.total ?? 0) > 0 ? 'border-warning' : ''">
              <div class="card-header">
                <h3 class="card-title d-flex align-items-center gap-2">
                  <span class="avatar avatar-xs rounded bg-orange-lt text-orange"><IconArrowBackUp size="15" /></span>
                  Devoluções
                </h3>
                <div class="card-options">
                  <span v-if="(refundsStatus.pending?.total ?? 0) > 0"
                        class="badge bg-warning text-white">
                    {{ refundsStatus.pending.total }} pendente{{ refundsStatus.pending.total > 1 ? 's' : '' }}
                  </span>
                  <span v-else class="text-muted small">{{ fmtNum(totals.refunds ?? 0) }} total</span>
                </div>
              </div>
              <div class="card-body">
                <div class="d-flex gap-2 mb-3">
                  <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-warning-lt)">
                    <div class="fw-bold text-warning h4 mb-0">{{ fmtNum(refundsStatus.pending?.total ?? 0) }}</div>
                    <div class="text-muted" style="font-size:.65rem">Pendentes</div>
                    <div class="text-warning fw-medium" style="font-size:.7rem">{{ toMoney(refundsStatus.pending?.amount ?? 0) }}</div>
                  </div>
                  <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-success-lt)">
                    <div class="fw-bold text-success h4 mb-0">{{ fmtNum(refundsStatus.approved?.total ?? 0) }}</div>
                    <div class="text-muted" style="font-size:.65rem">Aprovadas</div>
                    <div class="text-success fw-medium" style="font-size:.7rem">{{ toMoney(refundsStatus.approved?.amount ?? 0) }}</div>
                  </div>
                  <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-danger-lt)">
                    <div class="fw-bold text-danger h4 mb-0">{{ fmtNum(refundsStatus.rejected?.total ?? 0) }}</div>
                    <div class="text-muted" style="font-size:.65rem">Rejeitadas</div>
                    <div class="text-danger fw-medium" style="font-size:.7rem">{{ toMoney(refundsStatus.rejected?.amount ?? 0) }}</div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center py-2 border-top">
                  <span class="text-muted small">Total devolvido (aprovado)</span>
                  <span class="fw-bold text-success small">{{ toMoney(totals.refundsAmount ?? 0) }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center py-2 border-top">
                  <span class="text-muted small">Taxa de devolução</span>
                  <span class="fw-medium small" :class="refundRate > 5 ? 'text-danger' : 'text-muted'">{{ refundRate }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Parceiros & Comunidade -->
          <div class="col-lg-4">
            <div class="card h-100">
              <div class="card-header">
                <h3 class="card-title d-flex align-items-center gap-2">
                  <span class="avatar avatar-xs rounded bg-teal-lt text-teal"><IconBuildingStore size="15" /></span>
                  Parceiros &amp; Comunidade
                </h3>
              </div>
              <div class="card-body">
                <!-- Parceiros -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="small fw-medium text-muted text-uppercase">Parceiros</span>
                    <span class="small fw-bold">{{ fmtNum(totals.activePartners) }} activos</span>
                  </div>
                  <div class="d-flex gap-2">
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-success-lt)">
                      <div class="fw-bold text-success small">{{ fmtNum(partners.active ?? 0) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Activos</div>
                    </div>
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-warning-lt)">
                      <div class="fw-bold text-warning small">{{ fmtNum(partners.pending ?? 0) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Pendentes</div>
                    </div>
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-danger-lt)">
                      <div class="fw-bold text-danger small">{{ fmtNum(partners.disabled ?? 0) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Inactivos</div>
                    </div>
                  </div>
                </div>
                <hr class="my-3" />
                <!-- Utilizadores / Alunos -->
                <div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="small fw-medium text-muted text-uppercase">Alunos</span>
                    <span class="small fw-bold">{{ fmtNum(totals.users) }} inscritos</span>
                  </div>
                  <div class="d-flex gap-2">
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-primary-lt)">
                      <div class="fw-bold text-primary small">{{ fmtNum(totals.orders) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Pedidos</div>
                    </div>
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-success-lt)">
                      <div class="fw-bold text-success small">{{ fmtNum(ordersStatus.completed ?? 0) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Concluídos</div>
                    </div>
                    <div class="flex-fill text-center p-2 rounded" style="background:var(--tblr-danger-lt)">
                      <div class="fw-bold text-danger small">{{ fmtNum(ordersStatus.canceled ?? 0) }}</div>
                      <div class="text-muted" style="font-size:.65rem">Cancelados</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </BOverlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import "dayjs/locale/pt"
import dayjs from "dayjs"
dayjs.locale("pt")

import { ref, computed } from "vue"
import {
  IconShoppingCart, IconCash, IconBook, IconUsers,
  IconCheck,
  IconTrendingUp, IconTrendingDown,
  IconRefresh,
  IconCurrencyDollar, IconPackage, IconBuildingStore,
  IconArrowBackUp, IconShieldLock, IconShieldOff,
  IconDatabase, IconX, IconAlertTriangle,
} from "@tabler/icons-vue"
import PeriodPicker from "./report/common/components/PeriodPicker.vue"
import { ReportAPIService } from "./report/domain/service/ReportService"
import { useThemeStore } from "@common/presentation/stores/theme_store"
import { Doughnut, Line } from "vue-chartjs"
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement,
} from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, ChartDataLabels)

const themeStore = useThemeStore()

/* ── STATE ──────────────────────────────────────────────────── */
const loading = ref(false)
const currentStart = ref("")
const currentEnd = ref("")

const evolution        = ref<any[]>([])
const ordersStatus     = ref<Record<string, number>>({})
const paymentsStatus   = ref<Record<string, number>>({})
const paymentsRevenue  = ref<Record<string, number>>({})
const latestOrders     = ref<any[]>([])
const payments         = ref<any[]>([])
const totals = ref({
  orders: 0, payments: 0, courses: 0, bundles: 0,
  users: 0, revenue: 0, activePartners: 0,
  refunds: 0, refundsAmount: 0,
})
const partners = ref({ active: 0, pending: 0, disabled: 0 })
const courseTypeRevenue = ref<Record<string, { revenue: number; orders: number }>>({ course: { revenue: 0, orders: 0 }, bundle: { revenue: 0, orders: 0 } })
const previousTotals = ref({ orders: 0, payments: 0, revenue: 0 })
const refundsStatus = ref<Record<string, { total: number; amount: number }>>({ pending: { total: 0, amount: 0 }, approved: { total: 0, amount: 0 }, rejected: { total: 0, amount: 0 } })

/* ── SPARKLINES ─────────────────────────────────────────────── */
const SW = 200
const SH = 36

function sparkLinePath(values: number[]): string {
  if (values.length < 2) return ""
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return "M " + values.map((v, i) => {
    const x = (i / (values.length - 1)) * SW
    const y = SH - ((v - min) / range) * (SH - 4) - 2
    return `${x},${y}`
  }).join(" L ")
}

function sparkAreaPath(values: number[]): string {
  if (values.length < 2) return ""
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * SW
    const y = SH - ((v - min) / range) * (SH - 4) - 2
    return `${x},${y}`
  })
  return `M 0,${SH} L ${pts.join(" L ")} L ${SW},${SH} Z`
}

/* ── COMPUTED ───────────────────────────────────────────────── */
const totalOrders   = computed(() => Object.values(ordersStatus.value).reduce((a, b) => a + b, 0))
const totalPayments = computed(() => Object.values(paymentsStatus.value).reduce((a, b) => a + b, 0))
const totalRevenue  = computed(() => Object.values(paymentsRevenue.value).reduce((a, b) => a + b, 0))

const conversionRate = computed(() => pct(paymentsStatus.value.paid  ?? 0, totalPayments.value))
const pendingRate    = computed(() => pct(paymentsStatus.value.pending ?? 0, totalPayments.value))
const failedRate     = computed(() => pct(paymentsStatus.value.failed  ?? 0, totalPayments.value))
const refundedRate   = computed(() => pct(refundsStatus.value.approved?.amount ?? 0, totalRevenue.value))
const avgTicket      = computed(() => {
  const paid = paymentsStatus.value.paid ?? 0
  return paid ? totals.value.revenue / paid : 0
})
const refundRate     = computed(() => pct(totals.value.refunds ?? 0, totals.value.orders || 1))

const coursesBundlesPct = computed(() => {
  const total = (totals.value.courses + totals.value.bundles) || 1
  return {
    courses: Math.round((totals.value.courses / total) * 100),
    bundles: Math.round((totals.value.bundles / total) * 100),
  }
})

const sparklines = computed(() => {
  const ev = evolution.value
  return {
    orders:  ev.map(d => (d.paid ?? 0) + (d.pending ?? 0) + (d.failed ?? 0)),
    paid:    ev.map(d => d.paid ?? 0),
    revenue: ev.map(d => d.paidRevenue ?? 0),
  }
})

function trendVsPrev(current: number, previous: number): number | null {
  if (!previous && !current) return null
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

const trends = computed(() => ({
  orders:   trendVsPrev(totals.value.orders,   previousTotals.value.orders),
  payments: trendVsPrev(totals.value.payments, previousTotals.value.payments),
  revenue:  trendVsPrev(totals.value.revenue,  previousTotals.value.revenue),
}))

/* ── UI HELPERS ─────────────────────────────────────────────── */
const fmtNum  = (v: number) => new Intl.NumberFormat("pt-AO").format(v)
const toMoney = (v: number) => new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(v ?? 0)
const formatDate = (d: string) => dayjs(d).format("DD/MM/YY HH:mm")

const formatOrderStatus  = (s: string) => ({ pending: "Pendente", completed: "Concluído", canceled: "Cancelado" })[s] ?? s
const formatPaymentStatus = (s: string) => ({ paid: "Pago", pending: "Pendente", failed: "Falhado" })[s] ?? s

const statusBadge = (s: string) => ({
  pending:   "badge bg-warning-lt text-warning",
  completed: "badge bg-success-lt text-success",
  canceled:  "badge bg-danger-lt text-danger",
  paid:      "badge bg-success-lt text-success",
  failed:    "badge bg-danger-lt text-danger",
})[s] ?? "badge bg-secondary-lt text-secondary"

const statusDot = (s: string) => ({
  pending:   "badge badge-dot bg-warning",
  completed: "badge badge-dot bg-success",
  canceled:  "badge badge-dot bg-danger",
  paid:      "badge badge-dot bg-success",
  failed:    "badge badge-dot bg-danger",
})[s] ?? "badge badge-dot bg-secondary"

const progressBar = (s: string) => ({
  pending:   "progress-bar bg-warning",
  completed: "progress-bar bg-success",
  canceled:  "progress-bar bg-danger",
  paid:      "progress-bar bg-success",
  failed:    "progress-bar bg-danger",
})[s] ?? "progress-bar"

function pct(v: number, total: number) {
  if (!total) return 0
  return Math.round((v / total) * 100)
}

/* ── DATE RANGE ─────────────────────────────────────────────── */
function onPeriodApply(start: string, end: string) {
  currentStart.value = start
  currentEnd.value = end
  loadDashboard(start, end)
}

function refresh() {
  if (currentStart.value && currentEnd.value) {
    loadDashboard(currentStart.value, currentEnd.value)
  }
}

/* ── CHART THEME ────────────────────────────────────────────── */
const chartText  = computed(() => themeStore.isDark ? "#c8ccd1" : "#616876")
const chartGrid  = computed(() => themeStore.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)")
const tooltipBg  = computed(() => themeStore.isDark ? "#1e293b" : "#fff")
const tooltipBorder = computed(() => themeStore.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")

function formatEvolutionLabel(label: string | number) {
  const s = String(label)
  if (!s && s !== '0') return ""
  // Agrupamento horário (0–23)
  if (/^\d{1,2}$/.test(s)) return s.padStart(2, '0') + 'h'
  if (s.includes("T")) return dayjs(s).format("DD MMM")
  if (/^\d{4}-\d{2}$/.test(s)) return dayjs(s + "-01").format("MMM YY")
  if (/^\d{4}$/.test(s)) return s
  return dayjs(s).format("DD MMM")
}

const evolutionLine = computed(() => {
  const series = evolution.value
  const tc = chartText.value, gc = chartGrid.value
  return {
    data: {
      labels: series.map(d => formatEvolutionLabel(d.label)),
      datasets: [
        {
          label: "Pagos",
          data: series.map(d => d.paid ?? 0),
          borderColor: "#2fb344", backgroundColor: "rgba(47,179,68,0.1)",
          tension: 0.4, fill: true,
          pointRadius: series.length > 14 ? 0 : 3, pointHoverRadius: 5,
        },
        {
          label: "Pendentes",
          data: series.map(d => d.pending ?? 0),
          borderColor: "#f59f00", backgroundColor: "transparent",
          tension: 0.4, borderDash: [4, 4],
          pointRadius: series.length > 14 ? 0 : 3, pointHoverRadius: 5,
        },
        {
          label: "Falhados",
          data: series.map(d => d.failed ?? 0),
          borderColor: "#d63939", backgroundColor: "transparent",
          tension: 0.4, borderDash: [4, 4],
          pointRadius: series.length > 14 ? 0 : 3, pointHoverRadius: 5,
        },
        {
          label: "Devolvidos",
          data: series.map(d => d.refunded ?? 0),
          borderColor: "#ae3ec9", backgroundColor: "transparent",
          tension: 0.4, borderDash: [2, 4],
          pointRadius: series.length > 14 ? 0 : 3, pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          backgroundColor: tooltipBg.value, titleColor: tc, bodyColor: tc,
          borderColor: tooltipBorder.value, borderWidth: 1, padding: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: tc, font: { size: 11 } },
          grid: { color: gc },
          border: { dash: [4, 4], display: false },
        },
        x: {
          ticks: { color: tc, font: { size: 11 }, maxRotation: 0 },
          grid: { display: false }, border: { display: false },
        },
      },
    },
  }
})

function doughnutChart(keys: string[], labelFn: (k: string) => string, data: Record<string, number>, colors: string[]) {
  const values = keys.map(k => Number(data[k] || 0))
  const total = values.reduce((a, b) => a + b, 0)
  const tc = chartText.value
  return {
    data: {
      labels: keys.map(labelFn),
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }],
    },
    options: {
      responsive: true, cutout: "65%",
      plugins: {
        legend: { position: "bottom", labels: { color: tc, padding: 12, font: { size: 12 } } },
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 11 },
          formatter: (value: number) => value ? `${value}\n${pct(value, total)}%` : "",
        },
      },
    },
  }
}

const ordersDoughnut = computed(() =>
  doughnutChart(
    ["pending", "completed", "canceled"],
    formatOrderStatus,
    ordersStatus.value,
    ["#f59f00", "#2fb344", "#d63939"]
  )
)
const paymentsDoughnut = computed(() =>
  doughnutChart(
    ["pending", "paid", "failed"],
    formatPaymentStatus,
    paymentsStatus.value,
    ["#f59f00", "#2fb344", "#d63939"]
  )
)

/* ── FETCH ──────────────────────────────────────────────────── */
async function loadDashboard(start: string, end: string) {
  loading.value = true
  try {
    const { data } = await ReportAPIService.reportDashboard({ type: "dashboard", start, end })
    totals.value          = { ...totals.value, ...data.totals }
    previousTotals.value  = data.previousTotals  ?? { orders: 0, payments: 0, revenue: 0 }
    ordersStatus.value    = data.ordersStatus     ?? {}
    paymentsStatus.value  = data.paymentsStatus   ?? {}
    paymentsRevenue.value = data.paymentsRevenue  ?? {}
    courseTypeRevenue.value = data.courseTypeRevenue ?? { course: { revenue: 0, orders: 0 }, bundle: { revenue: 0, orders: 0 } }
    latestOrders.value    = data.latestOrders    ?? []
    payments.value        = data.latestPayments  ?? []
    evolution.value       = data.evolution       ?? []
    const pb = data.partnersBreakdown ?? {}
    partners.value = { active: pb.active ?? 0, disabled: pb.disabled ?? 0, pending: 0 }
    refundsStatus.value = data.refundsStatus ?? { pending: { total: 0, amount: 0 }, approved: { total: 0, amount: 0 }, rejected: { total: 0, amount: 0 } }
  } finally {
    loading.value = false
  }
}

// Estado inicial: "Hoje". O PeriodPicker recebe este modelValue para mostrar o label correcto.
const _initial = dayjs().format("YYYY-MM-DD")
const initialPeriod = { preset: "today" as const, start: _initial, end: _initial }
currentStart.value = _initial
currentEnd.value = _initial
loadDashboard(_initial, _initial)

/* ── INSIGHTS IA ────────────────────────────────────────────── */
const insightConsentGiven = ref(false)
const showConsentModal    = ref(false)
const insightLoading      = ref(false)
const insightError        = ref<string | null>(null)
const insightText         = ref<string | null>(null)
const insightDismissed    = ref(false)

function giveInsightConsent() {
  insightConsentGiven.value = true
  showConsentModal.value = false
  generateInsight()
}

function handleInsightAnalyze() {
  if (!insightConsentGiven.value) {
    showConsentModal.value = true
    return
  }
  generateInsight()
}

async function generateInsight() {
  insightLoading.value = true
  insightError.value = null
  try {
    const { start, end } = activeRange.value === "custom"
      ? { start: customStart.value, end: customEnd.value }
      : rangeToDates(activeRange.value)
    const res = await ReportAPIService.insights({
      period: { start, end },
      summary: {
        total_orders:            totals.value.orders,
        total_payments:          totalPayments.value,
        net_revenue:             totals.value.revenue,
        total_refunds:           totals.value.refunds,
        total_refunds_amount:    totals.value.refundsAmount,
        approved_refunds_amount: refundsStatus.value.approved?.amount ?? 0,
        avg_ticket:              avgTicket.value,
        conversion_rate:         conversionRate.value,
        active_partners:         totals.value.activePartners,
      },
      refundsByStatus: refundsStatus.value,
      ordersStatus:    ordersStatus.value,
      paymentsStatus:  paymentsStatus.value,
      courseTypeRevenue: courseTypeRevenue.value,
    })
    insightText.value = (res as any).data?.insight ?? null
  } catch {
    insightError.value = 'Erro ao gerar análise. Verifica a chave ANTHROPIC_API_KEY.'
  } finally {
    insightLoading.value = false
  }
}
</script>

<style scoped>
.sparkline-wrap { height: 36px; overflow: hidden; }
.last-mb-0:last-child { margin-bottom: 0 !important; }
@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin { animation: spin .8s linear infinite; }
</style>
