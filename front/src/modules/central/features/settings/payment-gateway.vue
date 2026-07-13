<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
 -
 -   Configurações do Gateway de Pagamento (AppyPay).
 -   Persiste em /api/v1/config (tabela parametrization).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="card">
        <div class="card-body">
          <div v-if="message.text" :class="`alert alert-${message.type}`">
            {{ message.text }}
          </div>

          <h4 class="mb-3">Pagamento</h4>
          <div class="row">
            <div class="col-md-4 mb-3">
              <FormField
                label="Método de pagamento padrão"
                v-model="form.default_payment_method"
                type="select"
                :options="paymentMethodOptions"
              />
              <small class="text-muted">
                Método pré-seleccionado no checkout quando o cliente não escolhe.
              </small>
            </div>

            <div class="col-md-4 mb-3">
              <FormField
                label="Tempo de expiração das referências (minutos)"
                v-model="form.reference_expiration_minutes"
                type="number"
                min="1"
                max="43200"
              />
              <small class="text-muted">
                Tempo de validade da referência gerada antes de expirar (ex.: 1440 = 24 h).
              </small>
            </div>

            <div class="col-md-4 mb-3">
              <FormField
                label="Entidade da referência"
                v-model="form.reference_entity"
                type="text"
                placeholder="Ex.: 00831"
              />
              <small class="text-muted">
                Entidade Multicaixa exibida ao cliente no pagamento por referência.
              </small>
            </div>
          </div>

          <hr class="my-4" />
          <h4 class="mb-3">Métodos disponíveis</h4>
          <div class="row">
            <div class="col-md-4 mb-3">
              <FormField
                label="Multicaixa Express"
                v-model="form.express_enabled"
                type="select"
                :options="enabledOptions"
              />
              <small class="text-muted">Pagamento por push no Multicaixa Express.</small>
            </div>
            <div class="col-md-4 mb-3">
              <FormField
                label="Referência"
                v-model="form.ref_enabled"
                type="select"
                :options="enabledOptions"
              />
              <small class="text-muted">Pagamento por referência Multicaixa.</small>
            </div>
            <div class="col-md-4 mb-3">
              <FormField
                label="QR Code"
                v-model="form.qr_enabled"
                type="select"
                :options="enabledOptions"
              />
              <small class="text-muted">Pagamento por leitura de QR Code.</small>
            </div>
          </div>

          <div class="d-flex justify-content-end mt-4 gap-2">
            <button
              class="btn btn-outline-secondary"
              :disabled="isLoading"
              @click="buscarConfiguracoes"
            >
              <i class="ti ti-refresh me-1"></i> Buscar do servidor
            </button>
            <button
              class="btn btn-primary"
              :disabled="isLoading"
              @click="guardarConfiguracoes"
            >
              <i class="ti ti-device-floppy me-1"></i> Guardar alterações
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
import ConfigService from '../../common/domain/services/ConfigService'

const isLoading = ref(false)
const message = ref<{ text: string | null; type: string | null }>({ text: null, type: null })

const paymentMethodOptions = [
  { label: 'Multicaixa Express', value: 'express' },
  { label: 'Referência', value: 'ref' },
  { label: 'QR Code', value: 'qr' },
]
const enabledOptions = [
  { label: 'Activo', value: 1 },
  { label: 'Inactivo', value: 0 },
]

const form = ref({
  default_payment_method: 'express',
  express_enabled: 1,
  ref_enabled: 1,
  qr_enabled: 1,
  reference_expiration_minutes: 1440,
  reference_entity: '',
})

const buscarConfiguracoes = async () => {
  isLoading.value = true
  message.value = { text: null, type: null }
  try {
    const { data } = await ConfigService.get()
    form.value = {
      default_payment_method: data.default_payment_method ?? 'express',
      express_enabled: data.express_enabled ? 1 : 0,
      ref_enabled: data.ref_enabled ? 1 : 0,
      qr_enabled: data.qr_enabled ? 1 : 0,
      reference_expiration_minutes: data.reference_expiration_minutes ?? 1440,
      reference_entity: data.reference_entity ?? '',
    }
    message.value = { text: 'Configurações carregadas com sucesso!', type: 'success' }
  } catch (err) {
    console.error('Erro ao buscar configurações:', err)
    message.value = { text: 'Falha ao buscar configurações. Verifique a ligação.', type: 'error' }
  } finally {
    isLoading.value = false
  }
}

const guardarConfiguracoes = async () => {
  isLoading.value = true
  message.value = { text: null, type: null }
  try {
    await ConfigService.set({
      default_payment_method: form.value.default_payment_method,
      express_enabled: form.value.express_enabled == 1 ? 1 : 0,
      ref_enabled: form.value.ref_enabled == 1 ? 1 : 0,
      qr_enabled: form.value.qr_enabled == 1 ? 1 : 0,
      reference_expiration_minutes: Number(form.value.reference_expiration_minutes) || 1440,
      reference_entity: (form.value.reference_entity ?? '').trim(),
    })
    message.value = { text: 'Parâmetros guardados com sucesso!', type: 'success' }
  } catch (err) {
    console.error('Erro ao guardar parâmetros:', err)
    message.value = { text: 'Erro ao guardar parâmetros. Verifique a ligação.', type: 'error' }
  } finally {
    isLoading.value = false
  }
}

onMounted(buscarConfiguracoes)
</script>
