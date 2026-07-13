<!--
 -   Copyright © 2021 - 2026
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
 -
 -   Faturação (Cegid Vendus) — emissão manual, conexão de documentos existentes
 -   e mapeamento de cursos a produtos Vendus.
-->
<template>
  <div class="page-body mt-3">
    <div class="container-xl">
      <!-- ─── KPIs ──────────────────────────────────────────────────────── -->
      <div class="row row-cards mb-3">
        <div class="col-sm-6 col-lg-4">
          <div class="card">
            <div class="card-body py-3">
              <div class="d-flex align-items-center">
                <span class="avatar avatar-md rounded bg-yellow-lt text-yellow me-3"
                  ><IconFileAlert :size="22"
                /></span>
                <div>
                  <div class="text-muted small">Por faturar</div>
                  <div class="h2 mb-0 text-yellow">{{ pending.total }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-4">
          <div class="card">
            <div class="card-body py-3">
              <div class="d-flex align-items-center">
                <span class="avatar avatar-md rounded bg-green-lt text-green me-3"
                  ><IconFileCheck :size="22"
                /></span>
                <div>
                  <div class="text-muted small">Facturas emitidas</div>
                  <div class="h2 mb-0">{{ invoices.total }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-4">
          <div class="card">
            <div class="card-body py-3">
              <div class="d-flex align-items-center">
                <span class="avatar avatar-md rounded bg-blue-lt text-blue me-3"
                  ><IconPlugConnected :size="22"
                /></span>
                <div>
                  <div class="text-muted small">Modo de emissão</div>
                  <div class="h3 mb-0">
                    <span
                      class="badge"
                      :class="mode === 'normal' ? 'bg-green text-white' : 'bg-yellow text-dark'"
                    >
                      {{ mode === 'normal' ? 'Produção' : 'Testes' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── TABS ──────────────────────────────────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <button
                type="button"
                class="nav-link"
                :class="{ active: activeTab === 'pending' }"
                @click="activeTab = 'pending'"
              >
                Por faturar
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link"
                :class="{ active: activeTab === 'generated' }"
                @click="activeTab = 'generated'"
              >
                Facturas
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link"
                :class="{ active: activeTab === 'credit' }"
                @click="activeTab = 'credit'"
              >
                Notas de crédito
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link"
                :class="{ active: activeTab === 'courses' }"
                @click="activeTab = 'courses'"
              >
                Cursos
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link"
                :class="{ active: activeTab === 'methods' }"
                @click="activeTab = 'methods'"
              >
                Métodos de pagamento
              </button>
            </li>
          </ul>
        </div>

        <div class="card-body p-0">
          <!-- TAB: Por faturar -->
          <div v-show="activeTab === 'pending'">
            <div class="px-3 pt-2 pb-1">
              <BFormInput
                v-model="pending.search"
                placeholder="Pesquisar pedido ou cliente"
                debounce="350"
              />
              <div class="row mt-2">
                <div class="col-md-3">
                  <PeriodPicker @update:model-value="(v) => onPeriodApply(v)" />
                </div>
                <div class="col-md-3"></div>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-vcenter table-hover mb-0">
                <thead>
                  <tr>
                    <th>Pag.</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Curso</th>
                    <th class="text-end">Valor</th>
                    <th>Pago em</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="pending.loading">
                    <td colspan="7" class="text-center py-4">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr v-for="o in pending.data" v-else :key="o.id">
                    <td>
                      <span class="badge bg-blue-lt text-blue">{{
                        paymentLabel(o.payment_type)
                      }}</span>
                    </td>
                    <td>
                      <span class="fw-semibold">{{ o.code }}</span>
                      <div v-if="o.payment_code">
                        <small class="text-muted font-monospace">{{ o.payment_code }}</small>
                      </div>
                    </td>
                    <td>
                      <div>{{ o.customer_name || '—' }}</div>
                      <small class="text-muted">{{ o.customer_email || 'sem email' }}</small>
                    </td>
                    <td>
                      {{ o.course_name || '—'
                      }}<small v-if="o.quantity > 1" class="text-muted"> × {{ o.quantity }}</small>
                    </td>
                    <td class="text-end fw-semibold">{{ formatKz(o.amount_paid) }}</td>
                    <td>
                      <span class="text-nowrap">{{ formatDate(o.paid_at) }}</span>
                    </td>
                    <td class="text-end">
                      <div class="btn-list flex-nowrap justify-content-end">
                        <button class="btn btn-sm btn-outline-primary" @click="openEmit(o)">
                          <IconFilePlus :size="14" class="me-1" />Faturar
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" @click="openConnect(o)">
                          <IconPlugConnected :size="14" class="me-1" />Conectar
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!pending.loading && !pending.data.length">
                    <td colspan="7" class="text-center text-muted py-4">
                      <IconCheck :size="32" class="text-success mb-2" />
                      <div>Não há encomendas por faturar.</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="d-flex justify-content-between px-3 py-2">
              <div class="text-muted small align-self-center">{{ pending.total }} encomenda(s)</div>
              <BPagination
                v-model="pending.page"
                :total-rows="pending.total"
                :per-page="pending.perPage"
              />
            </div>
          </div>

          <!-- TAB: Facturas -->
          <div v-show="activeTab === 'generated'">
            <div class="px-3 pt-2 pb-1">
              <BFormInput
                v-model="invoices.search"
                placeholder="Pesquisar nº, ATCUD ou pedido"
                debounce="350"
              />
            </div>
            <div class="table-responsive">
              <table class="table table-vcenter table-hover mb-0">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Documento</th>
                    <th>Tipo</th>
                    <th>Pagamento</th>
                    <th class="text-end">Vendus / Sistema</th>
                    <th>Estado</th>
                    <th>Emitido em</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="invoices.loading">
                    <td colspan="8" class="text-center py-4">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr v-for="inv in invoices.data" v-else :key="inv.id">
                    <td>
                      <span class="fw-semibold">{{
                        inv.external_reference || inv.order?.code || '—'
                      }}</span>
                      <div v-if="inv.order?.customers?.length">
                        <small class="text-muted">{{ inv.order.customers[0].name }}</small>
                      </div>
                      <div v-if="inv.order?.course_name">
                        <small class="text-muted"
                          >{{ inv.order.course_name
                          }}<span v-if="inv.order?.quantity > 1">
                            × {{ inv.order.quantity }}</span
                          ></small
                        >
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-blue-lt text-blue font-monospace">{{
                        inv.number || inv.external_id || '—'
                      }}</span>
                      <div v-if="inv.atcud">
                        <small class="text-muted">ATCUD: {{ inv.atcud }}</small>
                      </div>
                      <span v-if="inv.connected" class="badge bg-purple-lt text-purple mt-1"
                        >Conectada</span
                      >
                    </td>
                    <td>{{ inv.type }}</td>
                    <td>
                      <template v-if="inv.order?.payment">
                        <span class="badge bg-blue-lt text-blue">{{
                          paymentLabel(inv.order.payment.payment_type)
                        }}</span>
                        <div v-if="inv.order.payment.code">
                          <small class="text-muted font-monospace">{{
                            inv.order.payment.code
                          }}</small>
                        </div>
                        <div v-if="inv.order.payment.paid_at">
                          <small class="text-muted">{{
                            formatDate(inv.order.payment.paid_at)
                          }}</small>
                        </div>
                      </template>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td class="text-end">
                      <div class="lh-sm">
                        <div class="fw-semibold">{{ formatKz(inv.amount) }}</div>
                        <small :class="amountMismatch(inv) ? 'text-red fw-bold' : 'text-muted'">
                          <IconAlertTriangle v-if="amountMismatch(inv)" :size="12" /> Sist.:
                          {{ formatKz(inv.order?.amount_paid) }}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span v-if="inv.status === 'A'" class="badge bg-red text-white">Anulada</span>
                      <span v-else class="badge bg-green text-white">Válida</span>
                      <div v-if="inv.credit_note" class="mt-1">
                        <span
                          class="badge bg-purple-lt text-purple"
                          role="button"
                          title="Abrir nota de crédito"
                          @click="openPdf(inv.credit_note)"
                        >
                          <IconReceiptRefund :size="12" class="me-1" />NC
                          {{ inv.credit_note.number || inv.credit_note.external_id }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span class="text-nowrap">{{ formatDate(inv.created_at) }}</span>
                    </td>
                    <td class="text-end">
                      <div class="btn-list flex-nowrap justify-content-end">
                        <button class="btn btn-icon" title="Ver PDF" @click="openPdf(inv)">
                          <IconFileTypePdf :size="20" />
                        </button>
                        <button
                          v-if="inv.status !== 'A'"
                          class="btn btn-icon text-danger"
                          title="Anular"
                          @click="cancelInvoice(inv)"
                        >
                          <IconReceiptOff :size="20" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!invoices.loading && !invoices.data.length">
                    <td colspan="8" class="text-center text-muted py-4">
                      Ainda não há documentos emitidos.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="d-flex justify-content-between px-3 py-2">
              <div class="text-muted small align-self-center">
                {{ invoices.total }} documento(s)
              </div>
              <BPagination
                v-model="invoices.page"
                :total-rows="invoices.total"
                :per-page="invoices.perPage"
              />
            </div>
          </div>

          <!-- TAB: Notas de crédito -->
          <div v-show="activeTab === 'credit'">
            <div class="px-3 pt-2 pb-1">
              <BFormInput
                v-model="credit.search"
                placeholder="Pesquisar nº, ATCUD ou pedido"
                debounce="350"
              />
            </div>
            <div class="table-responsive">
              <table class="table table-vcenter table-hover mb-0">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Nota de crédito</th>
                    <th class="text-end">Valor</th>
                    <th>Estado</th>
                    <th>Emitida em</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="credit.loading">
                    <td colspan="6" class="text-center py-4">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr v-for="nc in credit.data" v-else :key="nc.id">
                    <td>
                      <span class="fw-semibold">{{
                        nc.external_reference || nc.order?.code || '—'
                      }}</span>
                      <div v-if="nc.order?.customers?.length">
                        <small class="text-muted">{{ nc.order.customers[0].name }}</small>
                      </div>
                      <div v-if="nc.order?.course_name">
                        <small class="text-muted">{{ nc.order.course_name }}</small>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-purple-lt text-purple font-monospace">{{
                        nc.number || nc.external_id || '—'
                      }}</span>
                      <div v-if="nc.atcud">
                        <small class="text-muted">ATCUD: {{ nc.atcud }}</small>
                      </div>
                    </td>
                    <td class="text-end fw-semibold">{{ formatKz(nc.amount) }}</td>
                    <td>
                      <span v-if="nc.status === 'A'" class="badge bg-red text-white">Anulada</span>
                      <span v-else class="badge bg-green text-white">Válida</span>
                    </td>
                    <td>
                      <span class="text-nowrap">{{ formatDate(nc.created_at) }}</span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-icon" title="Ver PDF" @click="openPdf(nc)">
                        <IconFileTypePdf :size="20" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!credit.loading && !credit.data.length">
                    <td colspan="6" class="text-center text-muted py-4">
                      Ainda não há notas de crédito.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="d-flex justify-content-between px-3 py-2">
              <div class="text-muted small align-self-center">
                {{ credit.total }} nota(s) de crédito
              </div>
              <BPagination
                v-model="credit.page"
                :total-rows="credit.total"
                :per-page="credit.perPage"
              />
            </div>
          </div>

          <!-- TAB: Cursos -->
          <div v-show="activeTab === 'courses'">
            <div class="table-responsive">
              <table class="table table-vcenter table-hover mb-0">
                <thead>
                  <tr>
                    <th style="width: 64px">ID</th>
                    <th>Curso</th>
                    <th class="text-end">Preço</th>
                    <th>Produto Vendus</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="courses.loading">
                    <td colspan="5" class="text-center py-4">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr v-for="c in courses.data" v-else :key="c.id">
                    <td class="text-muted font-monospace">{{ c.id }}</td>
                    <td>
                      <span class="fw-semibold">{{ c.name }}</span>
                      <div>
                        <small class="text-muted">{{ c.slug }}</small>
                      </div>
                    </td>
                    <td class="text-end">{{ formatKz(c.price) }}</td>
                    <td>
                      <template v-if="c.vendus_product_id">
                        <div class="fw-semibold">{{ c.vendus_product_name || '(sem nome)' }}</div>
                        <small class="text-muted font-monospace">#{{ c.vendus_product_id }}</small>
                      </template>
                      <span v-else class="text-muted">— não ligado —</span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary" @click="openProduct(c)">
                        <IconLink :size="14" class="me-1" />{{
                          c.vendus_product_id ? 'Alterar' : 'Ligar'
                        }}
                      </button>
                      <button
                        v-if="c.vendus_product_id"
                        class="btn btn-sm btn-icon text-danger ms-1"
                        title="Desligar"
                        @click="unlinkCourse(c)"
                      >
                        <IconUnlink :size="14" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!courses.loading && !courses.data.length">
                    <td colspan="5" class="text-center text-muted py-4">Sem cursos.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: Métodos de pagamento -->
          <div v-show="activeTab === 'methods'">
            <div class="px-3 pt-2 text-muted small">
              Liga cada método de pagamento local ao método correspondente na conta Vendus. Usado
              para registar o pagamento em documentos pagos no ato (FR/RG).
            </div>
            <div class="table-responsive">
              <table class="table table-vcenter table-hover mb-0">
                <thead>
                  <tr>
                    <th>Método local</th>
                    <th><code>payment_type</code></th>
                    <th>Método Vendus</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="methods.loading">
                    <td colspan="4" class="text-center py-4">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr v-for="m in methods.data" v-else :key="m.id">
                    <td>
                      <span class="fw-semibold">{{ m.label }}</span>
                    </td>
                    <td class="text-muted font-monospace">{{ m.local_key }}</td>
                    <td>
                      <template v-if="m.vendus_id">
                        <div class="fw-semibold">{{ m.vendus_name || '(sem nome)' }}</div>
                        <small class="text-muted font-monospace">#{{ m.vendus_id }}</small>
                      </template>
                      <span v-else class="text-muted">— não ligado —</span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary" @click="openMethod(m)">
                        <IconLink :size="14" class="me-1" />{{ m.vendus_id ? 'Alterar' : 'Ligar' }}
                      </button>
                      <button
                        v-if="!m.vendus_id"
                        class="btn btn-sm btn-outline-success ms-1"
                        title="Criar no Vendus e ligar"
                        @click="openCreate(m)"
                      >
                        <IconPlus :size="14" class="me-1" />Criar
                      </button>
                      <button
                        v-if="m.vendus_id"
                        class="btn btn-sm btn-icon text-danger ms-1"
                        title="Desligar"
                        @click="unlinkMethod(m)"
                      >
                        <IconUnlink :size="14" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!methods.loading && !methods.data.length">
                    <td colspan="4" class="text-center text-muted py-4">Sem métodos.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: emitir factura ════════════════════════════════════════ -->
    <div
      v-if="emit.open"
      class="modal d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      @click.self="emit.open = false"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              <IconFilePlus :size="18" class="me-2 text-primary" />Faturar — {{ emit.order?.code }}
            </h3>
            <button type="button" class="btn-close" @click="emit.open = false"></button>
          </div>
          <div class="modal-body">
            <div class="card mb-3" style="background: var(--tblr-bg-surface-secondary)">
              <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <small class="text-muted d-block">Cliente do pedido</small
                    ><span class="fw-semibold">{{ emit.order?.customer_name || '—' }}</span>
                  </div>
                  <div class="text-end lh-sm">
                    <div>
                      <small class="text-muted">Total sistema:</small>
                      <span class="fw-semibold">{{ formatKz(emit.order?.amount_paid) }}</span>
                    </div>
                    <div>
                      <small class="text-muted">Total Vendus:</small>
                      <span class="fw-semibold" :class="{ 'text-red': emitMismatch }">{{
                        formatKz(emitVendusTotal)
                      }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="emitMismatch" class="text-red small mt-2">
                  <IconAlertTriangle :size="13" /> Os totais diferem: o documento Vendus usa
                  <strong>preço do curso × quantidade</strong>, não o valor efetivamente pago
                  (descontos/cupões). Confirma antes de emitir.
                </div>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label required">Tipo de documento</label>
                <select v-model="emit.form.type" class="form-select">
                  <option value="FR">Factura-Recibo (FR)</option>
                  <option value="FT">Factura (FT)</option>
                  <option value="PF">Proforma (PF)</option>
                </select>
              </div>
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label required mb-0">Cliente</label>
                  <div class="client-toggle">
                    <button
                      type="button"
                      class="client-toggle-btn"
                      :class="{ active: emit.form.clientMode === 'existing' }"
                      @click="emit.form.clientMode = 'existing'"
                    >
                      <IconUserSearch :size="14" /><span>Vendus</span>
                    </button>
                    <button
                      type="button"
                      class="client-toggle-btn"
                      :class="{ active: emit.form.clientMode === 'new' }"
                      @click="emit.form.clientMode = 'new'"
                    >
                      <IconUserPlus :size="14" /><span>Novo / pedido</span>
                    </button>
                  </div>
                </div>

                <div v-if="emit.form.clientMode === 'existing'">
                  <BFormInput
                    v-model="clientSearch"
                    placeholder="Pesquisar por nome ou NIF no Vendus"
                    debounce="400"
                    class="mb-2"
                  />
                  <div class="client-picker">
                    <div v-if="clientsLoading" class="text-center py-3">
                      <span class="spinner-border spinner-border-sm" />
                    </div>
                    <button
                      v-for="c in vendusClients"
                      v-else
                      :key="c.id"
                      type="button"
                      class="client-card"
                      :class="{ 'client-card--active': emit.form.existingClientId === c.id }"
                      @click="emit.form.existingClientId = c.id"
                    >
                      <span
                        class="avatar avatar-sm rounded-circle flex-shrink-0"
                        :class="`bg-${avatarColor(c.id)}-lt text-${avatarColor(c.id)}`"
                        >{{ initials(c.name) }}</span
                      >
                      <div class="client-info">
                        <div class="fw-semibold text-truncate">{{ c.name }}</div>
                        <div class="client-meta">
                          <span class="d-flex align-items-center gap-1"
                            ><IconId :size="12" /> {{ c.fiscal_id || 'Consumidor Final' }}</span
                          >
                        </div>
                      </div>
                      <span class="check-mark"
                        ><IconCheck v-if="emit.form.existingClientId === c.id" :size="16"
                      /></span>
                    </button>
                    <div
                      v-if="!clientsLoading && !vendusClients.length"
                      class="text-center text-muted py-4"
                    >
                      <IconUserOff :size="28" class="mb-2 opacity-50" />
                      <div class="small">Nenhum cliente encontrado no Vendus.</div>
                    </div>
                  </div>
                </div>

                <div v-else class="new-client-grid">
                  <div>
                    <label class="form-label small mb-1"
                      >Nome <span class="text-danger">*</span></label
                    ><input
                      v-model="emit.form.newClient.name"
                      type="text"
                      class="form-control"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label class="form-label small mb-1">NIF / Fiscal ID</label
                    ><input
                      v-model="emit.form.newClient.fiscal_id"
                      type="text"
                      class="form-control"
                      placeholder="(vazio = CF)"
                    />
                  </div>
                  <div>
                    <label class="form-label small mb-1">País</label>
                    <select v-model="emit.form.newClient.country" class="form-select">
                      <option value="AO">Angola</option>
                      <option value="PT">Portugal</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label small mb-1">Email</label
                    ><input
                      v-model="emit.form.newClient.email"
                      type="email"
                      class="form-control"
                      placeholder="cliente@dominio.ao"
                    />
                  </div>
                  <div>
                    <label class="form-label small mb-1">Telefone</label
                    ><input
                      v-model="emit.form.newClient.phone"
                      type="tel"
                      class="form-control"
                      placeholder="+244 9XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              <div class="col-12">
                <label class="form-label">Observações</label
                ><textarea
                  v-model="emit.form.notes"
                  class="form-control"
                  rows="2"
                  placeholder="Notas no documento (opcional)..."
                ></textarea>
              </div>
              <div class="col-12">
                <label class="form-check"
                  ><input
                    v-model="emit.form.send_email"
                    class="form-check-input"
                    type="checkbox"
                  /><span class="form-check-label"
                    >Enviar documento por email após gerar</span
                  ></label
                >
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost-secondary" @click="emit.open = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="emit.loading"
              @click="confirmEmit"
            >
              <span v-if="emit.loading" class="spinner-border spinner-border-sm me-1" /><IconBolt
                v-else
                :size="14"
                class="me-1"
              />Gerar documento
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: conectar documento existente ══════════════════════════ -->
    <div
      v-if="conn.open"
      class="modal d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      @click.self="conn.open = false"
    >
      <div class="modal-dialog modal-dialog-centered modal-xl" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              <IconPlugConnected :size="18" class="me-2 text-primary" />Conectar documento —
              {{ conn.order?.code }}
            </h3>
            <button type="button" class="btn-close" @click="conn.open = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <input
                  v-model="conn.search.q"
                  class="form-control"
                  placeholder="Código ou nome"
                  @keyup.enter="searchDocs"
                />
              </div>
              <div class="col-md-3">
                <input
                  v-model="conn.search.fiscal_id"
                  class="form-control"
                  placeholder="NIF"
                  @keyup.enter="searchDocs"
                />
              </div>
              <div class="col-md-3">
                <button class="btn btn-primary w-100" :disabled="conn.loading" @click="searchDocs">
                  <IconSearch :size="14" class="me-1" />Pesquisar
                </button>
              </div>
            </div>

            <div
              class="table-responsive border rounded"
              style="max-height: 320px; overflow-y: auto"
            >
              <table class="table table-vcenter table-hover mb-0">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Cliente</th>
                    <th class="text-end">Valor</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="conn.loading">
                    <td colspan="5" class="text-center py-3">
                      <span class="spinner-border spinner-border-sm" />
                    </td>
                  </tr>
                  <tr v-for="d in conn.results" v-else :key="d.id">
                    <td>
                      <span class="font-monospace">{{ d.number || d.id }}</span>
                      <div>
                        <small class="text-muted">{{ d.type }}</small>
                      </div>
                    </td>
                    <td>{{ d.client_name || d.client?.name || '—' }}</td>
                    <td class="text-end">{{ formatKz(d.amount_gross ?? d.amount) }}</td>
                    <td>{{ formatDate(d.date) }}</td>
                    <td class="text-end">
                      <button
                        class="btn btn-sm btn-outline-primary"
                        :disabled="conn.connecting"
                        @click="confirmConnect(d)"
                      >
                        Ligar
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!conn.loading && conn.searched && !conn.results.length">
                    <td colspan="5" class="text-center text-muted py-3">
                      Nenhum documento encontrado.
                    </td>
                  </tr>
                  <tr v-if="!conn.searched">
                    <td colspan="5" class="text-center text-muted py-3">
                      Pesquise para ver resultados.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <details class="mt-3">
              <summary class="text-muted small" style="cursor: pointer">
                Conectar documento de outro software (manual)
              </summary>
              <div class="row g-2 mt-1">
                <div class="col-md-4">
                  <input
                    v-model="conn.manual.number"
                    class="form-control"
                    placeholder="Nº do documento"
                  />
                </div>
                <div class="col-md-3">
                  <input
                    v-model="conn.manual.external_id"
                    class="form-control"
                    placeholder="ID externo"
                  />
                </div>
                <div class="col-md-2">
                  <input v-model="conn.manual.type" class="form-control" placeholder="Tipo" />
                </div>
                <div class="col-md-3">
                  <button
                    class="btn btn-outline-secondary w-100"
                    :disabled="conn.connecting"
                    @click="confirmConnectManual"
                  >
                    Ligar manual
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: ligar curso a produto Vendus ══════════════════════════ -->
    <div
      v-if="prod.open"
      class="modal d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      @click.self="prod.open = false"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              <IconLink :size="18" class="me-2 text-primary" />Produto Vendus —
              {{ prod.course?.name }}
            </h3>
            <button type="button" class="btn-close" @click="prod.open = false"></button>
          </div>
          <div class="modal-body">
            <BFormInput
              v-model="prod.search"
              placeholder="Pesquisar produto no Vendus"
              debounce="400"
              class="mb-2"
              @update:model-value="searchProducts"
            />
            <div class="client-picker" style="max-height: 300px">
              <div v-if="prod.loading" class="text-center py-3">
                <span class="spinner-border spinner-border-sm" />
              </div>
              <button
                v-for="p in prod.results"
                v-else
                :key="p.id"
                type="button"
                class="client-card"
                @click="confirmProduct(p)"
              >
                <div class="client-info">
                  <div class="fw-semibold text-truncate">{{ p.title || p.name || '—' }}</div>
                  <div class="client-meta">
                    <span class="font-monospace">#{{ p.id }}</span>
                    <span v-if="p.reference">ref: {{ p.reference }}</span>
                    <span v-if="p.gross_price != null" class="fw-semibold text-body">{{
                      formatKz(p.gross_price)
                    }}</span>
                    <span v-if="p.tax_id">IVA: {{ p.tax_id }}</span>
                    <span v-if="p.unit_id">un: {{ p.unit_id }}</span>
                  </div>
                </div>
                <span class="check-mark"><IconLink :size="16" /></span>
              </button>
              <div
                v-if="!prod.loading && prod.searched && !prod.results.length"
                class="text-center text-muted py-4 small"
              >
                Nenhum produto encontrado.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: ligar método local a método Vendus ════════════════════ -->
    <div
      v-if="pm.open"
      class="modal d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      @click.self="pm.open = false"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              <IconLink :size="18" class="me-2 text-primary" />Método Vendus —
              {{ pm.method?.label }}
            </h3>
            <button type="button" class="btn-close" @click="pm.open = false"></button>
          </div>
          <div class="modal-body">
            <div class="client-picker" style="max-height: 320px">
              <div v-if="pm.loading" class="text-center py-3">
                <span class="spinner-border spinner-border-sm" />
              </div>
              <button
                v-for="v in pm.results"
                v-else
                :key="v.id"
                type="button"
                class="client-card"
                :class="{ 'client-card--active': String(pm.method?.vendus_id) === String(v.id) }"
                @click="confirmMethod(v)"
              >
                <div class="client-info">
                  <div class="fw-semibold text-truncate">{{ v.title || '—' }}</div>
                  <div class="client-meta">
                    <span class="font-monospace">#{{ v.id }}</span>
                    <span v-if="v.type">{{ v.type }}</span>
                    <span v-if="v.status === 'off'" class="badge bg-secondary-lt">inativo</span>
                  </div>
                </div>
                <span class="check-mark"><IconLink :size="16" /></span>
              </button>
              <div
                v-if="!pm.loading && !pm.results.length"
                class="text-center text-muted py-4 small"
              >
                Nenhum método de pagamento na conta Vendus.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ MODAL: criar método de pagamento no Vendus ═══════════════════ -->
    <div
      v-if="pmNew.open"
      class="modal d-block"
      style="background: rgba(0, 0, 0, 0.5)"
      @click.self="pmNew.open = false"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">
              <IconPlus :size="18" class="me-2 text-success" />Criar método no Vendus
            </h3>
            <button type="button" class="btn-close" @click="pmNew.open = false"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted small">
              Cria o método na conta Vendus e liga-o ao método local
              <strong>{{ pmNew.method?.label }}</strong
              >.
            </p>
            <div class="mb-3">
              <label class="form-label required">Nome</label>
              <input
                v-model="pmNew.form.title"
                type="text"
                class="form-control"
                placeholder="Ex: Multicaixa Express"
              />
            </div>
            <div class="mb-2">
              <label class="form-label required">Tipo</label>
              <select v-model="pmNew.form.type" class="form-select">
                <option v-for="t in PM_TYPES" :key="t.value" :value="t.value">
                  {{ t.label }} ({{ t.value }})
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost-secondary" @click="pmNew.open = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-success"
              :disabled="pmNew.saving"
              @click="confirmCreate"
            >
              <span v-if="pmNew.saving" class="spinner-border spinner-border-sm me-1" /><IconPlus
                v-else
                :size="14"
                class="me-1"
              />Criar e ligar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

import PeriodPicker from '@/common/presentation/components/PeriodPicker.vue'

import {
  IconFileAlert,
  IconFileCheck,
  IconPlugConnected,
  IconBolt,
  IconSearch,
  IconCheck,
  IconFilePlus,
  IconFileTypePdf,
  IconReceiptOff,
  IconUserSearch,
  IconUserPlus,
  IconUserOff,
  IconId,
  IconLink,
  IconUnlink,
  IconAlertTriangle,
  IconPlus,
  IconReceiptRefund,
} from '@tabler/icons-vue'

// Tipos de método de pagamento aceites pelo Vendus (classificação oficial).
const PM_TYPES = [
  { value: 'CD', label: 'Multibanco' },
  { value: 'TB', label: 'Transferência Bancária' },
  { value: 'NU', label: 'Numerário' },
  { value: 'CC', label: 'Cartão de Crédito' },
  { value: 'DNP', label: 'Conta Corrente' },
  { value: 'MBWAY', label: 'MB WAY' },
  { value: 'VENDUSPAY', label: 'Vendus Pay' },
  { value: 'OU', label: 'Outro' },
] as const
// Tipo Vendus pré-selecionado conforme o método local (Express/QR→Multibanco; Referência→Transferência).
const PM_DEFAULT_TYPE: Record<string, string> = {
  express: 'CD',
  aexpress: 'CD',
  qr: 'CD',
  ref: 'TB',
  aref: 'TB',
}
import { InvoicesService } from '../../domain/service/InvoicesService'
import ConfigService from '@central/common/domain/services/ConfigService'
import notification from '@common/application/utils/notification'

// ─── Helpers ───────────────────────────────────────────────────────────
function initials(name = ''): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
}
const AVATAR_COLORS = ['blue', 'teal', 'pink', 'purple', 'orange', 'cyan', 'green', 'red'] as const
function avatarColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length]
}
function formatKz(value: any) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  })
    .format(Number(value) || 0)
    .replace('AOA', 'Kz')
}
function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}
const PAY: Record<string, string> = {
  express: 'Express',
  aexpress: 'Express',
  ref: 'Referência',
  qr: 'QR',
}
function paymentLabel(t?: string) {
  return t ? PAY[t] || t : '—'
}

