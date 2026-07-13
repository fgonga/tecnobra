<!--
 -   Copyright © 2021 - 2026
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
 -
 -   Parametrização de Faturação (Vendus) — dados fiscais e regras de emissão.
 -   Persiste em `parametrization` (id=1) via /api/v1/config.
 -   Nota: a identidade completa do emitente, série e numeração são geridas na
 -   própria conta Vendus; aqui ficam só os defaults usados na emissão.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="page-header mb-3">
        <div class="row align-items-center">
          <div class="col">
            <h2 class="page-title">Parametrização de Faturação</h2>
            <p class="text-muted mb-0">Dados fiscais e regras de emissão de documentos (Vendus)</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div v-if="message.text" :class="`alert alert-${message.type}`">{{ message.text }}</div>

          <h4 class="mb-3">Emissão</h4>
          <div class="row">
            <div class="col-md-6 mb-3">
              <FormField
                label="Tipo de documento por defeito"
                v-model="form.invoice_default_type"
                type="select"
                :options="[
                  { label: 'Fatura-Recibo (FR)', value: 'FR' },
                  { label: 'Fatura (FT)', value: 'FT' },
                  { label: 'Recibo (RG)', value: 'RG' },
                ]"
              />
              <small class="text-muted">Tipo pré-seleccionado no ecrã de emissão.</small>
            </div>
            <div class="col-md-6 mb-3">
              <FormField
                label="Modo de funcionamento"
                v-model="form.invoice_mode"
                type="select"
                :options="[
                  { label: 'Produção', value: 'normal' },
                  { label: 'Testes (sandbox)', value: 'tests' },
                ]"
              />
              <small class="text-muted">
                Em <code>testes</code> os documentos não são certificados nem comunicados à AGT.
              </small>
            </div>
          </div>

          <hr class="my-4" />
          <h4 class="mb-3">IVA / Imposto</h4>
          <div class="row">
            <div class="col-md-6 mb-3">
              <FormField
                label="Taxa por defeito"
                v-model="form.invoice_tax_id"
                type="select"
                :options="[
                  { label: 'Normal (14%) — NOR', value: 'NOR' },
                  { label: 'Cabinda (1%) — IVA-CAB', value: 'IVA-CAB' },
                  { label: 'Outra (7%) — OUT', value: 'OUT' },
                  { label: 'Reduzida — RED', value: 'RED' },
                  { label: 'Intermédia — INT', value: 'INT' },
                  { label: 'Isento — ISE', value: 'ISE' },
                ]"
              />
            </div>
            <div class="col-md-6 mb-3">
              <FormField
                label="Motivo de isenção (quando ISE)"
                v-model="form.invoice_tax_exemption"
                type="select"
                :options="[
                  { label: '— Nenhum —', value: '' },
                  { label: 'M02 — Não sujeita', value: 'M02' },
                  { label: 'M04 — Regime de Exclusão', value: 'M04' },
                  { label: 'M10 — Art. 12.º a)', value: 'M10' },
                  { label: 'M40 — Outro (art. específico)', value: 'M40' },
                ]"
              />
            </div>
          </div>

          <hr class="my-4" />
          <h4 class="mb-3">Envio</h4>
          <div class="row">
            <div class="col-md-6 mb-3">
              <FormField
                label="Envio automático por e-mail"
                v-model="form.invoice_auto_send_email"
                type="select"
                :options="[{ label: 'Activo', value: 1 }, { label: 'Inactivo', value: 0 }]"
              />
              <small class="text-muted">Quando activo, o documento é enviado ao e-mail do cliente.</small>
            </div>
          </div>

          <div class="d-flex justify-content-end mt-4 gap-2">
            <button class="btn btn-outline-secondary" :disabled="isLoading" @click="load">
              <i class="ti ti-refresh me-1"></i> Buscar do servidor
            </button>
            <button class="btn btn-primary" :disabled="isLoading" @click="save">
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" />
              <i v-else class="ti ti-device-floppy me-1"></i> Guardar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FormField from '@components/FormField.vue'
import ConfigService from '@central/common/domain/services/ConfigService'
import notification from '@common/application/utils/notification'

const isLoading = ref(false)
const message = ref<{ text: string | null; type: string | null }>({ text: null, type: null })

const form = ref({
  invoice_default_type: 'FR',
  invoice_mode: 'normal',
  invoice_tax_id: 'NOR',
  invoice_tax_exemption: '',
  invoice_auto_send_email: 1,
})

async function load() {
  isLoading.value = true
  message.value = { text: null, type: null }
  try {
    const cfg = (await ConfigService.get()).data || {}
    form.value = {
      invoice_default_type: cfg.invoice_default_type ?? 'FR',
      invoice_mode: cfg.invoice_mode ?? 'normal',
      invoice_tax_id: cfg.invoice_tax_id ?? 'NOR',
      invoice_tax_exemption: cfg.invoice_tax_exemption ?? '',
      invoice_auto_send_email: Number(cfg.invoice_auto_send_email ?? 0),
    }
  } catch (e: any) {
    notification.error(e?.response?.data?.message || 'Erro ao carregar configurações.')
  } finally {
    isLoading.value = false
  }
}

async function save() {
  isLoading.value = true
  message.value = { text: null, type: null }
  try {
    await ConfigService.set({
      invoice_default_type: form.value.invoice_default_type,
      invoice_mode: form.value.invoice_mode,
      invoice_tax_id: form.value.invoice_tax_id,
      invoice_tax_exemption: form.value.invoice_tax_exemption || null,
      invoice_auto_send_email: Number(form.value.invoice_auto_send_email),
    })
    notification.success('Configurações de faturação guardadas.')
  } catch (e: any) {
    notification.error(e?.response?.data?.message || 'Erro ao guardar.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>
