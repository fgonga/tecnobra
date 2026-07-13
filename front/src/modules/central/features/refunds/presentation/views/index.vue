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
          <div class="page-pretitle">Gestão</div>
          <h2 class="page-title">Devoluções</h2>
        </div>
        <div class="col-auto ms-auto d-print-none">
          <button class="btn btn-primary" @click="showCreateModal = true">
            <IconPlus size="16" class="me-1" /> Nova Devolução
          </button>
          <button class="btn btn-default ms-2" @click="exportExcel">
            <IconFileTypeXls size="16" class="me-1" /> Exportar Excel
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-end">
            <div class="col-md-2">
              <label class="form-label">Estado</label>
              <select
                class="form-select form-select-sm"
                v-model="filters.status"
                @change="loadRefunds"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovada</option>
                <option value="rejected">Rejeitada</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label">Data (início)</label>
              <input
                class="form-control form-control-sm"
                type="date"
                v-model="filters.dateFrom"
                @change="loadRefunds"
              />
            </div>
            <div class="col-md-2">
              <label class="form-label">Data (fim)</label>
              <input
                class="form-control form-control-sm"
                type="date"
                v-model="filters.dateTo"
                @change="loadRefunds"
              />
            </div>
            <div class="col-md-2">
              <label class="form-label">Valor mín. (Kz)</label>
              <input
                class="form-control form-control-sm"
                type="number"
                step="0.01"
                v-model="filters.amountMin"
                placeholder="0.00"
                @change="loadRefunds"
              />
            </div>
            <div class="col-md-2">
              <label class="form-label">Valor máx. (Kz)</label>
              <input
                class="form-control form-control-sm"
                type="number"
                step="0.01"
                v-model="filters.amountMax"
                placeholder="0.00"
                @change="loadRefunds"
              />
            </div>
            <div class="col-auto">
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
                  <th>Pedido</th>
                  <th>Pagamento</th>
                  <th class="text-end">Pago</th>
                  <th class="text-end">Solicitado</th>
                  <th class="text-end">Processado</th>
                  <th>Motivo</th>
                  <th>Solicitado por</th>
                  <th>Aprovado por</th>
                  <th class="w-1"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="refunds.length === 0">
                  <td colspan="10" class="text-center text-muted py-4">
                    Nenhuma devolução encontrada
                  </td>
                </tr>
                <tr v-for="r in refunds" :key="r.id">
                  <td>
                    <span v-if="r.status === 'pending'" class="badge bg-yellow text-dark"
                      >Pendente</span
                    >
                    <span v-else-if="r.status === 'approved'" class="badge bg-green text-white"
                      >Aprovada</span
                    >
                    <span v-else-if="r.status === 'rejected'" class="badge bg-red text-white"
                      >Rejeitada</span
                    >
                  </td>
                  <td>
                    <button
                      class="btn btn-link p-0 fw-medium text-reset text-decoration-none"
                      @click="orderSidebar.open(r.order_id)"
                    >
                      {{ r.order?.code || `#${r.order_id}` }}
                    </button>
                  </td>
                  <td>
                    <button
                      v-if="r.payment_id"
                      class="btn btn-link p-0 font-monospace small text-reset text-decoration-none"
                      @click="paymentSidebar.open(r.payment_id)"
                    >
                      {{ r.payment?.code || `#${r.payment_id}` }}
                    </button>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-end">
                    <span class="text-blue">{{
                      toMoney(r.order?.amount_paid ?? r.payment?.amount)
                    }}</span>
                  </td>
                  <td class="text-end text-warning fw-semibold">{{ toMoney(r.amount) }}</td>
                  <td class="text-end">
                    <span v-if="r.status === 'approved'" class="text-success fw-semibold">{{
                      toMoney(r.amount)
                    }}</span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td>
                    <span
                      v-if="r.reason"
                      class="text-truncate d-inline-block"
                      style="max-width: 140px"
                      :title="r.reason"
                      >{{ r.reason }}</span
                    >
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td>
                    <div v-if="r.requested_by" class="badge bg-blue-lt text-blue">
                      {{ r.requested_by }}
                    </div>
                    <div v-else class="text-muted">—</div>
                    <div class="text-muted small mt-1">
                      <IconClockHour4 size="11" class="me-1" />{{ formatDate(r.created_at) }}
                    </div>
                  </td>
                  <td>
                    <div v-if="r.approved_by" class="badge bg-green-lt text-green">
                      {{ r.approved_by }}
                    </div>
                    <div v-else class="text-muted">—</div>
                    <div v-if="r.processed_at" class="text-muted small mt-1">
                      <IconCircleCheck size="11" class="me-1" />{{ formatDate(r.processed_at) }}
                    </div>
                  </td>
                  <td>
                    <div class="d-flex gap-1" v-if="r.status === 'pending'">
                      <button
                        class="btn btn-sm btn-success"
                        @click="handleApprove(r)"
                        title="Aprovar"
                      >
                        <IconCheck size="14" />
                      </button>
                      <button
                        class="btn btn-sm btn-danger"
                        @click="handleReject(r)"
                        title="Rejeitar"
                      >
                        <IconX size="14" />
                      </button>
                    </div>
                    <button
                      v-else
                      class="btn btn-sm btn-ghost-secondary"
                      @click="deleteRefund(r.id)"
                      title="Eliminar"
                    >
                      <IconTrash size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.last_page > 1" class="card-footer d-flex align-items-center">
            <p class="m-0 text-secondary">
              A mostrar <span>{{ pagination.from }}</span> a <span>{{ pagination.to }}</span> de
              <span>{{ pagination.total }}</span>
            </p>
            <ul class="pagination m-0 ms-auto">
              <li class="page-item" :class="{ disabled: pagination.current_page === 1 }">
                <a
                  class="page-link"
                  href="#"
                  @click.prevent="changePage(pagination.current_page - 1)"
                  >prev</a
                >
              </li>
              <li
                class="page-item"
                v-for="p in pagination.last_page"
                :key="p"
                :class="{ active: p === pagination.current_page }"
              >
                <a class="page-link" href="#" @click.prevent="changePage(p)">{{ p }}</a>
              </li>
              <li
                class="page-item"
                :class="{ disabled: pagination.current_page === pagination.last_page }"
              >
                <a
                  class="page-link"
                  href="#"
                  @click.prevent="changePage(pagination.current_page + 1)"
                  >next</a
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="modal modal-blur show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nova Devolução</h5>
            <button type="button" class="btn-close" @click="closeCreateModal"></button>
          </div>
          <div class="modal-body">
            <!-- Search mode toggle -->
            <div class="mb-3">
              <div class="btn-group w-100" role="group">
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="searchMode === 'order' ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="setSearchMode('order')"
                >
                  Por Pedido
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  :class="searchMode === 'payment' ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="setSearchMode('payment')"
                >
                  Por Pagamento
                </button>
              </div>
            </div>

            <!-- Order multiselect -->
            <div v-if="searchMode === 'order'" class="mb-3">
              <label class="form-label required">Pedido</label>
              <div class="d-flex gap-2 entity-select">
                <multiselect
                  v-model="selectedOrder"
                  :options="orderItems"
                  :loading="orderSearchLoading"
                  placeholder="Pesquisar pedido pelo código..."
                  label="code"
                  track-by="id"
                  :internal-search="false"
                  @search-change="onOrderSearch"
                  @select="onOrderSelect"
                  @remove="onOrderRemove"
                >
                  <template #option="{ option }">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <span class="fw-medium">{{ option.code }}</span>
                        <span class="text-muted small ms-2">{{
                          option.customers?.[0]?.name || ''
                        }}</span>
                      </div>
                      <span class="badge bg-blue-lt text-blue ms-2">{{
                        toMoney(option.amount_due)
                      }}</span>
                    </div>
                  </template>
                  <template #singleLabel="{ option }">
                    <span class="fw-medium">{{ option.code }}</span>
                    <span class="text-muted small ms-2">{{ toMoney(option.amount_due) }}</span>
                  </template>
                  <template #noResult>Sem resultados</template>
                  <template #noOptions>Escreva para pesquisar</template>
                </multiselect>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-icon flex-shrink-0"
                  title="Pesquisa avançada"
                  @click="openPicker('order')"
                >
                  <IconSearch size="18" />
                </button>
              </div>
            </div>

            <!-- Payment multiselect -->
            <div v-if="searchMode === 'payment'" class="mb-3">
              <label class="form-label required">Pagamento</label>
              <div class="d-flex gap-2 entity-select">
                <multiselect
                  v-model="selectedPayment"
                  :options="paymentItems"
                  :loading="paymentSearchLoading"
                  placeholder="Pesquisar pagamento pelo código..."
                  label="code"
                  track-by="id"
                  :internal-search="false"
                  @search-change="onPaymentSearch"
                  @select="onPaymentSelect"
                  @remove="onPaymentRemove"
                >
                  <template #option="{ option }">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="fw-medium font-monospace">{{ option.code }}</span>
                      <span class="badge bg-green-lt text-green ms-2">{{
                        toMoney(option.amount)
                      }}</span>
                    </div>
                  </template>
                  <template #singleLabel="{ option }">
                    <span class="fw-medium font-monospace">{{ option.code }}</span>
                    <span class="text-muted small ms-2">{{ toMoney(option.amount) }}</span>
                  </template>
                  <template #noResult>Sem resultados</template>
                  <template #noOptions>Escreva para pesquisar</template>
                </multiselect>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-icon flex-shrink-0"
                  title="Pesquisa avançada"
                  @click="openPicker('payment')"
                >
                  <IconSearch size="18" />
                </button>
              </div>
            </div>

            <!-- Mini-cards: detalhes do pedido e do pagamento selecionados -->
            <div v-if="resolvedOrder || resolvedPayment || paymentLoading" class="row g-2 mb-3">
              <!-- Detalhes do pedido -->
              <div class="col-md-6">
                <div class="card card-sm h-100">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-blue-lt text-blue"
                        ><IconShoppingCart size="14" class="me-1" />Detalhes do pedido</span
                      >
                      <span
                        v-if="resolvedOrder?.status"
                        class="badge"
                        :class="orderStatusClass(resolvedOrder.status)"
                        >{{ orderStatusLabel(resolvedOrder.status) }}</span
                      >
                    </div>
                    <template v-if="resolvedOrder">
                      <div class="fw-bold font-monospace mb-2">{{ resolvedOrder.code }}</div>

                      <dl class="row small gx-2 gy-1 mb-2">
                        <dt class="col-5 text-muted fw-normal">Curso</dt>
                        <dd class="col-7 mb-0 text-truncate">
                          {{ resolvedOrder.course?.name || '—' }}
                        </dd>
                        <dt class="col-5 text-muted fw-normal">Acessos (Qtd.)</dt>
                        <dd class="col-7 mb-0">{{ resolvedOrder.quantity ?? '—' }}</dd>
                      </dl>

                      <div class="row g-1 small mb-2">
                        <div class="col-6 d-flex justify-content-between">
                          <span class="text-muted">Bruto</span
                          ><span>{{ toMoney(resolvedOrder.amount_due) }}</span>
                        </div>
                        <div class="col-6 d-flex justify-content-between">
                          <span class="text-muted">Descontos</span
                          ><span>{{ toMoney(resolvedOrder.discount_total) }}</span>
                        </div>
                        <div class="col-6 d-flex justify-content-between">
                          <span class="text-muted">V/Un</span><span>{{ toMoney(unitPrice) }}</span>
                        </div>
                        <div class="col-6 d-flex justify-content-between">
                          <span class="text-muted">Pago</span
                          ><span class="fw-medium text-success">{{
                            toMoney(resolvedOrder.amount_paid)
                          }}</span>
                        </div>
                      </div>

                      <!-- Estudantes -->
                      <div v-if="resolvedOrder.customers?.length" class="border-top pt-2">
                        <div class="text-muted small mb-1">
                          <IconUsersGroup size="13" class="me-1" />Estudantes ({{
                            resolvedOrder.customers.length
                          }})
                        </div>
                        <div
                          v-for="(s, i) in resolvedOrder.customers"
                          :key="i"
                          class="d-flex justify-content-between align-items-start small mb-1"
                        >
                          <div class="text-truncate me-2">
                            <span class="fw-medium">{{ s.name }}</span>
                            <div class="text-muted text-truncate">{{ s.email }}</div>
                            <div v-if="s.phone" class="text-muted">{{ s.phone }}</div>
                          </div>
                          <span
                            v-if="s.status"
                            class="badge flex-shrink-0"
                            :class="studentStatusClass(s.status)"
                            >{{ s.status }}</span
                          >
                        </div>
                      </div>

                      <div class="border-top pt-2 mt-2 small text-muted">
                        <div>Criado: {{ formatDate(resolvedOrder.created_at) }}</div>
                        <div v-if="resolvedOrder.completed_at">
                          Concluído: {{ formatDate(resolvedOrder.completed_at) }}
                        </div>
                        <div v-if="resolvedOrder.canceled_at">
                          Cancelado: {{ formatDate(resolvedOrder.canceled_at) }}
                        </div>
                      </div>
                    </template>
                    <div v-else class="text-muted small py-2">—</div>
                  </div>
                </div>
              </div>

              <!-- Detalhes do pagamento (sem Resposta do Processador) -->
              <div class="col-md-6">
                <div class="card card-sm h-100">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-teal-lt text-teal"
                        ><IconCreditCard size="14" class="me-1" />Detalhes do pagamento</span
                      >
                      <span
                        v-if="resolvedPayment?.status"
                        class="badge"
                        :class="payStatusClass(resolvedPayment.status)"
                        >{{ resolvedPayment.status }}</span
                      >
                    </div>
                    <div
                      v-if="paymentLoading"
                      class="d-flex align-items-center gap-2 text-muted small py-2"
                    >
                      <div class="spinner-border spinner-border-sm"></div>
                      A buscar pagamento...
                    </div>
                    <template v-else-if="resolvedPayment">
                      <div class="fw-bold font-monospace mb-2">{{ resolvedPayment.code }}</div>

                      <dl class="row small gx-2 gy-1 mb-2">
                        <dt class="col-5 text-muted fw-normal">Tipo</dt>
                        <dd class="col-7 mb-0">{{ payTypeLabel(resolvedPayment.payment_type) }}</dd>
                        <dt class="col-5 text-muted fw-normal">Telefone</dt>
                        <dd class="col-7 mb-0">{{ resolvedPayment.phone || '—' }}</dd>
                      </dl>

                      <div class="h3 mb-2 text-success">{{ toMoney(resolvedPayment.amount) }}</div>

                      <div class="border-top pt-2 small text-muted">
                        <div>Criação: {{ formatDate(resolvedPayment.created_at) }}</div>
                        <div v-if="resolvedPayment.paid_at">
                          Pagamento: {{ formatDate(resolvedPayment.paid_at) }}
                        </div>
                        <div v-if="resolvedPayment.failed_at">
                          Cancelamento: {{ formatDate(resolvedPayment.failed_at) }}
                        </div>
                        <div v-if="resolvedPayment.expired_at">
                          Expiração: {{ formatDate(resolvedPayment.expired_at) }}
                        </div>
                      </div>
                    </template>
                    <div v-else class="text-muted small py-2">Sem pagamento associado</div>
                  </div>
                </div>
              </div>

              <!-- Documento fiscal Vendus (só se a encomenda tiver fatura anexada) -->
              <div v-if="resolvedOrder?.invoice" class="col-12">
                <div class="card card-sm">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-purple-lt text-purple"
                        ><IconFileInvoice size="14" class="me-1" />Documento Vendus</span
                      >
                      <span
                        class="badge"
                        :class="
                          resolvedOrder.invoice.status === 'A'
                            ? 'bg-red-lt text-red'
                            : 'bg-green-lt text-green'
                        "
                      >
                        {{ resolvedOrder.invoice.status === 'A' ? 'Anulada' : 'Válida' }}
                      </span>
                    </div>
                    <div class="row g-2 align-items-center">
                      <div class="col-md-8">
                        <dl class="row small gx-2 gy-1 mb-0">
                          <dt class="col-4 col-md-3 text-muted fw-normal">Documento</dt>
                          <dd class="col-8 col-md-9 mb-0">
                            <span class="fw-medium font-monospace">{{
                              resolvedOrder.invoice.number ||
                              resolvedOrder.invoice.external_id ||
                              '—'
                            }}</span>
                            <span class="badge bg-blue-lt text-blue ms-1">{{
                              resolvedOrder.invoice.type
                            }}</span>
                          </dd>
                          <template v-if="resolvedOrder.invoice.atcud">
                            <dt class="col-4 col-md-3 text-muted fw-normal">ATCUD</dt>
                            <dd class="col-8 col-md-9 mb-0 font-monospace small">
                              {{ resolvedOrder.invoice.atcud }}
                            </dd>
                          </template>
                          <dt class="col-4 col-md-3 text-muted fw-normal">Valor</dt>
                          <dd class="col-8 col-md-9 mb-0 fw-medium">
                            {{ toMoney(resolvedOrder.invoice.amount) }}
                          </dd>
                        </dl>
                      </div>
                      <div class="col-md-4 text-md-end">
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary"
                          @click="openInvoicePdf(resolvedOrder.invoice)"
                        >
                          <IconFileTypePdf size="15" class="me-1" />Ver PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label required">Valor da Devolução (Kz)</label>
              <input
                class="form-control"
                type="text"
                :value="toMoney(createForm.amount)"
                readonly
                disabled
              />
              <div class="form-hint">
                A devolução é sempre do valor total — devoluções parciais não são permitidas.
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Motivo</label>
              <textarea
                class="form-control"
                v-model="createForm.reason"
                rows="3"
                placeholder="Motivo da devolução..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="closeCreateModal">Cancelar</button>
            <button
              class="btn btn-primary"
              @click="submitCreate"
              :disabled="createLoading || !resolvedOrder"
            >
              <span v-if="createLoading" class="spinner-border spinner-border-sm me-1"></span>
              Criar Devolução
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Picker Modal (pesquisa avançada — clone das tabelas de Pedidos / Pagamentos) -->
    <div
      v-if="picker.open"
      class="modal modal-blur show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5); z-index: 1060"
    >
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <IconSearch size="18" class="me-1" />
              {{ picker.mode === 'order' ? 'Pesquisar Pedido' : 'Pesquisar Pagamento' }}
            </h5>
            <button type="button" class="btn-close" @click="picker.open = false"></button>
          </div>
          <div class="modal-body">
            <input
              v-model="picker.q"
              class="form-control mb-2"
              :placeholder="
                picker.mode === 'order'
                  ? 'Nome do cliente ou código do pedido...'
                  : 'Código do pagamento ou nome do cliente...'
              "
              @input="onPickerSearch"
              autofocus
            />
            <div class="table-responsive border rounded" style="max-height: 55vh; overflow-y: auto">
              <!-- Clone: tabela de Pedidos -->
              <table
                v-if="picker.mode === 'order'"
                class="table table-vcenter table-hover table-sm mb-0"
              >
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Código</th>
                    <th>Estudante</th>
                    <th>A pagar</th>
                    <th>Cupão / Desc</th>
                    <th>Pago / Comissão</th>
                    <th>Qtd.</th>
                    <th>Criado / Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="picker.loading">
                    <td colspan="8" class="text-center py-4">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr
                    v-for="o in picker.items"
                    v-else
                    :key="o.id"
                    :style="isOrderRefundable(o) ? 'cursor:pointer' : 'cursor:not-allowed'"
                    :class="{ 'opacity-50': !isOrderRefundable(o) }"
                    @click="pickOrder(o)"
                  >
                    <td>
                      <span v-if="o.status === 'completed'" class="badge bg-green text-white"
                        >Concluído</span
                      >
                      <span v-else-if="o.status === 'paid'" class="badge bg-green text-white"
                        >Pago</span
                      >
                      <span v-else-if="o.status === 'pending'" class="badge bg-yellow text-dark"
                        >Pendente</span
                      >
                      <span v-else-if="o.status === 'canceled'" class="badge bg-red text-white"
                        >Cancelado</span
                      >
                      <span v-else-if="o.status === 'refunded'" class="badge bg-purple text-white"
                        >Devolvido</span
                      >
                      <span v-else class="badge bg-gray text-white">-</span>
                    </td>
                    <td>
                      <span class="fw-medium font-monospace">{{ o.code }}</span>
                    </td>
                    <td>
                      <div class="lh-sm">{{ o.customers?.[0]?.name || '-' }}</div>
                      <small class="text-secondary">{{ o.course?.name }}</small>
                    </td>
                    <td>{{ toMoney(o.amount_due) }}</td>
                    <td>
                      <div class="d-flex flex-column lh-sm align-items-start">
                        <span v-if="o.coupon" class="badge bg-blue-lt text-blue">{{
                          o.coupon.code
                        }}</span>
                        <span
                          v-if="Number(o.discount_total) > 0"
                          :class="{ 'text-muted small': o.coupon }"
                          >{{ toMoney(o.discount_total) }}</span
                        >
                        <span v-else-if="!o.coupon" class="text-muted">—</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex flex-column lh-sm">
                        <span>{{ toMoney(o.amount_paid) }}</span>
                        <small v-if="Number(o.commission_amount) > 0" class="text-purple"
                          >Com.: {{ toMoney(o.commission_amount) }}</small
                        >
                      </div>
                    </td>
                    <td>{{ o.quantity }}</td>
                    <td>
                      <div class="d-flex flex-column lh-sm">
                        <span>{{ formatDate(o.created_at) }}</span>
                        <small v-if="o.completed_at || o.canceled_at" class="text-muted">{{
                          formatDate(o.completed_at || o.canceled_at)
                        }}</small>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!picker.loading && !picker.items.length">
                    <td colspan="8" class="text-center text-muted py-4">Sem resultados.</td>
                  </tr>
                </tbody>
              </table>

              <!-- Clone: tabela de Pagamentos -->
              <table v-else class="table table-vcenter table-hover table-sm mb-0">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Tipo</th>
                    <th>Pagamento / Encomenda</th>
                    <th>Cliente / Telefone</th>
                    <th>Pago / Comissão</th>
                    <th>Criado / Pago</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="picker.loading">
                    <td colspan="6" class="text-center py-4">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr
                    v-for="p in picker.items"
                    v-else
                    :key="p.id"
                    :style="isPaymentRefundable(p) ? 'cursor:pointer' : 'cursor:not-allowed'"
                    :class="{ 'opacity-50': !isPaymentRefundable(p) }"
                    @click="pickPayment(p)"
                  >
                    <td>
                      <span v-if="p.status === 'paid'" class="badge bg-green text-white">Pago</span>
                      <span v-else-if="p.status === 'pending'" class="badge bg-yellow text-dark"
                        >Pendente</span
                      >
                      <span v-else-if="p.status === 'failed'" class="badge bg-red text-white"
                        >Falhado</span
                      >
                      <span v-else-if="p.status === 'refunded'" class="badge bg-purple text-white"
                        >Devolvido</span
                      >
                      <span v-else class="badge bg-gray text-white">-</span>
                    </td>
                    <td>
                      <span v-if="p.payment_type === 'aexpress' || p.payment_type === 'express'"
                        >Express</span
                      >
                      <span v-else-if="p.payment_type === 'ref' || p.payment_type === 'aref'"
                        >Referência</span
                      >
                      <span v-else-if="p.payment_type === 'qr'">QR</span>
                      <span v-else class="text-muted">{{ p.payment_type || '-' }}</span>
                    </td>
                    <td>
                      <div class="d-flex flex-column lh-sm">
                        <span class="fw-medium font-monospace">{{ p.code }}</span>
                        <small v-if="p.order" class="text-muted">{{ p.order.code }}</small>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex flex-column lh-sm">
                        <span>{{ p.order?.customers?.[0]?.name || '-' }}</span>
                        <small v-if="p.phone" class="text-muted">{{ p.phone }}</small>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex flex-column lh-sm">
                        <span>{{ toMoney(p.amount) }}</span>
                        <small v-if="Number(p.commission_amount) > 0" class="text-purple"
                          >Com.: {{ toMoney(p.commission_amount) }}</small
                        >
                      </div>
                    </td>
                    <td>
                      <div class="d-flex flex-column lh-sm">
                        <span>{{ formatDate(p.created_at) }}</span>
                        <small v-if="p.paid_at" class="text-muted">{{
                          formatDate(p.paid_at)
                        }}</small>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!picker.loading && !picker.items.length">
                    <td colspan="6" class="text-center text-muted py-4">Sem resultados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes Modal (approve/reject) -->
    <div
      v-if="notesModal.show"
      class="modal modal-blur show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ notesModal.action === 'approve' ? 'Aprovar' : 'Rejeitar' }} Devolução
            </h5>
            <button type="button" class="btn-close" @click="notesModal.show = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="notesModal.action === 'approve'" class="alert alert-warning mb-3">
              <IconAlertTriangle size="16" class="me-1" />
              Ao aprovar, o pedido e pagamento associados ficarão com estado
              <strong>Devolvido</strong>.
            </div>
            <div class="mb-3">
              <label class="form-label">Notas internas</label>
              <textarea
                class="form-control"
                v-model="notesModal.notes"
                rows="3"
                placeholder="Notas opcionais..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="notesModal.show = false">Cancelar</button>
            <button
              class="btn"
              :class="notesModal.action === 'approve' ? 'btn-success' : 'btn-danger'"
              @click="confirmAction"
              :disabled="actionLoading"
            >
              <span v-if="actionLoading" class="spinner-border spinner-border-sm me-1"></span>
              {{ notesModal.action === 'approve' ? 'Aprovar' : 'Rejeitar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebars -->
    <OrderPortableSidebar ref="orderSidebar" />
    <PaymentPortableSidebar ref="paymentSidebar" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import {
  IconPlus,
  IconCheck,
  IconX,
  IconTrash,
  IconFileTypeXls,
  IconAlertTriangle,
  IconClockHour4,
  IconCircleCheck,
  IconShoppingCart,
  IconCreditCard,
  IconSearch,
  IconUsersGroup,
  IconFileInvoice,
  IconFileTypePdf,
} from '@tabler/icons-vue'
import { RefundsService } from '../../domain/service/RefundsService'
import { OrdersService } from '../../../orders/domain/service/OrdersService'
import { PaymentsService } from '../../../payments/domain/service/PaymentsService'
import { InvoicesService } from '../../../invoices/domain/service/InvoicesService'
import { exportToExcel } from '@/common/application/utils/export'
import notification from '@common/application/utils/notification'
import OrderPortableSidebar from '../../../orders/presentation/components/OrderPortableSidebar.vue'
import PaymentPortableSidebar from '../../../payments/presentation/components/PaymentPortableSidebar.vue'

const refunds = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const createLoading = ref(false)
const actionLoading = ref(false)

const orderSidebar = ref<InstanceType<typeof OrderPortableSidebar> | null>(null)
const paymentSidebar = ref<InstanceType<typeof PaymentPortableSidebar> | null>(null)

const filters = reactive({
  status: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
  page: 1,
  perPage: 15,
})
const pagination = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

// Search mode
const searchMode = ref<'order' | 'payment'>('order')

// Multiselect state — order
const selectedOrder = ref<any>(null)
const orderItems = ref<any[]>([])
const orderSearchLoading = ref(false)
let orderSearchTimer: ReturnType<typeof setTimeout> | null = null

// Multiselect state — payment
const selectedPayment = ref<any>(null)
const paymentItems = ref<any[]>([])
const paymentSearchLoading = ref(false)
let paymentSearchTimer: ReturnType<typeof setTimeout> | null = null

// Resolved values (the other side fetched automatically)
const resolvedOrder = ref<any>(null)
const resolvedPayment = ref<any>(null)
const paymentLoading = ref(false)

const createForm = reactive({ amount: '', reason: '' })
const notesModal = reactive({
  show: false,
  action: '' as 'approve' | 'reject',
  refund: null as any,
  notes: '',
})

async function loadRefunds() {
  loading.value = true
  error.value = null
  try {
    const params: any = { page: filters.page, perPage: filters.perPage, with: ['order', 'payment'] }
    const f: any[] = []
    if (filters.status) f.push({ field: 'status', operator: '=', value: filters.status })
    if (filters.dateFrom)
      f.push({ field: 'created_at', operator: '>=', value: filters.dateFrom + ' 00:00:00' })
    if (filters.dateTo)
      f.push({ field: 'created_at', operator: '<=', value: filters.dateTo + ' 23:59:59' })
    if (filters.amountMin)
      f.push({ field: 'amount', operator: '>=', value: Number(filters.amountMin) })
    if (filters.amountMax)
      f.push({ field: 'amount', operator: '<=', value: Number(filters.amountMax) })
    if (f.length) params.filters = f
    const res = await RefundsService.index(params)
    refunds.value = res.data?.data || []
    Object.assign(pagination, {
      current_page: res.data?.current_page || 1,
      last_page: res.data?.last_page || 1,
      total: res.data?.total || 0,
      from: res.data?.from || 0,
      to: res.data?.to || 0,
    })
  } catch {
    error.value = 'Erro ao carregar devoluções'
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  filters.status = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.amountMin = ''
  filters.amountMax = ''
  filters.page = 1
  loadRefunds()
}

function changePage(p: number) {
  filters.page = p
  loadRefunds()
}

// ── Search mode ──────────────────────────────────────────────────
function setSearchMode(mode: 'order' | 'payment') {
  searchMode.value = mode
  clearSelection()
}

function clearSelection() {
  selectedOrder.value = null
  selectedPayment.value = null
  resolvedOrder.value = null
  resolvedPayment.value = null
  orderItems.value = []
  paymentItems.value = []
  createForm.amount = ''
}

// ── Mini-card helpers ────────────────────────────────────────────
const PAY_TYPES: Record<string, string> = {
  express: 'Express',
  aexpress: 'Express',
  ref: 'Referência',
  aref: 'Referência',
  qr: 'QR Code',
}
const payTypeLabel = (t?: string) => (t ? PAY_TYPES[t] || t : '—')
const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-yellow-lt text-yellow' },
  paid: { label: 'Pago', cls: 'bg-green-lt text-green' },
  completed: { label: 'Concluído', cls: 'bg-green-lt text-green' },
  canceled: { label: 'Cancelado', cls: 'bg-secondary-lt' },
  refunded: { label: 'Devolvido', cls: 'bg-red-lt text-red' },
}
const orderStatusLabel = (s?: string) => (s ? ORDER_STATUS[s]?.label || s : '')
const orderStatusClass = (s?: string) =>
  s ? ORDER_STATUS[s]?.cls || 'bg-secondary-lt' : 'bg-secondary-lt'
const payStatusClass = (s?: string) =>
  s === 'paid'
    ? 'bg-green-lt text-green'
    : s === 'failed'
      ? 'bg-red-lt text-red'
      : s === 'refunded'
        ? 'bg-purple-lt text-purple'
        : 'bg-yellow-lt text-yellow'
const studentStatusClass = (s?: string) =>
  s === 'paid' || s === 'completed'
    ? 'bg-green-lt text-green'
    : s === 'canceled'
      ? 'bg-red-lt text-red'
      : 'bg-yellow-lt text-yellow'

// Abre o PDF do documento Vendus (backoffice; sessão do browser do admin).
async function openInvoicePdf(invoice: any) {
  if (!invoice?.id) return
  try {
    const url = (await InvoicesService.pdf(invoice.id)).data.url
    if (url) window.open(url, '_blank')
    else notification.error('PDF indisponível para este documento.')
  } catch (e: any) {
    notification.error(e?.response?.data?.message || 'Erro ao obter o PDF.')
  }
}

// Valor unitário do pedido (V/Un) para o card de detalhes.
const unitPrice = computed(() => {
  const o = resolvedOrder.value
  if (!o) return 0
  const qty = Number(o.quantity) || 1
  return (Number(o.amount_due) || 0) / qty
})

// Não se pode devolver um pedido cancelado/já devolvido nem um pagamento não pago.
const isOrderRefundable = (o: any) => !!o && !['canceled', 'refunded'].includes(o.status)
const isPaymentRefundable = (p: any) => !!p && p.status === 'paid' && !p.is_refunded

// Busca o pedido completo (cliente + curso) para enriquecer o mini-card.
async function fetchOrderDetails(orderId: number) {
  try {
    const res = await OrdersService.index({
      perPage: 1,
      page: 1,
      filters: [{ field: 'id', operator: '=', value: orderId }],
      with: ['customers', 'course', 'invoice'],
    } as any)
    const o = res.data?.data?.[0]
    if (o) resolvedOrder.value = o
  } catch {
    /* mantém o que já tem */
  }
}

// ── Order multiselect ────────────────────────────────────────────
function onOrderSearch(q: string) {
  if (orderSearchTimer) clearTimeout(orderSearchTimer)
  if (!q || q.length < 2) {
    orderItems.value = []
    return
  }
  orderSearchLoading.value = true
  orderSearchTimer = setTimeout(async () => {
    try {
      const res = await OrdersService.index({
        perPage: 10,
        page: 1,
        filters: [{ field: 'code', operator: 'like', value: q }],
        with: ['customers', 'course', 'invoice'],
      })
      orderItems.value = res.data?.data || []
    } catch {
      orderItems.value = []
    } finally {
      orderSearchLoading.value = false
    }
  }, 350)
}

async function onOrderSelect(order: any) {
  if (!isOrderRefundable(order)) {
    notification.error('Não é possível devolver um pedido cancelado ou já devolvido.')
    selectedOrder.value = null
    return
  }
  resolvedOrder.value = order
  resolvedPayment.value = null
  paymentLoading.value = true
  try {
    const res = await PaymentsService.index({
      perPage: 1,
      page: 1,
      filters: [
        { field: 'order_id', operator: '=', value: order.id },
        { field: 'status', operator: '=', value: 'paid' },
      ],
    } as any)
    const p = res.data?.data?.[0] || null
    resolvedPayment.value = p
    createForm.amount = String(p?.amount || order.amount_paid || order.amount_due || '')
  } catch {
    createForm.amount = String(order.amount_paid || order.amount_due || '')
  } finally {
    paymentLoading.value = false
  }
}

function onOrderRemove() {
  clearSelection()
}

// ── Payment multiselect ──────────────────────────────────────────
function onPaymentSearch(q: string) {
  if (paymentSearchTimer) clearTimeout(paymentSearchTimer)
  if (!q || q.length < 2) {
    paymentItems.value = []
    return
  }
  paymentSearchLoading.value = true
  paymentSearchTimer = setTimeout(async () => {
    try {
      const res = await PaymentsService.index({
        perPage: 10,
        page: 1,
        filters: [
          { field: 'code', operator: 'like', value: q },
          { field: 'status', operator: '=', value: 'paid' },
        ],
        with: ['order'],
      } as any)
      paymentItems.value = res.data?.data || []
    } catch {
      paymentItems.value = []
    } finally {
      paymentSearchLoading.value = false
    }
  }, 350)
}

function onPaymentSelect(payment: any) {
  if (!isPaymentRefundable(payment)) {
    notification.error('Só é possível devolver um pagamento pago (não anulado/devolvido).')
    selectedPayment.value = null
    return
  }
  resolvedPayment.value = payment
  resolvedOrder.value = payment.order || {
    id: payment.order_id,
    code: `#${payment.order_id}`,
    amount_due: payment.amount,
  }
  createForm.amount = String(payment.amount || '')
  const orderId = payment.order_id || payment.order?.id
  if (orderId) fetchOrderDetails(orderId)
}

function onPaymentRemove() {
  clearSelection()
}

// ── Picker (pesquisa avançada estilo entity-select) ───────────────
const picker = reactive({
  open: false,
  mode: 'order' as 'order' | 'payment',
  q: '',
  loading: false,
  items: [] as any[],
})
let pickerTimer: ReturnType<typeof setTimeout> | null = null

function openPicker(mode: 'order' | 'payment') {
  picker.mode = mode
  picker.q = ''
  picker.items = []
  picker.open = true
  loadPicker() // já traz uma primeira página de resultados
}

async function loadPicker() {
  const q = picker.q.trim()
  picker.loading = true
  try {
    if (picker.mode === 'order') {
      const params: any = {
        perPage: 15,
        page: 1,
        with: ['customers', 'course', 'coupon', 'invoice'],
      }
      if (q.length >= 2) {
        params.search = q
        params.searchable = ['code', 'customer_name']
      }
      const res = await OrdersService.index(params)
      picker.items = res.data?.data || []
    } else {
      const params: any = {
        perPage: 15,
        page: 1,
        with: ['order'],
        filters: [{ field: 'status', operator: '=', value: 'paid' }],
      }
      if (q.length >= 2) {
        params.search = q
        params.searchable = ['code', 'customer_name']
      }
      const res = await PaymentsService.index(params)
      picker.items = res.data?.data || []
    }
  } catch {
    picker.items = []
  } finally {
    picker.loading = false
  }
}

function onPickerSearch() {
  if (pickerTimer) clearTimeout(pickerTimer)
  pickerTimer = setTimeout(loadPicker, 350)
}

function pickOrder(o: any) {
  if (!isOrderRefundable(o)) {
    notification.error('Pedido cancelado ou já devolvido não pode ser selecionado.')
    return
  }
  selectedOrder.value = o
  orderItems.value = [o] // garante que o multiselect mostra o valor escolhido
  onOrderSelect(o)
  picker.open = false
}

function pickPayment(p: any) {
  if (!isPaymentRefundable(p)) {
    notification.error('Pagamento anulado/devolvido não pode ser selecionado.')
    return
  }
  selectedPayment.value = p
  paymentItems.value = [p]
  onPaymentSelect(p)
  picker.open = false
}

// ── Create ───────────────────────────────────────────────────────
function closeCreateModal() {
  showCreateModal.value = false
  clearSelection()
  createForm.reason = ''
}

async function submitCreate() {
  if (!resolvedOrder.value || !createForm.amount) return
  createLoading.value = true
  try {
    await RefundsService.store({
      order_id: resolvedOrder.value.id,
      payment_id: resolvedPayment.value?.id ?? null,
      amount: Number(createForm.amount),
      reason: createForm.reason,
    })
    closeCreateModal()
    loadRefunds()
  } catch {
    alert('Erro ao criar devolução')
  } finally {
    createLoading.value = false
  }
}

// ── Approve / Reject ─────────────────────────────────────────────
function handleApprove(r: any) {
  notesModal.action = 'approve'
  notesModal.refund = r
  notesModal.notes = ''
  notesModal.show = true
}

function handleReject(r: any) {
  notesModal.action = 'reject'
  notesModal.refund = r
  notesModal.notes = ''
  notesModal.show = true
}

async function confirmAction() {
  actionLoading.value = true
  try {
    if (notesModal.action === 'approve') {
      await RefundsService.approve(notesModal.refund.id, notesModal.notes)
    } else {
      await RefundsService.reject(notesModal.refund.id, notesModal.notes)
    }
    notesModal.show = false
    loadRefunds()
  } catch {
    alert('Erro ao processar devolução')
  } finally {
    actionLoading.value = false
  }
}

async function deleteRefund(id: number) {
  if (!confirm('Eliminar esta devolução?')) return
  try {
    await RefundsService.destroy(id)
    loadRefunds()
  } catch {
    alert('Erro ao eliminar')
  }
}

// ── Export ───────────────────────────────────────────────────────
function exportExcel() {
  const rows = refunds.value.map((r) => ({
    Estado:
      r.status === 'pending' ? 'Pendente' : r.status === 'approved' ? 'Aprovada' : 'Rejeitada',
    Pedido: r.order?.code || `#${r.order_id}`,
    Pagamento: r.payment?.code || '',
    'Valor Pago (Kz)': Number(r.order?.amount_paid ?? r.payment?.amount ?? 0),
    'Solicitado (Kz)': Number(r.amount),
    'Processado (Kz)': r.status === 'approved' ? Number(r.amount) : 0,
    Motivo: r.reason || '',
    Notas: r.notes || '',
    'Solicitado por': r.requested_by || '',
    'Solicitado em': r.created_at ? formatDate(r.created_at) : '',
    'Aprovado por': r.approved_by || '',
    'Processado em': r.processed_at ? formatDate(r.processed_at) : '',
  }))
  exportToExcel(rows, 'devoluções')
}

// ── Formatters ───────────────────────────────────────────────────
const toMoney = (v: number | string | null | undefined) => {
  const num = typeof v === 'string' ? parseFloat(v) : v || 0
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(num)
}

const formatDate = (value: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(loadRefunds)
</script>