// true quando o valor da fatura no Vendus difere do valor efetivamente pago
function amountMismatch(inv: any) {
  const a = Number(inv.amount)
  const b = Number(inv.order?.amount_paid)
  if (!inv.order || isNaN(a) || isNaN(b)) return false
  return Math.abs(a - b) > 0.01
}
function apiError(e: any, fallback: string) {
  notification.error(e?.response?.data?.message || fallback)
}

const activeTab = ref<'pending' | 'generated' | 'credit' | 'courses' | 'methods'>('pending')
const mode = ref<'tests' | 'normal'>('normal')

// ─── Por faturar ───────────────────────────────────────────────────────
const pending = reactive({
  data: [] as any[],
  total: 0,
  page: 1,
  paid_at_from: null,
  paid_at_to: null,
  perPage: 10,
  search: '',
  loading: false,
})
function onPeriodApply(p) {
  pending.paid_at_from = p.start
  pending.paid_at_to = p.end
  loadPending()
}
async function loadPending() {
  pending.loading = true
  try {
    const res = await InvoicesService.pending({
      page: pending.page,
      perPage: pending.perPage,
      search: pending.search || undefined,
      paid_at_from: pending.paid_at_from,
      paid_at_to: pending.paid_at_to,
    })
    pending.data = res.data.data || []
    pending.total = res.data.total || 0
  } catch (e) {
    apiError(e, 'Erro ao carregar encomendas.')
  } finally {
    pending.loading = false
  }
}
watch(() => pending.page, loadPending)
watch(
  () => pending.search,
  () => {
    pending.page = 1
    loadPending()
  },
)

