<!--
 - Copyright © 2021 - 2025
 - Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <!-- Header -->
      <div class="row g-2 align-items-center mb-3">
        <div class="col">
          <div class="page-pretitle">Financeiro</div>
          <h2 class="page-title">Repasses &amp; Saldo</h2>
        </div>
        <div class="col-auto ms-auto d-print-none d-flex gap-2">
          <button class="btn btn-secondary" @click="refresh" :disabled="loading || txLoading">
            <IconRefresh size="16" :class="['me-1', (loading || txLoading) ? 'spin' : '']" /> Atualizar
          </button>
          <button v-if="activeTab === 'repasses'" class="btn btn-primary" @click="openCreate">
            <IconPlus size="16" class="me-1" /> Novo Repasse
          </button>
          <button v-else class="btn btn-primary" @click="openManual">
            <IconPlus size="16" class="me-1" /> Nova Transação
          </button>
        </div>
      </div>

      <!-- Balance KPI cards — row 1 -->
      <div class="row row-cards mb-2">
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="subheader">Total Cobrado</div>
              <div class="h1 mt-1 text-blue">{{ toMoney(balance.total_collected) }}</div>
              <div class="text-muted small">Pagamentos recebidos via AppyPay</div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="subheader">Total Devoluções</div>
              <div class="h1 mt-1 text-red">{{ toMoney(balance.total_refunds) }}</div>
              <div class="text-muted small">Reembolsos aprovados</div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="subheader">Saldo Disponível</div>
              <div class="h1 mt-1" :class="balance.available_to_repass >= 0 ? 'text-green' : 'text-red'">
                {{ toMoney(balance.available_to_repass) }}
              </div>
              <div class="text-muted small">
                {{ balance.pending_count > 0 ? `${balance.pending_count} repasse(s) pendente(s)` : 'Sem pendentes' }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="card">
            <div class="card-body">
              <div class="subheader">Pendente de Pagamento</div>
              <div class="h1 mt-1 text-orange">{{ toMoney(balance.pending_amount) }}</div>
              <div class="text-muted small">
                {{ balance.pending_count > 0 ? `${balance.pending_count} repasse(s) por liquidar` : 'Nenhum pendente' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Balance KPI cards — row 2: three wallets -->
      <div class="row row-cards mb-3">
        <div class="col-sm-4">
          <div class="card border-blue-lt">
            <div class="card-body">
              <div class="d-flex align-items-center gap-2 mb-1">
                <IconBuildingBank size="18" class="text-blue" />
                <div class="subheader mb-0">Carteira Treesix</div>
              </div>
              <div class="h2 mt-1 text-blue">{{ toMoney(balance.treesix_paid) }}</div>
              <div class="text-muted small">
                Saldo líquido a receber
                <span v-if="balance.treesix_pending > 0" class="badge bg-orange-lt text-orange ms-1">
                  + {{ toMoney(balance.treesix_pending) }} pendente
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card border-purple-lt">
            <div class="card-body">
              <div class="d-flex align-items-center gap-2 mb-1">
                <IconUsers size="18" class="text-purple" />
                <div class="subheader mb-0">Carteira Parceiros</div>
              </div>
              <div class="h2 mt-1 text-purple">{{ toMoney(balance.partners_paid) }}</div>
              <div class="text-muted small">
                Comissões acumuladas (por repassar)
                <span v-if="balance.partners_pending > 0" class="badge bg-orange-lt text-orange ms-1">
                  + {{ toMoney(balance.partners_pending) }} pendente
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card border-teal-lt">
            <div class="card-body">
              <div class="d-flex align-items-center gap-2 mb-1">
                <IconCoins size="18" class="text-teal" />
                <div class="subheader mb-0">Carteira Encargos</div>
              </div>
              <div class="h2 mt-1 text-teal">{{ toMoney(balance.commissions_paid) }}</div>
              <div class="text-muted small">Encargos de plataforma acumulados</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'repasses' }" role="button" @click="activeTab = 'repasses'">
            <IconArrowsTransferUp size="16" class="me-1" /> Repasses
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'transacoes' }" role="button" @click="switchToTransactions">
            <IconList size="16" class="me-1" /> Transações
          </a>
        </li>
      </ul>

      <!-- ============ TAB: REPASSES ============ -->
      <template v-if="activeTab === 'repasses'">
        <!-- Filters -->
        <div class="card mb-3">
          <div class="card-body py-2">
            <div class="row g-2 align-items-end">
              <div class="col-md-2">
                <label class="form-label">Estado</label>
                <select class="form-select form-select-sm" v-model="filters.status" @change="loadSettlements">
                  <option value="">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Tipo</label>
                <select class="form-select form-select-sm" v-model="filters.type" @change="loadSettlements">
                  <option value="">Todos</option>
                  <option value="general">Geral</option>
                  <option value="influencer">Influenciador</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Período (início)</label>
                <input class="form-control form-control-sm" type="date" v-model="filters.dateFrom" @change="loadSettlements" />
              </div>
              <div class="col-md-2">
                <label class="form-label">Período (fim)</label>
                <input class="form-control form-control-sm" type="date" v-model="filters.dateTo" @change="loadSettlements" />
              </div>
              <div class="col-auto ms-auto d-flex align-items-end gap-2">
                <select class="form-select form-select-sm" style="width:auto" v-model="filters.perPage" @change="filters.page=1; loadSettlements()">
                  <option :value="10">10 / pág.</option>
                  <option :value="25">25 / pág.</option>
                  <option :value="50">50 / pág.</option>
                  <option :value="100">100 / pág.</option>
                </select>
                <button class="btn btn-sm btn-secondary" @click="clearFilters">Limpar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="card">
          <div class="card-body p-0">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border" role="status"></div>
            </div>
            <div v-else-if="error" class="alert alert-danger m-3">{{ error }}</div>
            <div v-else class="table-responsive">
              <table class="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Tipo / Período</th>
                    <th>Vendas Brutas</th>
                    <th>Devoluções</th>
                    <th>Vendas Líquidas</th>
                    <th>Encargos (%)</th>
                    <th>Comissões</th>
                    <th class="text-success">Repasse</th>
                    <th>Referência</th>
                    <th class="w-1"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="settlements.length === 0">
                    <td colspan="10" class="text-center text-muted py-4">Nenhum repasse encontrado</td>
                  </tr>
                  <tr v-for="s in settlements" :key="s.id">
                    <td>
                      <span v-if="s.status === 'pending'" class="badge bg-orange text-white">Pendente</span>
                      <span v-else-if="s.status === 'paid'" class="badge bg-green text-white">Pago</span>
                    </td>
                    <td>
                      <div class="d-flex flex-column gap-1">
                        <div>
                          <span v-if="s.type === 'general'" class="badge bg-blue-lt text-blue">Geral</span>
                          <span v-else-if="s.type === 'influencer'" class="badge bg-purple-lt text-purple">
                            {{ s.influencer?.name || `Influencer #${s.influencer_id}` }}
                          </span>
                        </div>
                        <small class="text-muted">{{ formatDateOnly(s.period_start) }} — {{ formatDateOnly(s.period_end) }}</small>
                      </div>
                    </td>
                    <td>{{ toMoney(s.total_sales) }}</td>
                    <td>
                      <span v-if="s.total_refunds_count > 0" class="text-danger">
                        -{{ toMoney(s.total_refunds_amount) }}
                        <small class="d-block text-muted">({{ s.total_refunds_count }} dev.)</small>
                      </span>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td>{{ toMoney(s.net_sales ?? (s.total_sales - (s.total_refunds_amount || 0))) }}</td>
                    <td class="text-danger">-{{ toMoney(s.total_fees) }}</td>
                    <td class="text-danger">
                      <span v-if="s.total_commissions > 0">-{{ toMoney(s.total_commissions) }}</span>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td class="fw-bold text-success">{{ toMoney(s.amount) }}</td>
                    <td>{{ s.reference || '-' }}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button
                          v-if="s.status === 'pending'"
                          class="btn btn-sm btn-success"
                          @click="openMarkPaid(s)"
                          title="Marcar como Pago"
                        >
                          <IconCheck size="14" />
                        </button>
                        <button
                          v-if="s.status === 'paid'"
                          class="btn btn-sm btn-info"
                          @click="openProof(s)"
                          title="Ver Comprovativo"
                        >
                          <IconPhoto size="14" />
                        </button>
                        <button
                          class="btn btn-sm btn-ghost-danger"
                          @click="deleteSettlement(s.id)"
                          title="Eliminar"
                        >
                          <IconTrash size="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.total > 0" class="card-footer d-flex align-items-center">
              <p class="m-0 text-secondary small">
                {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }}
              </p>
              <ul class="pagination pagination-sm m-0 ms-auto">
                <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                  <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page - 1)">‹</a>
                </li>
                <template v-for="p in pageWindow(pagination.current_page, pagination.last_page)" :key="p">
                  <li v-if="p === '...'" class="page-item disabled"><span class="page-link">…</span></li>
                  <li v-else class="page-item" :class="{ active: p === pagination.current_page }">
                    <a class="page-link" href="#" @click.prevent="changePage(Number(p))">{{ p }}</a>
                  </li>
                </template>
                <li class="page-item" :class="{ disabled: pagination.current_page === pagination.last_page }">
                  <a class="page-link" href="#" @click.prevent="changePage(pagination.current_page + 1)">›</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>

      <!-- ============ TAB: TRANSAÇÕES ============ -->
      <template v-if="activeTab === 'transacoes'">
        <!-- Filters -->
        <div class="card mb-3">
          <div class="card-body py-2">
            <div class="row g-2 align-items-end">
              <div class="col-md-2">
                <label class="form-label">Conta</label>
                <select class="form-select form-select-sm" v-model="txFilters.account" @change="onAccountChange">
                  <option value="">Todas</option>
                  <option value="treesix">Treesix</option>
                  <option value="partners">Parceiros</option>
                  <option value="commissions">Encargos</option>
                  <option value="clients">Clientes</option>
                  <option value="settled">Liquidado</option>
                </select>
              </div>
              <div class="col-md-2" v-if="txFilters.account === 'partners'">
                <label class="form-label">Parceiro</label>
                <select class="form-select form-select-sm" v-model="txFilters.influencer_id" @change="loadTransactions">
                  <option value="">Todos</option>
                  <option v-for="inf in influencers" :key="inf.id" :value="inf.id">{{ inf.name }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Tipo</label>
                <select class="form-select form-select-sm" v-model="txFilters.type" @change="loadTransactions">
                  <option value="">Todos</option>
                  <option value="payment">Pagamento</option>
                  <option value="settlement">Repasse</option>
                  <option value="refund">Devolução</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Data início</label>
                <input class="form-control form-control-sm" type="date" v-model="txFilters.dateFrom" @change="loadTransactions" />
              </div>
              <div class="col-md-2">
                <label class="form-label">Data fim</label>
                <input class="form-control form-control-sm" type="date" v-model="txFilters.dateTo" @change="loadTransactions" />
              </div>
              <div class="col-12"><hr class="my-1" /></div>
              <div class="col-md-2">
                <label class="form-label">Origem</label>
                <select class="form-select form-select-sm" v-model="txFilters.from_account" @change="txFilters.page=1; loadTransactions()">
                  <option value="">Todas</option>
                  <option value="clients">Clientes</option>
                  <option value="treesix">Treesix</option>
                  <option value="partners">Parceiros</option>
                  <option value="commissions">Encargos</option>
                  <option value="settled">Liquidado</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Destino</label>
                <select class="form-select form-select-sm" v-model="txFilters.to_account" @change="txFilters.page=1; loadTransactions()">
                  <option value="">Todos</option>
                  <option value="clients">Clientes</option>
                  <option value="treesix">Treesix</option>
                  <option value="partners">Parceiros</option>
                  <option value="commissions">Encargos</option>
                  <option value="settled">Liquidado</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Descrição</label>
                <input class="form-control form-control-sm" type="text" v-model="txFilters.description" @keyup.enter="txFilters.page=1; loadTransactions()" placeholder="Pesquisar descrição..." />
              </div>
              <div class="col-md-1">
                <label class="form-label">Valor mín.</label>
                <input class="form-control form-control-sm" type="number" step="0.01" min="0" v-model.number="txFilters.amountMin" @change="txFilters.page=1; loadTransactions()" placeholder="0.00" />
              </div>
              <div class="col-md-1">
                <label class="form-label">Valor máx.</label>
                <input class="form-control form-control-sm" type="number" step="0.01" min="0" v-model.number="txFilters.amountMax" @change="txFilters.page=1; loadTransactions()" placeholder="0.00" />
              </div>
              <div class="col-md-1">
                <label class="form-label">Saldo mín.</label>
                <input class="form-control form-control-sm" type="number" step="0.01" v-model.number="txFilters.balanceMin" @change="txFilters.page=1; loadTransactions()" placeholder="0.00" />
              </div>
              <div class="col-md-1">
                <label class="form-label">Saldo máx.</label>
                <input class="form-control form-control-sm" type="number" step="0.01" v-model.number="txFilters.balanceMax" @change="txFilters.page=1; loadTransactions()" placeholder="0.00" />
              </div>
              <div class="col-auto ms-auto d-flex align-items-end gap-2">
                <select class="form-select form-select-sm" style="width:auto" v-model="txFilters.perPage" @change="txFilters.page=1; loadTransactions()">
                  <option :value="20">20 / pág.</option>
                  <option :value="50">50 / pág.</option>
                  <option :value="100">100 / pág.</option>
                </select>
                <button class="btn btn-sm btn-secondary" @click="clearTxFilters">Limpar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions table -->
        <div class="card">
          <div class="card-body p-0">
            <div v-if="txLoading" class="text-center py-5">
              <div class="spinner-border" role="status"></div>
            </div>
            <div v-else-if="txError" class="alert alert-danger m-3">{{ txError }}</div>
            <div v-else class="table-responsive">
              <table class="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th class="text-muted" style="width:50px">#</th>
                    <th>Data / Hora</th>
                    <th>Tipo</th>
                    <th>Origem</th>
                    <th>Destino</th>
                    <th>Valor</th>
                    <th>Saldo Após{{ txFilters.account ? ` (${accountLabel(txFilters.account)})` : '' }}</th>
                    <th>Descrição</th>
                    <th>Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="transactions.length === 0">
                    <td colspan="9" class="text-center text-muted py-4">Nenhuma transação encontrada</td>
                  </tr>
                  <tr v-for="tx in transactions" :key="tx.id">
                    <td class="text-muted"><small>{{ tx.id }}</small></td>
                    <td>
                      <div>{{ formatDateOnly(tx.created_at) }}</div>
                      <small class="text-muted">{{ formatTime(tx.created_at) }}</small>
                    </td>
                    <td>
                      <span class="badge" :class="txTypeBadge(tx.reference_type)">{{ txTypeLabel(tx.reference_type) }}</span>
                    </td>
                    <td><span :class="accountBadgeClass(tx.from_account)">{{ accountLabel(tx.from_account) }}</span></td>
                    <td><span :class="accountBadgeClass(tx.to_account)">{{ accountLabel(tx.to_account) }}</span></td>
                    <td class="fw-semibold">{{ toMoney(tx.amount) }}</td>
                    <td class="text-muted">{{ toMoney(tx.balance_after) }}</td>
                    <td>
                      <span class="text-truncate d-inline-block" style="max-width:200px" :title="tx.description">
                        {{ tx.description || '—' }}
                      </span>
                    </td>
                    <td>
                      <small v-if="tx.reference_id" class="text-muted">#{{ tx.reference_id }}</small>
                      <span v-else class="text-muted">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="txPagination.total > 0" class="card-footer d-flex align-items-center">
              <p class="m-0 text-secondary small">
                {{ txPagination.from }}–{{ txPagination.to }} de {{ txPagination.total }}
              </p>
              <ul class="pagination pagination-sm m-0 ms-auto">
                <li class="page-item" :class="{ disabled: txPagination.current_page === 1 }">
                  <a class="page-link" href="#" @click.prevent="changeTxPage(txPagination.current_page - 1)">‹</a>
                </li>
                <template v-for="p in pageWindow(txPagination.current_page, txPagination.last_page)" :key="p">
                  <li v-if="p === '...'" class="page-item disabled"><span class="page-link">…</span></li>
                  <li v-else class="page-item" :class="{ active: p === txPagination.current_page }">
                    <a class="page-link" href="#" @click.prevent="changeTxPage(Number(p))">{{ p }}</a>
                  </li>
                </template>
                <li class="page-item" :class="{ disabled: txPagination.current_page === txPagination.last_page }">
                  <a class="page-link" href="#" @click.prevent="changeTxPage(txPagination.current_page + 1)">›</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ==================== Create / Calculate Modal ==================== -->
    <div v-if="showCreateModal" class="modal modal-blur show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Novo Repasse</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <!-- Type -->
              <div class="col-md-4">
                <label class="form-label required">Tipo de Repasse</label>
                <select class="form-select" v-model="createForm.type" @change="calculated = null; calculatedInfluencers = []">
                  <option value="general">Geral (Treesix)</option>
                  <option value="influencer">Influenciadores</option>
                </select>
              </div>

              <!-- Period start -->
              <div class="col-md-4">
                <label class="form-label required">Período (início)</label>
                <input class="form-control" type="date" v-model="createForm.period_start" @change="calculated = null; calculatedInfluencers = []" />
              </div>

              <!-- Period end -->
              <div class="col-md-4">
                <label class="form-label required">Período (fim)</label>
                <input class="form-control" type="date" v-model="createForm.period_end" @change="calculated = null; calculatedInfluencers = []" />
              </div>

              <!-- Calculate button -->
              <div class="col-12">
                <button
                  class="btn btn-secondary"
                  @click="submitCalculate"
                  :disabled="calculateLoading || !createForm.period_start || !createForm.period_end"
                >
                  <span v-if="calculateLoading" class="spinner-border spinner-border-sm me-1"></span>
                  <IconCalculator size="16" class="me-1" v-else />
                  Calcular
                </button>
              </div>

              <!-- GERAL: resultado único -->
              <template v-if="createForm.type === 'general' && calculated">
                <div class="col-12">
                  <div class="card border-0 bg-secondary-lt">
                    <div class="card-body py-3">
                      <div class="d-flex flex-column gap-2">
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Vendas brutas</span>
                          <span class="fw-semibold">{{ toMoney(calculated.total_sales) }}</span>
                        </div>
                        <div class="d-flex justify-content-between" v-if="calculated.total_refunds_count > 0">
                          <span class="text-muted">Devoluções <small class="badge bg-red-lt text-danger ms-1">{{ calculated.total_refunds_count }}</small></span>
                          <span class="text-danger fw-semibold">-{{ toMoney(calculated.total_refunds_amount) }}</span>
                        </div>
                        <div class="d-flex justify-content-between border-top pt-2">
                          <span class="text-muted">Vendas líquidas</span>
                          <span class="fw-semibold">{{ toMoney(calculated.net_sales) }}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span class="text-muted">Encargos BIT (2%)</span>
                          <span class="text-danger fw-semibold">-{{ toMoney(calculated.total_fees) }}</span>
                        </div>
                        <div class="d-flex justify-content-between" v-if="calculated.total_commissions > 0">
                          <span class="text-muted">Comissões influencers</span>
                          <span class="text-danger fw-semibold">-{{ toMoney(calculated.total_commissions) }}</span>
                        </div>
                        <div class="d-flex justify-content-between border-top pt-2 mt-1">
                          <span class="fw-bold">Repasse Treesix</span>
                          <span class="fw-bold text-success fs-4">{{ toMoney(calculated.amount) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- INFLUENCIADORES: tabela com checkboxes -->
              <template v-if="createForm.type === 'influencer' && calculatedInfluencers.length > 0">
                <div class="col-12">
                  <div class="table-responsive">
                    <table class="table table-vcenter table-bordered mb-0">
                      <thead>
                        <tr>
                          <th style="width:36px">
                            <input type="checkbox" class="form-check-input" @change="toggleAllInfluencers($event)" :checked="calculatedInfluencers.every(i => i.selected)" />
                          </th>
                          <th>Parceiro</th>
                          <th class="text-end">Vendas Brutas</th>
                          <th class="text-end">Devoluções</th>
                          <th class="text-end">Líquidas</th>
                          <th class="text-end">Comissão</th>
                          <th class="text-end text-success">A Repassar</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in calculatedInfluencers" :key="item.influencer_id" :class="{ 'opacity-50': !item.selected }">
                          <td>
                            <input type="checkbox" class="form-check-input" v-model="item.selected" />
                          </td>
                          <td class="fw-medium">{{ item.influencer_name }}</td>
                          <td class="text-end">{{ toMoney(item.total_sales) }}</td>
                          <td class="text-end text-danger">
                            <span v-if="item.total_refunds_count > 0">-{{ toMoney(item.total_refunds_amount) }} <small class="text-muted">({{ item.total_refunds_count }})</small></span>
                            <span v-else class="text-muted">—</span>
                          </td>
                          <td class="text-end">{{ toMoney(item.net_sales) }}</td>
                          <td class="text-end text-purple">{{ item.commission_pct }}%</td>
                          <td class="text-end fw-bold text-success">{{ toMoney(item.amount) }}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr class="fw-bold">
                          <td colspan="6" class="text-end">Total seleccionado</td>
                          <td class="text-end text-success">{{ toMoney(calculatedInfluencers.filter(i => i.selected).reduce((s, i) => s + i.amount, 0)) }}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </template>

              <template v-if="createForm.type === 'influencer' && calculatedInfluencers.length === 0 && calculated !== null">
                <div class="col-12">
                  <div class="alert alert-info mb-0">Nenhum influenciador com vendas neste período.</div>
                </div>
              </template>

              <!-- Notes -->
              <div class="col-12">
                <label class="form-label">Notas</label>
                <textarea class="form-control" v-model="createForm.notes" rows="2" placeholder="Notas opcionais..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="showCreateModal = false">Cancelar</button>
            <button
              class="btn btn-primary"
              @click="submitCreate"
              :disabled="createLoading || !canSubmitCreate"
            >
              <span v-if="createLoading" class="spinner-border spinner-border-sm me-1"></span>
              {{ createForm.type === 'influencer' ? `Criar ${calculatedInfluencers.filter(i => i.selected).length} Repasse(s)` : 'Criar Repasse' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Mark as Paid Modal ==================== -->
    <div v-if="showMarkPaidModal" class="modal modal-blur show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Marcar como Pago</h5>
            <button type="button" class="btn-close" @click="showMarkPaidModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="markPaidTarget" class="alert alert-info mb-3">
              Repasse de <strong>{{ toMoney(markPaidTarget.amount) }}</strong>
              — período {{ formatDateOnly(markPaidTarget.period_start) }} a {{ formatDateOnly(markPaidTarget.period_end) }}
            </div>

            <div class="mb-3">
              <label class="form-label">Número de Referência</label>
              <input class="form-control" type="text" v-model="markPaidForm.reference" placeholder="Ex: TRF-2024-001" />
            </div>

            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea class="form-control" v-model="markPaidForm.notes" rows="2" placeholder="Notas opcionais..."></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Comprovativos de Transferência</label>
              <label class="d-block border rounded p-3 text-center"
                :class="proofDragOver ? 'border-primary bg-primary-subtle' : 'border-dashed'"
                style="cursor:pointer;transition:background .15s,border-color .15s;"
                @dragover.prevent="proofDragOver = true"
                @dragleave.prevent="proofDragOver = false"
                @drop.prevent="onProofDrop($event); proofDragOver = false">
                <IconPhoto size="20" class="text-muted mb-1" />
                <div class="text-muted small">Clique ou arraste imagens/PDFs aqui</div>
                <input class="d-none" type="file" accept="image/*,application/pdf" multiple @change="onProofFileChange" ref="proofFileInput" />
              </label>
              <div v-if="markPaidForm.proof_urls.length" class="row g-2 mt-1">
                <div v-for="(url, i) in markPaidForm.proof_urls" :key="i" class="col-4 col-md-3">
                  <div class="card position-relative" style="overflow:hidden;">
                    <div class="bg-light d-flex align-items-center justify-content-center" style="height:72px;">
                      <img v-if="isProofImage(url)" :src="url" style="width:100%;height:72px;object-fit:cover;" />
                      <div v-else class="d-flex flex-column align-items-center justify-content-center h-100">
                        <IconFileTypePdf size="26" class="text-danger" />
                        <span class="text-muted" style="font-size:10px;">PDF</span>
                      </div>
                    </div>
                    <button type="button" @click="removeProofFromForm(i)"
                      class="btn btn-danger position-absolute top-0 end-0"
                      style="width:20px;height:20px;padding:0;font-size:12px;line-height:1;border-radius:0 0 0 4px;">×</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="showMarkPaidModal = false">Cancelar</button>
            <button class="btn btn-success" @click="submitMarkPaid" :disabled="markPaidLoading">
              <span v-if="markPaidLoading" class="spinner-border spinner-border-sm me-1"></span>
              <IconCheck size="16" class="me-1" v-else />
              Confirmar Pagamento
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Proof Viewer Modal ==================== -->
    <div v-if="showProofModal" class="modal modal-blur show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title mb-0">Comprovativos</h5>
              <div class="text-muted small" v-if="proofTarget">
                {{ proofTarget.reference || 'Sem referência' }} · {{ toMoney(proofTarget.amount) }} · {{ proofTarget.paid_at ? formatDate(proofTarget.paid_at) : '-' }}
              </div>
            </div>
            <button type="button" class="btn-close" @click="showProofModal = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="proofTarget">

              <!-- Grid de comprovativos -->
              <div v-if="getProofUrls(proofTarget).length" class="row g-3">
                <div v-for="url in getProofUrls(proofTarget)" :key="url" class="col-6 col-md-4">
                  <div class="card h-100 shadow-sm">
                    <!-- Thumbnail -->
                    <div class="rounded-top overflow-hidden bg-light d-flex align-items-center justify-content-center" style="height:130px;">
                      <img v-if="isProofImage(url)" :src="proofUrl(url)" style="width:100%;height:130px;object-fit:cover;" />
                      <div v-else class="d-flex flex-column align-items-center justify-content-center text-danger">
                        <IconFileTypePdf size="44" />
                        <span class="text-muted mt-1" style="font-size:11px;">PDF</span>
                      </div>
                    </div>
                    <!-- Actions -->
                    <div class="card-footer p-2 d-flex gap-1">
                      <a :href="proofUrl(url)" target="_blank" class="btn btn-sm btn-outline-primary flex-fill" title="Abrir">
                        <IconDownload size="13" class="me-1" />Abrir
                      </a>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteProof(proofFilename(url))" title="Remover">
                        <IconTrash size="13" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Card "Adicionar" sempre no fim -->
                <div class="col-6 col-md-4">
                  <label class="card h-100 d-flex align-items-center justify-content-center text-muted"
                    :class="[{ 'opacity-50': addProofLoading }, addProofDragOver ? 'border-primary bg-primary-subtle' : 'border-dashed']"
                    style="min-height:130px;cursor:pointer;transition:background .15s,border-color .15s;"
                    @dragover.prevent="addProofDragOver = true"
                    @dragleave.prevent="addProofDragOver = false"
                    @drop.prevent="onAddProofDrop($event); addProofDragOver = false">
                    <div class="text-center">
                      <div v-if="addProofLoading" class="spinner-border spinner-border-sm mb-1"></div>
                      <IconPlus v-else size="28" class="mb-1" />
                      <div class="small">Arrastar ou clicar</div>
                    </div>
                    <input type="file" accept="image/*,application/pdf" class="d-none"
                      ref="addProofInput" @change="onAddProofFile" :disabled="addProofLoading" />
                  </label>
                </div>
              </div>

              <!-- Estado vazio -->
              <div v-else class="text-center py-4">
                <label class="d-block border rounded p-4"
                  :class="addProofDragOver ? 'border-primary bg-primary-subtle' : 'border-dashed'"
                  style="cursor:pointer;transition:background .15s,border-color .15s;"
                  @dragover.prevent="addProofDragOver = true"
                  @dragleave.prevent="addProofDragOver = false"
                  @drop.prevent="onAddProofDrop($event); addProofDragOver = false">
                  <IconFileTypePdf size="36" class="text-muted mb-2" />
                  <div class="text-muted mb-3">Sem comprovativos.</div>
                  <span class="btn btn-outline-primary" :class="{ 'disabled': addProofLoading }">
                    <IconPlus size="14" class="me-1" />
                    <span v-if="addProofLoading">A carregar...</span>
                    <span v-else>Clique ou arraste aqui</span>
                  </span>
                  <input type="file" accept="image/*,application/pdf" class="d-none"
                    @change="onAddProofFile" :disabled="addProofLoading" />
                </label>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="showProofModal = false">Fechar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Manual Transaction Modal ==================== -->
    <div v-if="showManualModal" class="modal modal-blur show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nova Transação Manual</h5>
            <button type="button" class="btn-close" @click="showManualModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label required">Direção</label>
                <select class="form-select" v-model="manualForm.direction">
                  <option value="in">Crédito (entrada)</option>
                  <option value="out">Débito (saída)</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label required">Conta</label>
                <select class="form-select" v-model="manualForm.account">
                  <option value="treesix">Carteira Treesix</option>
                  <option value="partners">Carteira Parceiros</option>
                  <option value="commissions">Carteira Encargos</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label required">Valor (Kz)</label>
                <input
                  class="form-control"
                  type="number"
                  min="0.01"
                  step="0.01"
                  v-model="manualForm.amount"
                  placeholder="0.00"
                />
              </div>
              <div class="col-12">
                <label class="form-label required">Descrição</label>
                <input
                  class="form-control"
                  type="text"
                  v-model="manualForm.description"
                  placeholder="Motivo ou descrição da transação..."
                />
              </div>
              <div class="col-12">
                <div class="alert alert-warning mb-0" role="alert">
                  <strong>Atenção:</strong> Esta transação afeta o saldo da carteira imediatamente e fica registada no histórico.
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="showManualModal = false">Cancelar</button>
            <button
              class="btn"
              :class="manualForm.direction === 'in' ? 'btn-success' : 'btn-danger'"
              @click="submitManual"
              :disabled="manualLoading || !manualForm.amount || !manualForm.description"
            >
              <span v-if="manualLoading" class="spinner-border spinner-border-sm me-1"></span>
              {{ manualForm.direction === 'in' ? 'Registar Crédito' : 'Registar Débito' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  IconPlus,
  IconCheck,
  IconTrash,
  IconCalculator,
  IconPhoto,
  IconDownload,
  IconRefresh,
  IconArrowsTransferUp,
  IconList,
  IconBuildingBank,
  IconUsers,
  IconCoins,
  IconFileTypePdf,
} from '@tabler/icons-vue'
import { SettlementsService } from '../../domain/service/SettlementsService'
import { API } from '@common/domain/services/api'

// ─── Tab ──────────────────────────────────────────────────────────────────────
const activeTab = ref<'repasses' | 'transacoes'>('repasses')

function switchToTransactions() {
  activeTab.value = 'transacoes'
  if (transactions.value.length === 0 && !txLoading.value) {
    loadTransactions()
  }
}

// ─── State ────────────────────────────────────────────────────────────────────
const settlements = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const balance = reactive({
  total_collected: 0,
  total_fees_earned: 0,
  total_repassed: 0,
  total_refunds: 0,
  available_to_repass: 0,
  pending_amount: 0,
  pending_count: 0,
  treesix_paid: 0,
  partners_paid: 0,
  commissions_paid: 0,
  treesix_pending: 0,
  partners_pending: 0,
})

const filters = reactive({
  status: '',
  type: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  perPage: 15,
})

const pagination = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

// influencers for picker
const influencers = ref<any[]>([])

// ─── Transactions state ───────────────────────────────────────────────────────
const transactions = ref<any[]>([])
const txLoading = ref(false)
const txError = ref<string | null>(null)

const txFilters = reactive({
  account: '',
  influencer_id: '' as number | string,
  type: '',
  from_account: '',
  to_account: '',
  amountMin: '' as number | string,
  amountMax: '' as number | string,
  description: '',
  balanceMin: '' as number | string,
  balanceMax: '' as number | string,
  dateFrom: '',
  dateTo: '',
  page: 1,
  perPage: 20,
})

const txPagination = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

// ─── Create modal ─────────────────────────────────────────────────────────────
const showCreateModal = ref(false)
const createLoading = ref(false)
const calculateLoading = ref(false)
const calculated = ref<any>(null)
const calculatedInfluencers = ref<any[]>([])
const createForm = reactive({
  type: 'general' as 'general' | 'influencer',
  period_start: '',
  period_end: '',
  notes: '',
})

const canSubmitCreate = computed(() => {
  if (createForm.type === 'influencer') {
    return calculatedInfluencers.value.some(i => i.selected)
  }
  return !!calculated.value
})

// ─── Mark paid modal ──────────────────────────────────────────────────────────
const showMarkPaidModal = ref(false)
const markPaidLoading = ref(false)
const markPaidTarget = ref<any>(null)
const proofFileInput = ref<HTMLInputElement | null>(null)
const proofDragOver = ref(false)
const addProofDragOver = ref(false)
const markPaidForm = reactive({
  reference: '',
  notes: '',
  proof_urls: [] as string[],
})

// ─── Proof viewer modal ───────────────────────────────────────────────────────
const showProofModal = ref(false)
const proofTarget = ref<any>(null)

// ─── Manual transaction modal ─────────────────────────────────────────────────
const showManualModal = ref(false)
const manualLoading = ref(false)
const manualForm = reactive({
  direction: 'in' as 'in' | 'out',
  account: 'treesix' as 'treesix' | 'partners' | 'commissions',
  amount: '',
  description: '',
})

// ─── Load data ────────────────────────────────────────────────────────────────
async function loadBalance() {
  try {
    const res = await SettlementsService.balance()
    const d = res.data
    balance.total_collected      = parseFloat(d.total_collected) || 0
    balance.total_fees_earned    = parseFloat(d.total_fees_earned) || 0
    balance.total_repassed       = parseFloat(d.total_repassed) || 0
    balance.total_refunds        = parseFloat(d.total_refunds) || 0
    balance.available_to_repass  = parseFloat(d.available_to_repass) || 0
    balance.pending_amount       = parseFloat(d.pending_amount) || 0
    balance.pending_count        = parseInt(d.pending_count) || 0
    balance.treesix_paid         = parseFloat(d.treesix_paid) || 0
    balance.partners_paid        = parseFloat(d.partners_paid) || 0
    balance.commissions_paid     = parseFloat(d.commissions_paid) || 0
    balance.treesix_pending      = parseFloat(d.treesix_pending) || 0
    balance.partners_pending     = parseFloat(d.partners_pending) || 0
  } catch {
    // silent
  }
}

async function loadSettlements() {
  loading.value = true
  error.value = null
  try {
    const params: any = { page: filters.page, perPage: filters.perPage, with: ['influencer'] }
    const f: any[] = []
    if (filters.status)   f.push({ field: 'status',       operator: '=',  value: filters.status })
    if (filters.type)     f.push({ field: 'type',         operator: '=',  value: filters.type })
    if (filters.dateFrom) f.push({ field: 'period_start', operator: '>=', value: filters.dateFrom })
    if (filters.dateTo)   f.push({ field: 'period_end',   operator: '<=', value: filters.dateTo })
    if (f.length) params.filters = f

    const res = await SettlementsService.index(params)
    settlements.value = res.data?.data || []
    Object.assign(pagination, {
      current_page: res.data?.current_page || 1,
      last_page: res.data?.last_page || 1,
      total: res.data?.total || 0,
      from: res.data?.from || 0,
      to: res.data?.to || 0,
    })
  } catch {
    error.value = 'Erro ao carregar repasses'
  } finally {
    loading.value = false
  }
}

async function loadTransactions() {
  txLoading.value = true
  txError.value = null
  try {
    const params: any = { page: txFilters.page, perPage: txFilters.perPage }
    if (txFilters.account)                                          params.account       = txFilters.account
    if (txFilters.influencer_id)                                    params.influencer_id = txFilters.influencer_id
    if (txFilters.type)                                             params.type          = txFilters.type
    if (txFilters.dateFrom)                                         params.dateFrom      = txFilters.dateFrom
    if (txFilters.dateTo)                                           params.dateTo        = txFilters.dateTo
    if (txFilters.from_account)                                     params.from_account  = txFilters.from_account
    if (txFilters.to_account)                                       params.to_account    = txFilters.to_account
    if (txFilters.amountMin !== '' && txFilters.amountMin !== undefined)  params.amountMin = txFilters.amountMin
    if (txFilters.amountMax !== '' && txFilters.amountMax !== undefined)  params.amountMax = txFilters.amountMax
    if (txFilters.description)                                      params.description   = txFilters.description
    if (txFilters.balanceMin !== '' && txFilters.balanceMin !== undefined) params.balanceMin = txFilters.balanceMin
    if (txFilters.balanceMax !== '' && txFilters.balanceMax !== undefined) params.balanceMax = txFilters.balanceMax

    const res = await SettlementsService.transactions(params)
    transactions.value = res.data?.data || []
    Object.assign(txPagination, {
      current_page: res.data?.current_page || 1,
      last_page: res.data?.last_page || 1,
      total: res.data?.total || 0,
      from: res.data?.from || 0,
      to: res.data?.to || 0,
    })
  } catch {
    txError.value = 'Erro ao carregar transações'
  } finally {
    txLoading.value = false
  }
}

async function loadInfluencers() {
  try {
    const res = await API.get('/api/v1/influencers', { params: { perPage: 100, page: 1 } })
    influencers.value = res.data?.data || []
  } catch {
    influencers.value = []
  }
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function clearFilters() {
  filters.status = ''
  filters.type = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.page = 1
  loadSettlements()
}

function changePage(p: number) {
  filters.page = p
  loadSettlements()
}

function onAccountChange() {
  txFilters.influencer_id = ''
  txFilters.page = 1
  loadTransactions()
}

function clearTxFilters() {
  txFilters.account = ''
  txFilters.influencer_id = ''
  txFilters.type = ''
  txFilters.from_account = ''
  txFilters.to_account = ''
  txFilters.amountMin = ''
  txFilters.amountMax = ''
  txFilters.description = ''
  txFilters.balanceMin = ''
  txFilters.balanceMax = ''
  txFilters.dateFrom = ''
  txFilters.dateTo = ''
  txFilters.page = 1
  loadTransactions()
}

function changeTxPage(p: number) {
  txFilters.page = p
  loadTransactions()
}

// ─── Create modal actions ─────────────────────────────────────────────────────
function openCreate() {
  createForm.type = 'general'
  createForm.period_start = ''
  createForm.period_end = ''
  createForm.notes = ''
  calculated.value = null
  calculatedInfluencers.value = []
  showCreateModal.value = true
}

function toggleAllInfluencers(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  calculatedInfluencers.value.forEach(i => i.selected = checked)
}

async function submitCalculate() {
  if (!createForm.period_start || !createForm.period_end) return
  calculateLoading.value = true
  calculated.value = null
  calculatedInfluencers.value = []
  try {
    const payload: any = {
      type: createForm.type,
      period_start: createForm.period_start,
      period_end: createForm.period_end,
    }
    const res = await SettlementsService.calculate(payload)
    if (createForm.type === 'influencer') {
      // Retorna array — marcar todos como seleccionados por defeito
      calculatedInfluencers.value = (res.data || []).map((item: any) => ({ ...item, selected: true }))
      calculated.value = true // para distinguir "já calculou" de "ainda não calculou"
    } else {
      calculated.value = res.data
    }
  } catch {
    alert('Erro ao calcular repasse')
  } finally {
    calculateLoading.value = false
  }
}

async function submitCreate() {
  if (!canSubmitCreate.value) return
  createLoading.value = true
  try {
    if (createForm.type === 'influencer') {
      const selected = calculatedInfluencers.value.filter(i => i.selected)
      await SettlementsService.bulk({
        period_start: createForm.period_start,
        period_end: createForm.period_end,
        items: selected.map(i => ({
          influencer_id: i.influencer_id,
          total_sales: i.total_sales,
          total_refunds_count: i.total_refunds_count,
          total_refunds_amount: i.total_refunds_amount,
          net_sales: i.net_sales,
          total_fees: i.total_fees,
          total_commissions: i.total_commissions,
          amount: i.amount,
        })),
      })
    } else {
      await SettlementsService.store({
        type: 'general',
        period_start: createForm.period_start,
        period_end: createForm.period_end,
        total_sales: calculated.value.total_sales,
        total_refunds_count: calculated.value.total_refunds_count,
        total_refunds_amount: calculated.value.total_refunds_amount,
        net_sales: calculated.value.net_sales,
        total_fees: calculated.value.total_fees,
        total_commissions: calculated.value.total_commissions,
        amount: calculated.value.amount,
        notes: createForm.notes || null,
        status: 'pending',
      })
    }
    showCreateModal.value = false
    loadBalance()
    loadSettlements()
  } catch {
    alert('Erro ao criar repasse')
  } finally {
    createLoading.value = false
  }
}

// ─── Mark paid modal actions ──────────────────────────────────────────────────
function openMarkPaid(settlement: any) {
  markPaidTarget.value = settlement
  markPaidForm.reference = ''
  markPaidForm.notes = ''
  markPaidForm.proof_urls = []
  if (proofFileInput.value) proofFileInput.value.value = ''
  showMarkPaidModal.value = true
}

function onProofFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  for (const file of Array.from(files)) {
    if (file.size > MAX_FILE_SIZE) {
      alert(`Ficheiro "${file.name}" demasiado grande. Máximo: 10 MB.`)
      continue
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) markPaidForm.proof_urls.push(result)
    }
    reader.readAsDataURL(file)
  }
  input.value = ''
}

function onProofDrop(event: DragEvent) {
  const files = event.dataTransfer?.files
  if (!files?.length) return
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') continue
    if (file.size > MAX_FILE_SIZE) { alert(`Ficheiro "${file.name}" demasiado grande. Máximo: 10 MB.`); continue }
    const reader = new FileReader()
    reader.onload = (e) => { const result = e.target?.result as string; if (result) markPaidForm.proof_urls.push(result) }
    reader.readAsDataURL(file)
  }
}

function removeProofFromForm(index: number) {
  markPaidForm.proof_urls.splice(index, 1)
}

async function submitMarkPaid() {
  if (!markPaidTarget.value) return
  markPaidLoading.value = true
  try {
    await SettlementsService.markAsPaid(markPaidTarget.value.id, {
      reference: markPaidForm.reference || null,
      notes: markPaidForm.notes || null,
      proof_urls: markPaidForm.proof_urls.length ? markPaidForm.proof_urls : null,
    })
    showMarkPaidModal.value = false
    loadBalance()
    loadSettlements()
  } catch {
    alert('Erro ao marcar como pago')
  } finally {
    markPaidLoading.value = false
  }
}

// ─── Proof viewer ─────────────────────────────────────────────────────────────
function isProofImage(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:image')) return true
  const lower = url.toLowerCase()
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')
}

function proofUrl(url: string): string {
  if (!url || url.startsWith('data:') || url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_URL}${url}`
}

function proofFilename(url: string): string {
  return url.split('/').pop() || url
}

function getProofUrls(settlement: any): string[] {
  if (!settlement?.proof_urls) return []
  if (Array.isArray(settlement.proof_urls)) return settlement.proof_urls
  try { return JSON.parse(settlement.proof_urls) } catch { return [] }
}

const addProofInput = ref<HTMLInputElement | null>(null)
const addProofLoading = ref(false)

function openProof(settlement: any) {
  proofTarget.value = settlement
  showProofModal.value = true
}

async function onAddProofFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !proofTarget.value) return
  if (file.size > 10 * 1024 * 1024) { alert('Máximo 10 MB.'); input.value = ''; return }
  addProofLoading.value = true
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const res = await SettlementsService.addProof(proofTarget.value.id, dataUrl)
    proofTarget.value = res.data
    loadSettlements()
  } catch { alert('Erro ao adicionar comprovativo') }
  finally { addProofLoading.value = false; input.value = '' }
}

async function onAddProofDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (!file || !proofTarget.value) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return
  if (file.size > 10 * 1024 * 1024) { alert('Máximo 10 MB.'); return }
  addProofLoading.value = true
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const res = await SettlementsService.addProof(proofTarget.value.id, dataUrl)
    proofTarget.value = res.data
    loadSettlements()
  } catch { alert('Erro ao adicionar comprovativo') }
  finally { addProofLoading.value = false }
}

async function deleteProof(filename: string) {
  if (!proofTarget.value) return
  if (!confirm('Remover este comprovativo?')) return
  try {
    const res = await SettlementsService.removeProof(proofTarget.value.id, filename)
    proofTarget.value = res.data
    loadSettlements()
  } catch { alert('Erro ao remover comprovativo') }
}

// ─── Manual transaction ───────────────────────────────────────────────────────
function openManual() {
  manualForm.direction = 'in'
  manualForm.account = 'treesix'
  manualForm.amount = ''
  manualForm.description = ''
  showManualModal.value = true
}

async function submitManual() {
  if (!manualForm.amount || !manualForm.description) return
  manualLoading.value = true
  try {
    await SettlementsService.addManualTransaction({
      direction: manualForm.direction,
      account: manualForm.account,
      amount: parseFloat(manualForm.amount),
      description: manualForm.description,
    })
    showManualModal.value = false
    loadBalance()
    loadTransactions()
  } catch {
    alert('Erro ao registar transação manual')
  } finally {
    manualLoading.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function deleteSettlement(id: number) {
  if (!confirm('Eliminar este repasse?')) return
  try {
    await SettlementsService.destroy(id)
    loadBalance()
    loadSettlements()
  } catch {
    alert('Erro ao eliminar repasse')
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const toMoney = (v: number | string) => {
  const num = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num || 0)
}

const formatDate = (value: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateOnly = (value: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTime = (value: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function txTypeLabel(refType: string | null) {
  const labels: Record<string, string> = {
    payment:    'Pagamento',
    settlement: 'Repasse',
    refund:     'Devolução',
    manual:     'Manual',
  }
  return labels[refType ?? ''] ?? (refType ?? '—')
}

function txTypeBadge(refType: string | null) {
  const classes: Record<string, string> = {
    payment:    'bg-green-lt text-green',
    settlement: 'bg-blue-lt text-blue',
    refund:     'bg-red-lt text-red',
    manual:     'bg-teal-lt text-teal',
  }
  return 'badge ' + (classes[refType ?? ''] ?? 'bg-secondary-lt')
}

function accountLabel(account: string | null) {
  const labels: Record<string, string> = {
    clients:     'Clientes',
    treesix:     'Treesix',
    commissions: 'Encargos',
    partners:    'Parceiros',
    settled:     'Liquidado',
  }
  return account ? (labels[account] ?? account) : '—'
}

function accountBadgeClass(account: string | null) {
  if (!account) return 'text-muted'
  const classes: Record<string, string> = {
    clients:     'badge bg-gray-lt text-muted',
    treesix:     'badge bg-blue-lt text-blue',
    commissions: 'badge bg-teal-lt text-teal',
    partners:    'badge bg-purple-lt text-purple',
    settled:     'badge bg-green-lt text-green',
  }
  return classes[account] ?? 'badge bg-secondary-lt'
}

// ─── Pagination helper ────────────────────────────────────────────────────────
function pageWindow(current: number, last: number): (number | string)[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(last - 1, current + 1); p++) pages.push(p)
  if (current < last - 2) pages.push('...')
  pages.push(last)
  return pages
}

// ─── Refresh ──────────────────────────────────────────────────────────────────
function refresh() {
  loadBalance()
  if (activeTab.value === 'repasses') loadSettlements()
  else loadTransactions()
}

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(() => {
  loadBalance()
  loadSettlements()
  loadInfluencers()
})
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; display: inline-block; }
</style>
