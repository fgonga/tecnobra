<!--
 - Copyright © 2021 - 2025
 - Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">
    <div class="container-xl">

      <!-- ══ ECRÃ DE CONSENTIMENTO ══════════════════════════════════════ -->
      <div v-if="!consentGiven" class="row justify-content-center">
        <div class="col-lg-7 col-md-9">
          <div class="card mt-4 border-warning" style="border-top: 4px solid var(--tblr-warning) !important;">
            <div class="card-body p-4">
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
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Totais agregados de vendas, receita e pagamentos por período</li>
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Contagens e valores de devoluções por estado</li>
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Performance por curso (nome do curso, nº vendas, receita)</li>
                  <li class="d-flex gap-2 mb-1 small"><IconCheck size="14" class="text-success mt-1 flex-shrink-0" /> Performance por influenciador (nome, comissões, receita)</li>
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
                A Anthropic não utiliza os dados enviados via API para treinar os seus modelos.
                Os dados são processados exclusivamente para gerar a resposta e não são armazenados.
              </div>
              <div class="alert alert-warning mb-4 py-2 px-3 small">
                <IconAlertTriangle size="14" class="me-1" />
                <strong>Nota Legal:</strong> O uso desta funcionalidade implica o envio de dados resumidos de negócio a um subprocessador externo (Anthropic, Inc., EUA).
                Confirma que tens autorização da tua organização para o fazer.
              </div>
              <div class="d-flex gap-3">
                <button class="btn btn-primary flex-grow-1" @click="consentGiven = true">
                  <IconCheck size="16" class="me-1" /> Compreendo e Autorizo
                </button>
                <button class="btn btn-ghost-secondary" @click="$router.back()">Voltar</button>
              </div>
              <p class="text-muted text-center mt-3 mb-0" style="font-size:.7rem">
                Este consentimento é válido para a sessão actual. Ao recarregar a página, será pedido novamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ CONTEÚDO PRINCIPAL ══════════════════════════════════════════ -->
      <template v-if="consentGiven">

        <!-- ── HEADER ──────────────────────────────────────────────────── -->
        <div class="page-header d-print-none mb-3">
          <div class="row align-items-center">
            <div class="col">
              <div class="page-pretitle">Inteligência Artificial</div>
              <h2 class="page-title d-flex align-items-center gap-2">
                <span class="avatar avatar-sm rounded bg-purple-lt text-purple">
                  <IconArrowsExchange size="18" />
                </span>
                Comparativo de Períodos
              </h2>
              <p class="text-muted mb-0">Compara múltiplos períodos side-by-side com análise executiva gerada por IA</p>
            </div>
            <div class="col-auto d-flex gap-2">
              <button class="btn btn-ghost-secondary btn-sm" @click="consentGiven = false" title="Revogar consentimento">
                <IconShieldOff size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- ── TABS ────────────────────────────────────────────────────── -->
        <ul class="nav nav-tabs mb-4">
          <li class="nav-item">
            <a class="nav-link d-flex align-items-center gap-2" :class="{ active: activeTab === 'comparativo' }" role="button" @click="activeTab = 'comparativo'">
              <IconArrowsExchange size="16" /> Comparativo
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link d-flex align-items-center gap-2" :class="{ active: activeTab === 'guardadas' }" role="button" @click="switchToSaved">
              <IconBookmark size="16" /> Análises Guardadas
              <span v-if="savedList.length" class="badge bg-purple-lt text-purple ms-1">{{ savedList.length }}</span>
            </a>
          </li>
        </ul>

        <!-- ══ TAB: COMPARATIVO ════════════════════════════════════════ -->
        <div v-if="activeTab === 'comparativo'">

          <!-- ── CONSTRUTOR DE PERÍODOS ──────────────────────────────── -->
          <div class="card mb-4">
            <div class="card-header">
              <h3 class="card-title"><IconAdjustments size="16" class="me-2 text-muted"/>Configurar Períodos</h3>
              <div class="card-options">
                <button class="btn btn-sm btn-outline-purple d-flex align-items-center gap-1" @click="addPeriod">
                  <IconPlus size="14" /> Adicionar período
                </button>
              </div>
            </div>
            <div class="card-body">

              <!-- Aviso ≥ 5 períodos -->
              <div v-if="periods.length >= 5" class="alert alert-warning py-2 px-3 small mb-3">
                <IconAlertTriangle size="14" class="me-1" />
                Com muitos períodos a performance pode ser afectada. Considera remover alguns para uma análise mais focada.
              </div>

              <div class="row g-3">
                <div v-for="(p, i) in periods" :key="p.id" class="col-md-6 col-lg-4">
                  <div class="card card-sm" :style="`border-top: 3px solid ${periodColor(i)}`">
                    <div class="card-body pb-2">
                      <div class="d-flex align-items-center mb-2">
                        <span class="badge me-2" :style="`background:${periodColor(i)}20; color:${periodColor(i)}`">
                          {{ periodLabel(i) }}
                        </span>
                        <button v-if="periods.length > 2" class="btn btn-ghost-danger btn-sm ms-auto p-1" @click="removePeriod(i)" title="Remover">
                          <IconX size="14" />
                        </button>
                      </div>
                      <div class="mb-2">
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          :placeholder="`Nome (ex: Q1 2024)`"
                          v-model="p.name"
                        />
                      </div>
                      <div class="d-flex gap-2">
                        <div class="flex-grow-1">
                          <label class="form-label small mb-1">Início</label>
                          <input type="date" class="form-control form-control-sm" v-model="p.start" />
                        </div>
                        <div class="flex-grow-1">
                          <label class="form-label small mb-1">Fim</label>
                          <input type="date" class="form-control form-control-sm" v-model="p.end" />
                        </div>
                      </div>
                      <div v-if="p.loading" class="text-center py-2 mt-2">
                        <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
                      </div>
                      <div v-else-if="p.error" class="text-danger small mt-2">{{ p.error }}</div>
                      <div v-else-if="p.data" class="mt-2 text-muted small d-flex align-items-center gap-1">
                        <IconCircleCheck size="14" class="text-success" /> Dados carregados
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Secções visíveis -->
              <div class="mt-3 pt-3 border-top d-flex align-items-center gap-3 flex-wrap">
                <span class="text-muted small fw-medium">Secções:</span>
                <label v-for="s in sections" :key="s.key" class="d-flex align-items-center gap-1 small" style="cursor:pointer">
                  <input type="checkbox" class="form-check-input m-0" v-model="s.active" />
                  {{ s.label }}
                </label>
              </div>

              <div class="mt-3 d-flex gap-2">
                <button
                  class="btn btn-primary"
                  @click="loadAll"
                  :disabled="loadingAny || !canLoad"
                >
                  <span v-if="loadingAny" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  <IconRefresh v-else size="16" class="me-1" />
                  {{ loadingAny ? 'A carregar...' : 'Carregar Dados' }}
                </button>
                <button v-if="hasResults" class="btn btn-ghost-secondary" @click="clearResults">
                  Limpar resultados
                </button>
              </div>
            </div>
          </div>

          <!-- ── PAINEL IA ────────────────────────────────────────────── -->
          <div v-if="hasResults" class="card mb-4 border-purple" style="border-top: 3px solid var(--tblr-purple) !important;">
            <div class="card-header" role="button" @click="aiPanelOpen = !aiPanelOpen" style="cursor:pointer">
              <h3 class="card-title d-flex align-items-center gap-2">
                <span class="avatar avatar-xs rounded bg-purple-lt text-purple">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                </span>
                Análise IA <span class="badge bg-purple-lt text-purple ms-1">Claude</span>
              </h3>
              <div class="card-options">
                <IconChevronDown size="16" :style="{ transform: aiPanelOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }" />
              </div>
            </div>
            <div v-if="aiPanelOpen" class="card-body">
              <div v-if="aiLoading" class="text-muted small d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                A analisar os dados de todos os períodos...
              </div>
              <div v-else-if="aiError" class="text-danger small">{{ aiError }}</div>
              <div v-else-if="aiAnalysis">
                <p class="text-body mb-3" style="line-height:1.7">{{ aiAnalysis }}</p>
                <div class="text-muted small">{{ aiGeneratedAt }}</div>
              </div>
              <div v-else class="text-muted small">
                Clica em <strong>Analisar</strong> para gerar um resumo executivo comparativo com IA.
              </div>
              <div class="mt-3 d-flex gap-2 flex-wrap">
                <button v-if="!aiLoading" class="btn btn-sm btn-purple" @click="generateAI">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                  {{ aiAnalysis ? 'Regenerar' : 'Analisar' }}
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="openSaveModal">
                  <IconBookmark size="14" class="me-1" /> Guardar análise
                </button>
                <button v-if="hasResults" class="btn btn-sm btn-outline-secondary" @click="exportExcel">
                  <IconFileTypeXls size="14" class="me-1" /> Excel
                </button>
              </div>
            </div>
          </div>

          <!-- ── TABELA DE COMPARAÇÃO ─────────────────────────────────── -->
          <div v-if="hasResults" ref="tableEl">

            <!-- KPIs -->
            <div class="card mb-4">
              <div class="card-header">
                <h3 class="card-title"><IconChartBar size="16" class="me-2 text-muted"/>Resumo Comparativo</h3>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-vcenter table-bordered mb-0" style="font-size:.875rem; min-width:600px">
                    <thead class="table-light">
                      <tr>
                        <th style="min-width:200px">Métrica</th>
                        <template v-for="(p, i) in loadedPeriods" :key="p.id">
                          <th class="text-center" :style="`color:${periodColor(i)}`">
                            {{ p.name || periodLabel(i) }}
                            <div class="text-muted fw-normal" style="font-size:.7rem">{{ p.start }} → {{ p.end }}</div>
                          </th>
                          <th v-if="i < loadedPeriods.length - 1" class="text-center text-muted" style="min-width:110px; font-size:.75rem; background:#f8f9fa">
                            Δ {{ shortLabel(i) }}→{{ shortLabel(i+1) }}
                          </th>
                        </template>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="metric in kpiMetrics" :key="metric.key" :class="metric.separator ? 'table-light' : ''">
                        <td class="fw-medium ps-3" :class="metric.indent ? 'text-muted ps-4' : ''" style="font-size:.8rem">
                          {{ metric.label }}
                        </td>
                        <template v-for="(p, i) in loadedPeriods" :key="p.id">
                          <td class="text-end fw-medium">
                            {{ metric.format === 'money' ? toMoney(getMetric(p.data, metric.key)) : fmtNum(getMetric(p.data, metric.key)) }}
                          </td>
                          <td v-if="i < loadedPeriods.length - 1" class="text-center" style="background:#fafafa">
                            <DeltaCell :a="getMetric(loadedPeriods[i].data, metric.key)" :b="getMetric(loadedPeriods[i+1].data, metric.key)" :is-money="metric.format === 'money'" :invert="metric.invertDelta" />
                          </td>
                        </template>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Cursos -->
            <div v-if="activeSection('courses')" class="card mb-4">
              <div class="card-header">
                <h3 class="card-title"><IconBook size="16" class="me-2 text-muted"/>Cursos por Período</h3>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-vcenter table-bordered table-striped mb-0" style="font-size:.85rem; min-width:600px">
                    <thead class="table-light">
                      <tr>
                        <th style="min-width:180px">Curso</th>
                        <template v-for="(p, i) in loadedPeriods" :key="p.id">
                          <th class="text-center" :style="`color:${periodColor(i)}`">{{ p.name || periodLabel(i) }}<br/><span class="fw-normal text-muted" style="font-size:.7rem">Vendas / Receita / Dev.</span></th>
                          <th v-if="i < loadedPeriods.length - 1" class="text-center text-muted" style="font-size:.75rem; background:#f8f9fa; min-width:80px">Δ Receita</th>
                        </template>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="course in allCourses" :key="course">
                        <td class="ps-3 fw-medium">{{ course }}</td>
                        <template v-for="(p, i) in loadedPeriods" :key="p.id">
                          <td class="text-center">
                            <template v-if="getCourse(p.data, course)">
                              <span>{{ getCourse(p.data, course).sales }}</span>
                              <span class="text-muted mx-1">·</span>
                              <span>{{ toMoney(getCourse(p.data, course).revenue) }}</span>
                              <span class="text-muted mx-1">·</span>
                              <span class="text-orange">{{ getCourse(p.data, course).refunds_count ?? 0 }}</span>
                            </template>
                            <span v-else class="text-muted">—</span>
                          </td>
                          <td v-if="i < loadedPeriods.length - 1" class="text-center" style="background:#fafafa">
                            <DeltaCell
                              :a="getCourse(loadedPeriods[i].data, course)?.revenue ?? 0"
                              :b="getCourse(loadedPeriods[i+1].data, course)?.revenue ?? 0"
                              :is-money="true"
                            />
                          </td>
                        </template>
                      </tr>
                      <tr v-if="!allCourses.length">
                        <td :colspan="loadedPeriods.length * 2" class="text-center text-muted py-3">Sem dados de cursos nos períodos seleccionados.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Influenciadores -->
            <div v-if="activeSection('influencers')" class="card mb-4">
              <div class="card-header">
                <h3 class="card-title"><IconStar size="16" class="me-2 text-muted"/>Influenciadores por Período</h3>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-vcenter table-bordered table-striped mb-0" style="font-size:.85rem; min-width:600px">
                    <thead class="table-light">
                      <tr>
                        <th style="min-width:180px">Influenciador</th>
                        <template v-for="(p, i) in loadedPeriods" :key="p.id">
                          <th class="text-center" :style="`color:${periodColor(i)}`">{{ p.name || periodLabel(i) }}<br/><span class="fw-normal text-muted" style="font-size:.7rem">Vendas / Receita / Comissão</span></th>
                          <th v-if="i < loadedPeriods.length - 1" class="text-center text-muted" style="font-size:.75rem; background:#f8f9fa; min-width:80px">Δ Receita</th>
                        </template>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="inf in allInfluencers" :key="inf">
                        <td class="ps-3 fw-medium">{{ inf }}</td>
                        <template v-for="(p, i) in loadedPeriods" :key="p.id">
                          <td class="text-center">
                            <template v-if="getInfluencer(p.data, inf)">
                              <span>{{ getInfluencer(p.data, inf).sales }}</span>
                              <span class="text-muted mx-1">·</span>
                              <span>{{ toMoney(getInfluencer(p.data, inf).revenue) }}</span>
                              <span class="text-muted mx-1">·</span>
                              <span class="text-purple">{{ toMoney(getInfluencer(p.data, inf).influencerCommissionReceiver ?? 0) }}</span>
                            </template>
                            <span v-else class="text-muted">—</span>
                          </td>
                          <td v-if="i < loadedPeriods.length - 1" class="text-center" style="background:#fafafa">
                            <DeltaCell
                              :a="getInfluencer(loadedPeriods[i].data, inf)?.revenue ?? 0"
                              :b="getInfluencer(loadedPeriods[i+1].data, inf)?.revenue ?? 0"
                              :is-money="true"
                            />
                          </td>
                        </template>
                      </tr>
                      <tr v-if="!allInfluencers.length">
                        <td :colspan="loadedPeriods.length * 2" class="text-center text-muted py-3">Sem dados de influenciadores nos períodos seleccionados.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Diário -->
            <template v-if="activeSection('daily')">
            <div v-for="(p, i) in loadedPeriods" :key="`daily-${p.id}`" class="card mb-4">
              <div class="card-header" :style="`border-left: 4px solid ${periodColor(i)}`">
                <h3 class="card-title">
                  <IconCalendarStats size="16" class="me-2 text-muted"/>
                  Vendas Diárias — {{ p.name || periodLabel(i) }}
                </h3>
                <div class="card-options"><span class="text-muted small">{{ p.start }} → {{ p.end }}</span></div>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-vcenter table-striped table-bordered mb-0" style="font-size:.8rem">
                    <thead><tr>
                      <th>Dia</th>
                      <th class="text-end">Vendas</th>
                      <th class="text-end">Receita</th>
                      <th class="text-end">Resultado</th>
                      <th class="text-end text-orange">Dev.</th>
                    </tr></thead>
                    <tbody>
                      <tr v-for="r in p.data?.dayReport?.report ?? []" :key="r.day">
                        <td>{{ toDate(r.day) }}</td>
                        <td class="text-end">{{ r.sales }}</td>
                        <td class="text-end">{{ toMoney(r.revenue) }}</td>
                        <td class="text-end fw-medium">{{ toMoney(r.result) }}</td>
                        <td class="text-end text-orange">{{ r.refunds_count ?? 0 }}</td>
                      </tr>
                      <tr v-if="!p.data?.dayReport?.report?.length">
                        <td colspan="5" class="text-center text-muted py-2">Sem dados diários.</td>
                      </tr>
                    </tbody>
                    <tfoot v-if="p.data?.dayReport?.total" class="fw-bold">
                      <tr>
                        <td>TOTAL</td>
                        <td class="text-end">{{ p.data.dayReport.total.sales }}</td>
                        <td class="text-end">{{ toMoney(p.data.dayReport.total.revenue) }}</td>
                        <td class="text-end">{{ toMoney(p.data.dayReport.total.result) }}</td>
                        <td class="text-end text-orange">{{ p.data.dayReport.total.refunds_count ?? 0 }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            </template>

            <!-- Mensal -->
            <template v-if="activeSection('monthly')">
            <div v-for="(p, i) in loadedPeriods" :key="`monthly-${p.id}`" class="card mb-4">
              <div class="card-header" :style="`border-left: 4px solid ${periodColor(i)}`">
                <h3 class="card-title">
                  <IconCalendar size="16" class="me-2 text-muted"/>
                  Vendas Mensais — {{ p.name || periodLabel(i) }}
                </h3>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-vcenter table-striped table-bordered mb-0" style="font-size:.8rem">
                    <thead><tr>
                      <th>Mês</th>
                      <th class="text-end">Vendas</th>
                      <th class="text-end">Receita</th>
                      <th class="text-end">Resultado</th>
                      <th class="text-end text-orange">Dev.</th>
                    </tr></thead>
                    <tbody>
                      <tr v-for="r in p.data?.monthReport?.report ?? []" :key="`${r.year}-${r.month_number}`">
                        <td>{{ r.month }} {{ r.year }}</td>
                        <td class="text-end">{{ r.sales }}</td>
                        <td class="text-end">{{ toMoney(r.revenue) }}</td>
                        <td class="text-end fw-medium">{{ toMoney(r.result) }}</td>
                        <td class="text-end text-orange">{{ r.refunds_count ?? 0 }}</td>
                      </tr>
                      <tr v-if="!p.data?.monthReport?.report?.length">
                        <td colspan="5" class="text-center text-muted py-2">Sem dados mensais.</td>
                      </tr>
                    </tbody>
                    <tfoot v-if="p.data?.monthReport?.total" class="fw-bold">
                      <tr>
                        <td>TOTAL</td>
                        <td class="text-end">{{ p.data.monthReport.total.sales }}</td>
                        <td class="text-end">{{ toMoney(p.data.monthReport.total.revenue) }}</td>
                        <td class="text-end">{{ toMoney(p.data.monthReport.total.result) }}</td>
                        <td class="text-end text-orange">{{ p.data.monthReport.total.refunds_count ?? 0 }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            </template>

          </div>

          <!-- Estado vazio -->
          <div v-if="!hasResults && !loadingAny" class="text-center py-5 text-muted">
            <IconArrowsExchange size="40" class="mb-2 opacity-50" />
            <div>Configure os períodos acima e clica em <strong>Carregar Dados</strong> para gerar o comparativo.</div>
          </div>

        </div>

        <!-- ══ TAB: ANÁLISES GUARDADAS ════════════════════════════════ -->
        <div v-if="activeTab === 'guardadas'">
          <div v-if="savedLoading" class="text-center py-5">
            <div class="spinner-border" role="status"></div>
          </div>
          <div v-else-if="savedError" class="alert alert-danger">{{ savedError }}</div>
          <div v-else-if="!savedList.length" class="text-center py-5 text-muted">
            <IconBookmark size="40" class="mb-2 opacity-50" />
            <div>Ainda não tens análises guardadas.<br/>
              <button class="btn btn-sm btn-outline-secondary mt-2" @click="activeTab = 'comparativo'">Criar um comparativo</button>
            </div>
          </div>
          <div v-else class="row g-3">
            <div v-for="s in savedList" :key="s.id" class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex align-items-start mb-2">
                    <div class="flex-grow-1">
                      <div class="fw-semibold">{{ s.name }}</div>
                      <div class="text-muted small">{{ formatSavedDate(s.created_at) }}</div>
                    </div>
                    <button class="btn btn-ghost-danger btn-sm p-1" @click="deleteSaved(s.id)" title="Eliminar">
                      <IconTrash size="14" />
                    </button>
                  </div>
                  <div class="mb-2">
                    <template v-for="(pc, i) in (s.periods_config || [])" :key="i">
                      <span class="badge me-1 mb-1" :style="`background:${periodColor(i)}20; color:${periodColor(i)}`">
                        {{ pc.name || periodLabel(i) }}: {{ pc.start }} → {{ pc.end }}
                      </span>
                    </template>
                  </div>
                  <div v-if="s.ai_analysis" class="text-muted small mb-3" style="line-height:1.5; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
                    {{ s.ai_analysis }}
                  </div>
                </div>
                <div class="card-footer d-flex gap-2">
                  <button class="btn btn-sm btn-primary flex-grow-1" @click="loadSaved(s)" :disabled="s._loading">
                    <span v-if="s._loading" class="spinner-border spinner-border-sm me-1"></span>
                    <IconRefresh v-else size="14" class="me-1" />
                    Ver actualizado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </template>
  </div>

  <!-- ── MODAL: GUARDAR ANÁLISE ──────────────────────────────────────── -->
  <div v-if="saveModal" class="modal d-block" style="background:rgba(0,0,0,.5)" @click.self="saveModal = false">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><IconBookmark size="18" class="me-2" />Guardar Análise</h5>
          <button class="btn-close" @click="saveModal = false"></button>
        </div>
        <div class="modal-body">
          <label class="form-label">Nome da análise</label>
          <input
            type="text"
            class="form-control"
            v-model="saveName"
            :placeholder="`Análise ${new Date().toLocaleDateString('pt-PT')}`"
            @keydown.enter="confirmSave"
          />
          <div class="text-muted small mt-2">
            Se não preencheres, será guardada com a data de hoje.
          </div>
          <div v-if="saveError" class="alert alert-danger py-2 px-3 small mt-2 mb-0">{{ saveError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost-secondary" @click="saveModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="confirmSave" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            Guardar
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  IconShieldLock, IconShieldOff, IconDatabase, IconCheck, IconX, IconAlertTriangle,
  IconArrowsExchange, IconBookmark, IconAdjustments, IconPlus, IconRefresh,
  IconChartBar, IconBook, IconStar, IconCalendarStats, IconCalendar,
  IconChevronDown, IconTrash, IconFileTypeXls, IconCircleCheck,
} from '@tabler/icons-vue'
import { ComparisonService } from '../../domain/service/ComparisonService'
import * as XLSX from 'xlsx'

// ── Consentimento ──────────────────────────────────────────────────────
const consentGiven = ref(false)

// ── Tabs ───────────────────────────────────────────────────────────────
const activeTab = ref<'comparativo' | 'guardadas'>('comparativo')

// ── Cores e labels dos períodos ────────────────────────────────────────
const PERIOD_COLORS = ['#206bc4', '#ae3ec9', '#2fb344', '#f76707', '#e53935', '#00b4b4']
const periodColor = (i: number) => PERIOD_COLORS[i % PERIOD_COLORS.length]
const periodLabel = (i: number) => `Período ${String.fromCharCode(65 + i)}`
const shortLabel  = (i: number) => String.fromCharCode(65 + i)

// ── Secções configuráveis ──────────────────────────────────────────────
const sections = reactive([
  { key: 'courses',     label: 'Cursos',          active: true  },
  { key: 'influencers', label: 'Influenciadores',  active: true  },
  { key: 'daily',       label: 'Diário',           active: false },
  { key: 'monthly',     label: 'Mensal',           active: false },
])
const activeSection = (key: string) => sections.find(s => s.key === key)?.active

// ── Períodos ──────────────────────────────────────────────────────────
let _idCounter = 0
function makePeriod() {
  return { id: ++_idCounter, name: '', start: '', end: '', data: null as any, loading: false, error: null as string | null }
}

const periods = ref([makePeriod(), makePeriod()])

function addPeriod() { periods.value.push(makePeriod()) }
function removePeriod(i: number) { periods.value.splice(i, 1) }

const canLoad = computed(() => periods.value.every(p => p.start && p.end))
const loadingAny = computed(() => periods.value.some(p => p.loading))
const loadedPeriods = computed(() => periods.value.filter(p => p.data))
const hasResults = computed(() => loadedPeriods.value.length >= 2)

// ── Carregar todos os períodos ─────────────────────────────────────────
async function loadAll() {
  aiAnalysis.value = null
  aiError.value    = null

  await Promise.all(periods.value.map(async p => {
    if (!p.start || !p.end) return
    p.loading = true
    p.error   = null
    p.data    = null
    try {
      const res = await ComparisonService.loadPeriod(p.start, p.end)
      p.data = (res as any).data || null
    } catch {
      p.error = 'Erro ao carregar dados.'
    } finally {
      p.loading = false
    }
  }))
}

function clearResults() {
  periods.value.forEach(p => { p.data = null; p.error = null })
  aiAnalysis.value = null
}

// ── KPI Metrics ───────────────────────────────────────────────────────
const kpiMetrics = [
  { key: 'total_orders',          label: 'Total Pedidos',           format: 'number' },
  { key: 'total_payments',        label: 'Pagamentos Bem Sucedidos', format: 'number' },
  { key: 'total_revenue',         label: 'Receita Bruta',           format: 'money'  },
  { key: 'net_revenue',           label: 'Receita Líquida',         format: 'money'  },
  { key: 'fees',                  label: 'Encargos BIT',            format: 'money',  invertDelta: true },
  { key: 'commissions',           label: 'Comissões Parceiros',     format: 'money',  invertDelta: true },
  { key: 'resultado_treesix',     label: 'Resultado Treesix',       format: 'money'  },
  { key: 'total_refunds',         label: 'Devoluções (total)',      format: 'number', invertDelta: true },
  { key: 'approved_refunds',      label: '↳ Aprovadas',             format: 'number', invertDelta: true, indent: true },
  { key: 'approved_refunds_amount', label: '↳ Val. Devolvido',      format: 'money',  invertDelta: true, indent: true },
]

function getMetric(data: any, key: string): number {
  if (!data) return 0
  const s = data.summary || {}
  const d = data.dayReport?.total || {}
  const inf = data.influencerReport?.total || {}
  const rb = data.refundsByStatus || {}
  switch (key) {
    case 'total_orders':           return Number(s.total_orders ?? 0)
    case 'total_payments':         return Number(s.total_payments ?? 0)
    case 'total_revenue':          return Number(s.total_revenue ?? 0)
    case 'net_revenue':            return Number(s.net_revenue ?? 0)
    case 'fees':                   return Number(d.fees ?? 0)
    case 'commissions':            return Number(inf.influencerCommissionReceiver ?? 0)
    case 'resultado_treesix':      return Number(s.net_revenue ?? 0) - Number(d.fees ?? 0) - Number(inf.influencerCommissionReceiver ?? 0)
    case 'total_refunds':          return Number(s.total_refunds ?? 0)
    case 'approved_refunds':       return Number(rb.approved?.total ?? 0)
    case 'approved_refunds_amount':return Number(rb.approved?.amount ?? 0)
    default:                       return 0
  }
}

// ── Courses / Influencers helpers ─────────────────────────────────────
const allCourses = computed(() => {
  const set = new Set<string>()
  loadedPeriods.value.forEach(p => (p.data?.courseReport?.report || []).forEach((r: any) => set.add(r.course_name || `ID:${r.course_id}`)))
  return [...set]
})
const allInfluencers = computed(() => {
  const set = new Set<string>()
  loadedPeriods.value.forEach(p => (p.data?.influencerReport?.report || []).forEach((r: any) => set.add(r.influencer_name)))
  return [...set]
})
function getCourse(data: any, name: string) {
  return (data?.courseReport?.report || []).find((r: any) => (r.course_name || `ID:${r.course_id}`) === name)
}
function getInfluencer(data: any, name: string) {
  return (data?.influencerReport?.report || []).find((r: any) => r.influencer_name === name)
}

// ── IA ────────────────────────────────────────────────────────────────
const aiPanelOpen  = ref(true)
const aiLoading    = ref(false)
const aiError      = ref<string | null>(null)
const aiAnalysis   = ref<string | null>(null)
const aiGeneratedAt = ref('')

async function generateAI() {
  if (!hasResults.value) return
  aiLoading.value  = true
  aiError.value    = null
  try {
    const payload = loadedPeriods.value.map(p => ({
      period: { start: p.start, end: p.end, name: p.name || undefined },
      data:   p.data,
    }))
    const res = await ComparisonService.compare(payload)
    aiAnalysis.value    = (res as any).data?.analysis ?? null
    aiGeneratedAt.value = `Gerado em ${new Date().toLocaleString('pt-PT')}`
  } catch {
    aiError.value = 'Erro ao gerar análise. Verifica a chave ANTHROPIC_API_KEY.'
  } finally {
    aiLoading.value = false
  }
}

// ── Guardar análise ────────────────────────────────────────────────────
const saveModal  = ref(false)
const saveName   = ref('')
const saving     = ref(false)
const saveError  = ref<string | null>(null)

function openSaveModal() {
  saveName.value  = ''
  saveError.value = null
  saveModal.value = true
}

async function confirmSave() {
  saving.value = true
  try {
    const name = saveName.value.trim() || `Análise ${new Date().toLocaleDateString('pt-PT')}`
    await ComparisonService.savedAnalyses.save({
      name,
      periods_config:   loadedPeriods.value.map(p => ({ start: p.start, end: p.end, name: p.name })),
      report_snapshots: loadedPeriods.value.map(p => p.data),
      ai_analysis:      aiAnalysis.value || null,
    })
    saveModal.value = false
    // refresh saved list silently
    loadSavedList()
  } catch {
    saveError.value = 'Erro ao guardar. Tenta novamente.'
  } finally {
    saving.value = false
  }
}

// ── Análises Guardadas ─────────────────────────────────────────────────
const savedList    = ref<any[]>([])
const savedLoading = ref(false)
const savedError   = ref<string | null>(null)

async function loadSavedList() {
  savedLoading.value = true
  savedError.value   = null
  try {
    const res = await ComparisonService.savedAnalyses.list()
    savedList.value = ((res as any).data || []).map((s: any) => ({ ...s, _loading: false }))
  } catch {
    savedError.value = 'Erro ao carregar análises guardadas.'
  } finally {
    savedLoading.value = false
  }
}

function switchToSaved() {
  activeTab.value = 'guardadas'
  loadSavedList()
}

async function deleteSaved(id: number) {
  try {
    await ComparisonService.savedAnalyses.delete(id)
    savedList.value = savedList.value.filter(s => s.id !== id)
  } catch {
    savedError.value = 'Erro ao eliminar análise. Tenta novamente.'
  }
}

async function loadSaved(saved: any) {
  const idx = savedList.value.findIndex(s => s.id === saved.id)
  if (idx !== -1) savedList.value[idx]._loading = true
  activeTab.value = 'comparativo'

  const configs: Array<{ start: string; end: string; name?: string }> = saved.periods_config || []

  // Rebuild periods array from saved config
  periods.value = configs.map(c => ({
    id:      ++_idCounter,
    name:    c.name || '',
    start:   c.start,
    end:     c.end,
    data:    null,
    loading: false,
    error:   null,
  }))

  // Load fresh data
  await loadAll()

  // Show saved AI analysis
  if (saved.ai_analysis) {
    aiAnalysis.value    = saved.ai_analysis
    aiGeneratedAt.value = `Análise original guardada em ${formatSavedDate(saved.created_at)}`
  }

  if (idx !== -1) savedList.value[idx]._loading = false
}

// ── Export Excel ──────────────────────────────────────────────────────
const tableEl = ref<HTMLElement | null>(null)

function exportExcel() {
  if (!hasResults.value) return
  const wb = XLSX.utils.book_new()

  // Resumo comparativo
  const headers = ['Métrica', ...loadedPeriods.value.flatMap((p, i) => {
    const label = p.name || periodLabel(i)
    return i < loadedPeriods.value.length - 1 ? [label, `Δ ${shortLabel(i)}→${shortLabel(i+1)}`] : [label]
  })]

  const rows = kpiMetrics.map(m => {
    const row: any = { Métrica: m.label }
    loadedPeriods.value.forEach((p, i) => {
      const label = p.name || periodLabel(i)
      row[label] = getMetric(p.data, m.key)
      if (i < loadedPeriods.value.length - 1) {
        const a = getMetric(p.data, m.key)
        const b = getMetric(loadedPeriods.value[i + 1].data, m.key)
        const pct = a !== 0 ? ((b - a) / Math.abs(a) * 100).toFixed(1) + '%' : '—'
        row[`Δ ${shortLabel(i)}→${shortLabel(i+1)}`] = `${b >= a ? '+' : ''}${(b - a).toFixed(2)} (${pct})`
      }
    })
    return row
  })

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows, { header: headers }), 'Comparativo')

  if (aiAnalysis.value) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ 'Análise IA': aiAnalysis.value }]), 'Análise IA')
  }

  XLSX.writeFile(wb, 'comparativo-periodos.xlsx')
}