// ─── Facturas ──────────────────────────────────────────────────────────
const invoices = reactive({
  data: [] as any[],
  total: 0,
  page: 1,
  perPage: 10,
  search: '',
  loading: false,
})
async function loadInvoices() {
  invoices.loading = true
  try {
    // Faturas = documentos de venda; as notas de crédito têm a sua própria tab.
    const res = await InvoicesService.index({
      page: invoices.page,
      perPage: invoices.perPage,
      search: invoices.search || undefined,
      with: ['order'],
      filters: [{ field: 'type', operator: '!=', value: 'NC' }],
    })
    invoices.data = res.data.data || []
    invoices.total = res.data.total || 0
  } catch (e) {
    apiError(e, 'Erro ao carregar documentos.')
  } finally {
    invoices.loading = false
  }
}
watch(() => invoices.page, loadInvoices)
watch(
  () => invoices.search,
  () => {
    invoices.page = 1
    loadInvoices()
  },
)

// ─── Notas de crédito ──────────────────────────────────────────────────
const credit = reactive({
  data: [] as any[],
  total: 0,
  page: 1,
  perPage: 10,
  search: '',
  loading: false,
})
async function loadCreditNotes() {
  credit.loading = true
  try {
    const res = await InvoicesService.index({
      page: credit.page,
      perPage: credit.perPage,
      search: credit.search || undefined,
      with: ['order'],
      filters: [{ field: 'type', operator: '=', value: 'NC' }],
    })
    credit.data = res.data.data || []
    credit.total = res.data.total || 0
  } catch (e) {
    apiError(e, 'Erro ao carregar notas de crédito.')
  } finally {
    credit.loading = false
  }
}
watch(() => credit.page, loadCreditNotes)
watch(
  () => credit.search,
  () => {
    credit.page = 1
    loadCreditNotes()
  },
)

