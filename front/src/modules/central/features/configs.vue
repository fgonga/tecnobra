<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte,
  -  é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
-->

<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="card">
        <div class="card-body">
          <div v-if="message.text" :class="`alert alert-${message.type}`">
            {{ message.text }}
          </div>

          <h4 class="mb-3">Promoções</h4>
          <div class="row">
            <FormField
              label="Promoção ativa"
              v-model="form.promotion_active"
              type="select"
              :options="[
                { label: 'Ativa', value: 1 },
                { label: 'Inativa', value: 0 }
              ]"
              columnClass="col-md-4"
            />

            <FormField
              label="Quantidade atual de promoções"
              v-model="form.promotion_quantity"
              type="number"
              min="0"
              columnClass="col-md-4"
            />

            <FormField
              label="Quantidade máxima permitida"
              v-model="form.promotion_quantity_max"
              type="number"
              min="1"
              columnClass="col-md-4"
            />
          </div>

          <hr class="my-4" />
          <h4 class="mb-3">Checkout</h4>
          <div class="row">
            <div class="col-md-4 mb-3">
              <FormField
                label="Curso predefinido"
                v-model="form.default_course_id"
                type="select"
                :options="courseOptions"
              />
            </div>
            <div class="col-md-4 mb-3">
              <FormField
                label="Intervalo de envio de eventos aos parceiros (segundos)"
                v-model="form.events_dispatch_interval"
                type="number"
                min="1"
                max="3600"
              />
            </div>
          </div>

          <hr class="my-4" />
          <h4 class="mb-3">Financeiro</h4>
          <div class="row">
            <div class="col-md-4 mb-3">
              <FormField
                label="Taxa de encargos de plataforma (%)"
                v-model="form.platform_fee_rate_pct"
                type="number"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div class="col-md-4 mb-3">
              <FormField
                label="Custo por mensagem (Kz)"
                v-model="form.message_cost"
                type="number"
                min="0"
                step="0.01"
              />
              <small class="text-muted">
                Custo de cada SMS (segmento de 161 caracteres)
              </small>
            </div>
          </div>

          <hr class="my-4" />
          <h4 class="mb-3">Repasses automáticos</h4>
          <div class="row">
            <div class="col-md-4 mb-3">
              <FormField
                label="Geração automática de repasses"
                v-model="form.auto_settlements_enabled"
                type="select"
                :options="[
                  { label: 'Activa', value: 1 },
                  { label: 'Inactiva', value: 0 }
                ]"
              />
            </div>
            <div class="col-md-4 mb-3">
              <FormField
                label="1.º dia de repasses a parceiros"
                v-model="form.settlement_day_1"
                type="number"
                min="1"
                max="28"
              />
            </div>
            <div class="col-md-4 mb-3">
              <FormField
                label="2.º dia de repasses a parceiros"
                v-model="form.settlement_day_2"
                type="number"
                min="1"
                max="28"
              />
            </div>
            <div class="col-md-4 mb-3">
              <FormField
                label="Valor mínimo global de repasse (Kz)"
                v-model="form.default_min_payout_kz"
                type="number"
                min="0"
                step="100"
              />
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
import { ref, onMounted } from "vue"
import FormField from "@components/FormField.vue"
import ConfigService from "../common/domain/services/ConfigService";
import { CoursesService } from "../features/courses/domain/service/CoursesService";
const isLoading = ref(false)
const message = ref<{ text: string | null; type: string | null }>({
  text: null,
  type: null,
})
const form = ref({
  promotion_active: 0,
  promotion_quantity: 0,
  promotion_quantity_max: 100,
  default_course_id: null as number | null,
  platform_fee_rate_pct: 2,  // exibido em % (ex.: 2 = 2%)
  events_dispatch_interval: 60,
  auto_settlements_enabled: 1,
  settlement_day_1: 6,
  settlement_day_2: 20,
  default_min_payout_kz: 10000,
  message_cost: 0,
})
const courseOptions = ref<{ label: string; value: number }[]>([])

const buscarConfiguracoes = async () => {
  isLoading.value = true
  message.value = { text: null, type: null }
  ConfigService.get()
    .then((response) => {
      const data = response.data
      // Converte a taxa decimal (0.02) para % (2) para exibição
      if (data.platform_fee_rate !== undefined) {
        data.platform_fee_rate_pct = parseFloat((data.platform_fee_rate * 100).toFixed(4))
      }
      if (data.auto_settlements_enabled !== undefined) {
        data.auto_settlements_enabled = data.auto_settlements_enabled ? 1 : 0
      }
      form.value = { ...form.value, ...data }
      message.value = {
        text: "Configurações carregadas com sucesso!",
        type: "success",
      }}).catch(err => {
    console.error("Erro ao buscar configurações:", err)
    message.value = {
      text: "Falha ao buscar configurações. Verifique a ligação.",
      type: "error",
    }
  }).finally(() => {
    isLoading.value = false
  })

}

const guardarConfiguracoes = async () => {
  isLoading.value = true
  message.value = { text: null, type: null }
  try {
    const { data } = ConfigService.set({
      promotion_active: form.value.promotion_active == 1 ? 1 : 0,
      promotion_quantity: form.value.promotion_quantity,
      promotion_quantity_max: form.value.promotion_quantity_max,
      default_course_id: form.value.default_course_id || null,
      // Converte % (2) de volta para decimal (0.02) antes de enviar
      platform_fee_rate: parseFloat((form.value.platform_fee_rate_pct / 100).toFixed(6)),
      events_dispatch_interval: form.value.events_dispatch_interval,
      auto_settlements_enabled: form.value.auto_settlements_enabled == 1 ? 1 : 0,
      settlement_day_1: form.value.settlement_day_1,
      settlement_day_2: form.value.settlement_day_2,
      default_min_payout_kz: form.value.default_min_payout_kz,
      message_cost: Number(form.value.message_cost) || 0,
    })
    message.value = {
      text: "Parâmetros guardados com sucesso!",
      type: "success",
    }
    console.log("Resposta do servidor:", data)
  } catch (err) {
    console.error("Erro ao guardar parâmetros:", err)
    message.value = {
      text: "Erro ao guardar parâmetros. Verifique a ligação.",
      type: "error",
    }
  } finally {
    isLoading.value = false
  }
}

const carregarCursos = async () => {
  try {
    const { data } = await CoursesService.index({ perPage: 100, page: 1 })
    courseOptions.value = (data.data || data.items || []).map((c: any) => ({
      label: c.name,
      value: c.id,
    }))
  } catch (err) {
    console.error("Erro ao carregar cursos:", err)
  }
}

onMounted(() => {
  buscarConfiguracoes()
  carregarCursos()
})
</script>