// ── Formatters ─────────────────────────────────────────────────────────
const toMoney = (v: number | string) => {
  const num = typeof v === 'string' ? parseFloat(v) : v
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num || 0)
}
const fmtNum = (v: number) => new Intl.NumberFormat('pt-PT').format(v || 0)
const toDate = (v: string) => {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const formatSavedDate = (v: string) => new Date(v).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })
</script>

<!-- ── Componente inline: célula de delta ──────────────────────────── -->
<script lang="ts">
import { defineComponent, computed, h } from 'vue'

const DeltaCell = defineComponent({
  name: 'DeltaCell',
  props: {
    a:       { type: Number, default: 0 },
    b:       { type: Number, default: 0 },
    isMoney: { type: Boolean, default: false },
    invert:  { type: Boolean, default: false },
  },
  setup(props) {
    const diff = computed(() => props.b - props.a)
    const pct  = computed(() => props.a !== 0 ? ((diff.value / Math.abs(props.a)) * 100) : null)
    const up   = computed(() => props.invert ? diff.value < 0 : diff.value > 0)
    const down = computed(() => props.invert ? diff.value > 0 : diff.value < 0)

    return () => {
      if (diff.value === 0) return h('span', { class: 'text-muted small' }, '=')
      const color = up.value ? 'text-success' : 'text-danger'
      const arrow = up.value ? '↑' : '↓'
      const fmtDiff = props.isMoney
        ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Math.abs(diff.value))
        : new Intl.NumberFormat('pt-PT').format(Math.abs(diff.value))
      const pctStr = pct.value !== null ? ` (${pct.value > 0 ? '+' : ''}${pct.value.toFixed(1)}%)` : ''
      return h('span', { class: `small fw-medium ${color}` }, `${arrow} ${fmtDiff}${pctStr}`)
    }
  },
})

export { DeltaCell }
</script>