// ─── Cursos ────────────────────────────────────────────────────────────
const courses = reactive({ data: [] as any[], loading: false })
async function loadCourses() {
  courses.loading = true
  try {
    courses.data = (await InvoicesService.courses()).data.data || []
  } catch (e) {
    apiError(e, 'Erro ao carregar cursos.')
  } finally {
    courses.loading = false
  }
}

// ─── Métodos de pagamento ──────────────────────────────────────────────
const methods = reactive({ data: [] as any[], loading: false })
async function loadMethods() {
  methods.loading = true
  try {
    methods.data = (await InvoicesService.paymentMethods()).data.data || []
  } catch (e) {
    apiError(e, 'Erro ao carregar métodos.')
  } finally {
    methods.loading = false
  }
}

watch(activeTab, (t) => {
  if (t === 'generated' && !invoices.data.length) loadInvoices()
  if (t === 'credit' && !credit.data.length) loadCreditNotes()
  if (t === 'courses' && !courses.data.length) loadCourses()
  if (t === 'methods' && !methods.data.length) loadMethods()
})

// ─── Modal: emitir ─────────────────────────────────────────────────────
const emptyNewClient = () => ({ name: '', fiscal_id: '', email: '', phone: '', country: 'AO' })
const emit = reactive({
  open: false,
  loading: false,
  order: null as any,
  form: {
    type: 'FR',
    clientMode: 'existing' as 'existing' | 'new',
    existingClientId: null as number | null,
    newClient: emptyNewClient(),
    notes: '',
    send_email: true,
  },
})
// O documento Vendus passa a refletir o valor efetivamente pago: o desconto
// (cupão/promoção/cartão) é aplicado na linha, logo o total = amount_paid.
const emitVendusTotal = computed(() => Number(emit.order?.amount_paid) || 0)
const emitMismatch = computed(() => {
  const sys = Number(emit.order?.amount_paid)
  return !isNaN(sys) && Math.abs(emitVendusTotal.value - sys) > 0.01
})
function openEmit(order: any) {
  emit.order = order
  emit.form = {
    type: 'FR',
    clientMode: 'existing',
    existingClientId: null,
    newClient: {
      ...emptyNewClient(),
      name: order.customer_name || '',
      email: order.customer_email || '',
      phone: order.customer_phone || '',
    },
    notes: '',
    send_email: true,
  }
  clientSearch.value = ''
  vendusClients.value = []
  emit.open = true
}
async function confirmEmit() {
  emit.loading = true
  try {
    const f = emit.form
    const client =
      f.clientMode === 'existing'
        ? f.existingClientId
          ? { id: f.existingClientId }
          : {}
        : { ...f.newClient }
    await InvoicesService.emit({
      order_id: emit.order.id,
      type: f.type,
      client,
      notes: f.notes,
      send_email: f.send_email,
    })
    notification.success('Documento emitido com sucesso.')
    emit.open = false
    await loadPending()
    invoices.data = []
    if (activeTab.value === 'generated') loadInvoices()
  } catch (e) {
    apiError(e, 'Erro ao emitir o documento.')
  } finally {
    emit.loading = false
  }
}

// Picker de clientes Vendus (no modal de emissão)
const clientSearch = ref('')
const clientsLoading = ref(false)
const vendusClients = ref<any[]>([])
watch(clientSearch, async (q) => {
  if (emit.form.clientMode !== 'existing') return
  clientsLoading.value = true
  try {
    vendusClients.value = (await InvoicesService.searchClients({ q })).data.data || []
  } catch {
    vendusClients.value = []
  } finally {
    clientsLoading.value = false
  }
})

// ─── Modal: conectar ───────────────────────────────────────────────────
const conn = reactive({
  open: false,
  order: null as any,
  loading: false,
  connecting: false,
  searched: false,
  search: { q: '', fiscal_id: '' },
  results: [] as any[],
  manual: { number: '', external_id: '', type: 'FT' },
})
function openConnect(order: any) {
  conn.order = order
  conn.search = { q: '', fiscal_id: '' }
  conn.results = []
  conn.searched = false
  conn.manual = { number: '', external_id: '', type: 'FT' }
  conn.open = true
}
async function searchDocs() {
  conn.loading = true
  conn.searched = true
  try {
    conn.results =
      (
        await InvoicesService.searchVendus({
          q: conn.search.q || undefined,
          fiscal_id: conn.search.fiscal_id || undefined,
        })
      ).data.data || []
  } catch (e) {
    conn.results = []
    apiError(e, 'Erro ao pesquisar no Vendus.')
  } finally {
    conn.loading = false
  }
}
async function confirmConnect(doc: any) {
  conn.connecting = true
  try {
    await InvoicesService.connect({ order_id: conn.order.id, provider: 'vendus', vendusId: doc.id })
    notification.success('Documento conectado à venda.')
    conn.open = false
    await loadPending()
    invoices.data = []
    if (activeTab.value === 'generated') loadInvoices()
  } catch (e) {
    apiError(e, 'Erro ao conectar o documento.')
  } finally {
    conn.connecting = false
  }
}
async function confirmConnectManual() {
  if (!conn.manual.number && !conn.manual.external_id) {
    notification.error('Indique o nº ou ID externo.')
    return
  }
  conn.connecting = true
  try {
    await InvoicesService.connect({
      order_id: conn.order.id,
      provider: 'other',
      number: conn.manual.number,
      external_id: conn.manual.external_id,
      type: conn.manual.type,
      amount: conn.order.amount_paid,
    })
    notification.success('Documento conectado à venda.')
    conn.open = false
    await loadPending()
  } catch (e) {
    apiError(e, 'Erro ao conectar o documento.')
  } finally {
    conn.connecting = false
  }
}

// ─── PDF / anular ──────────────────────────────────────────────────────
async function openPdf(inv: any) {
  try {
    // O PDF é servido pelo backoffice do Vendus com a sessão do browser do admin;
    // basta abrir o link num separador novo (o browser inclui o cookie da sessão).
    const url = (await InvoicesService.pdf(inv.id)).data.url
    if (url) window.open(url, '_blank')
    else notification.error('PDF indisponível para este documento.')
  } catch (e) {
    apiError(e, 'Erro ao obter o PDF.')
  }
}
async function cancelInvoice(inv: any) {
  if (!confirm(`Anular o documento ${inv.number || inv.external_id}?`)) return
  try {
    await InvoicesService.cancel(inv.id)
    notification.success('Documento anulado.')
    loadInvoices()
  } catch (e) {
    apiError(e, 'Erro ao anular o documento.')
  }
}

// ─── Modal: produto Vendus (Cursos) ────────────────────────────────────
const prod = reactive({
  open: false,
  course: null as any,
  search: '',
  results: [] as any[],
  loading: false,
  searched: false,
})
function openProduct(course: any) {
  prod.course = course
  prod.search = ''
  prod.results = []
  prod.searched = false
  prod.open = true
  searchProducts()
}
async function searchProducts() {
  prod.loading = true
  prod.searched = true
  try {
    prod.results = (await InvoicesService.searchProducts({ q: prod.search })).data.data || []
  } catch (e) {
    prod.results = []
    apiError(e, 'Erro ao pesquisar produtos.')
  } finally {
    prod.loading = false
  }
}
async function confirmProduct(p: any) {
  try {
    await InvoicesService.connectCourse(prod.course.id, String(p.id), p.title || p.name || null)
    notification.success('Curso ligado ao produto Vendus.')
    prod.open = false
    loadCourses()
  } catch (e) {
    apiError(e, 'Erro ao ligar o produto.')
  }
}
async function unlinkCourse(c: any) {
  try {
    await InvoicesService.connectCourse(c.id, null)
    notification.success('Curso desligado.')
    loadCourses()
  } catch (e) {
    apiError(e, 'Erro ao desligar.')
  }
}

// ─── Modal: método de pagamento Vendus ─────────────────────────────────
const pm = reactive({ open: false, method: null as any, results: [] as any[], loading: false })
async function openMethod(method: any) {
  pm.method = method
  pm.results = []
  pm.open = true
  pm.loading = true
  try {
    pm.results = (await InvoicesService.searchPaymentMethods()).data.data || []
  } catch (e) {
    pm.results = []
    apiError(e, 'Erro ao carregar métodos do Vendus.')
  } finally {
    pm.loading = false
  }
}
// Modal: criar método no Vendus (nome/tipo à escolha) e ligar ao método local.
const pmNew = reactive({
  open: false,
  method: null as any,
  saving: false,
  form: { title: '', type: 'CD' },
})
function openCreate(m: any) {
  pmNew.method = m
  pmNew.form = { title: m.label || '', type: PM_DEFAULT_TYPE[m.local_key] || 'OU' }
  pmNew.open = true
}
async function confirmCreate() {
  if (!pmNew.form.title.trim()) {
    notification.error('Indique o nome do método.')
    return
  }
  pmNew.saving = true
  try {
    const created = (
      await InvoicesService.createPaymentMethod(pmNew.form.title.trim(), pmNew.form.type)
    ).data.method
    await InvoicesService.connectPaymentMethod(
      pmNew.method.local_key,
      String(created.id),
      created.title || pmNew.form.title.trim(),
    )
    notification.success('Método criado no Vendus e ligado.')
    pmNew.open = false
    loadMethods()
  } catch (e) {
    apiError(e, 'Erro ao criar o método.')
  } finally {
    pmNew.saving = false
  }
}
async function confirmMethod(v: any) {
  try {
    await InvoicesService.connectPaymentMethod(pm.method.local_key, String(v.id), v.title || null)
    notification.success('Método ligado ao Vendus.')
    pm.open = false
    loadMethods()
  } catch (e) {
    apiError(e, 'Erro ao ligar o método.')
  }
}
async function unlinkMethod(m: any) {
  try {
    await InvoicesService.connectPaymentMethod(m.local_key, null)
    notification.success('Método desligado.')
    loadMethods()
  } catch (e) {
    apiError(e, 'Erro ao desligar.')
  }
}

// ─── Init ──────────────────────────────────────────────────────────────
onMounted(async () => {
  loadPending()
  try {
    const cfg = (await ConfigService.get()).data
    mode.value = cfg?.invoice_mode === 'tests' ? 'tests' : 'normal'
  } catch {
    /* sem config, fica 'normal' */
  }
})
</script>

<style scoped>
.table-vcenter td,
.table-vcenter th {
  vertical-align: middle;
}
.client-toggle {
  display: inline-flex;
  background: var(--tblr-bg-surface-secondary);
  border: 1px solid var(--tblr-border-color);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}
.client-toggle-btn {
  background: transparent;
  border: 0;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 0.8125rem;
  color: var(--tblr-secondary-color);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
}
.client-toggle-btn:hover {
  color: var(--tblr-body-color);
}
.client-toggle-btn.active {
  background: var(--tblr-card-bg);
  color: var(--tblr-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.client-picker {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--tblr-border-color);
  border-radius: 6px;
  background: var(--tblr-bg-surface);
}
.client-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--tblr-border-color);
  cursor: pointer;
  transition: background 0.12s;
}
.client-card:last-child {
  border-bottom: 0;
}
.client-card:hover {
  background: var(--tblr-bg-surface-secondary);
}
.client-card--active {
  background: var(--tblr-primary-lt) !important;
}
.client-info {
  flex: 1;
  min-width: 0;
}
.client-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 0.75rem;
  color: var(--tblr-secondary-color);
  margin-top: 2px;
}
.check-mark {
  width: 16px;
  color: var(--tblr-primary);
  flex-shrink: 0;
}
.new-client-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
@media (max-width: 576px) {
  .new-client-grid {
    grid-template-columns: 1fr;
  }
}
</style>
