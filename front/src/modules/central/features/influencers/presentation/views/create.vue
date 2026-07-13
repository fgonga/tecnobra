<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->

<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar parceiro' : 'Adicionar parceiro'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy || isLoading"
    @submit="handleSubmit"
  >
    <div class="row">

      <!-- Identificação -->
      <div class="col-12 mb-2">
        <h6 class="text-muted fw-semibold text-uppercase" style="font-size:0.7rem;letter-spacing:.08em">Identificação</h6>
      </div>

      <FormField
        label="Nome completo"
        v-model="form.name"
        required
        type="text"
        :validationError="v$.name.$error ? v$.name.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('name')"
        columnClass="col-md-6"
      />
      <FormField
        label="Telefone"
        v-model="form.phone"
        type="string"
        :serverError="form.errors?.get('phone')"
        columnClass="col-md-6"
      />
      <FormField
        label="E-mail"
        v-model="form.email"
        type="string"
        :serverError="form.errors?.get('email')"
        columnClass="col-md-6"
      />
      <FormField
        label="Estado"
        v-model="form.status"
        required
        type="select"
        :options="[
          { label: 'Activo', value: true },
          { label: 'Inactivo', value: false }
        ]"
        :validationError="v$.status.$error ? v$.status.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('status')"
        columnClass="col-md-6"
      />

      <!-- Comissões -->
      <div class="col-12 mt-3 mb-2">
        <h6 class="text-muted fw-semibold text-uppercase" style="font-size:0.7rem;letter-spacing:.08em">Comissões & Cupão</h6>
      </div>

      <CouponEntity
        label="Cupão"
        v-model="form.coupon"
        type="string"
        required
        :validationError="v$.coupon.$error ? v$.coupon.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('coupon')"
        columnClass="col-md-6"
      />
      <FormField
        label="Comissão (%)"
        v-model="form.commission"
        type="number"
        required
        min="0"
        max="100"
        :serverError="form.errors?.get('commission')"
        columnClass="col-md-6"
      />

      <!-- Dados bancários & repasse -->
      <div class="col-12 mt-3 mb-2">
        <h6 class="text-muted fw-semibold text-uppercase" style="font-size:0.7rem;letter-spacing:.08em">Conta bancária & Repasse</h6>
      </div>

      <FormField
        label="Banco"
        v-model="form.bank_name"
        type="select"
        :options="ANGOLA_BANKS"
        :serverError="form.errors?.get('bank_name')"
        columnClass="col-md-6"
      />
      <FormField
        label="Titular da conta"
        v-model="form.bank_account_name"
        type="text"
        :serverError="form.errors?.get('bank_account_name')"
        columnClass="col-md-6"
      />
      <FormField
        label="IBAN / Número de conta"
        v-model="form.bank_account_number"
        type="text"
        placeholder="AO06..."
        :serverError="form.errors?.get('bank_account_number')"
        columnClass="col-md-6"
      />
      <div class="col-md-6 mb-3">
        <FormField
          label="Mínimo de repasse (Kz)"
          v-model="form.min_payout_kz"
          type="number"
          min="0"
          step="100"
          :serverError="form.errors?.get('min_payout_kz')"
        />
        <small class="text-muted">Deixar em branco para usar o mínimo global da parametrização.</small>
      </div>

    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { required, maxValue, minValue } from "@common/application/utils/validators";
import ModalForm from "@components/ModalForm.vue";
import FormField from "@components/FormField.vue";
import { useModalForm } from "@common/presentation/hooks/useModalForm";
import { defineProps } from "vue";
import CouponEntity from "@components/entity/CouponEntity.vue";

const ANGOLA_BANKS = [
  { label: 'BAI — Banco Angolano de Investimentos', value: 'BAI — Banco Angolano de Investimentos' },
  { label: 'BFA — Banco de Fomento Angola', value: 'BFA — Banco de Fomento Angola' },
  { label: 'BIC — Banco BIC', value: 'BIC — Banco BIC' },
  { label: 'Millennium Atlântico', value: 'Millennium Atlântico' },
  { label: 'BDA — Banco de Desenvolvimento de Angola', value: 'BDA — Banco de Desenvolvimento de Angola' },
  { label: 'Banco Sol', value: 'Banco Sol' },
  { label: 'BNI — Banco de Negócios Internacional', value: 'BNI — Banco de Negócios Internacional' },
  { label: 'Banco Caixa Geral Angola', value: 'Banco Caixa Geral Angola' },
  { label: 'Standard Bank Angola', value: 'Standard Bank Angola' },
  { label: 'Banco Económico', value: 'Banco Económico' },
  { label: 'BCGA — Banco Caixa Geral Angola', value: 'BCGA — Banco Caixa Geral Angola' },
  { label: 'Banco Kwanza Invest', value: 'Banco Kwanza Invest' },
  { label: 'VTB Bank Angola', value: 'VTB Bank Angola' },
  { label: 'Banco Yetu', value: 'Banco Yetu' },
  { label: 'Outro', value: 'Outro' },
];

interface IPartner {
  id?: number;
  name: string;
  phone: string;
  email: string;
  status: any;
  coupon: any;
  commission: number;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  min_payout_kz: number | null;
}

const defaultPartner: Partial<IPartner> = {
  name: "",
  status: true,
  phone: null,
  email: null,
  coupon: null,
  commission: 0,
  bank_name: null,
  bank_account_name: null,
  bank_account_number: null,
  min_payout_kz: null,
};

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
});

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IPartner>>({
  defaultValues: defaultPartner,
  defaultsRef: () => props.defaults,
  editMode: props.editMode,
  handler: props.handler,
  rules: (form) => ({
    name: { required },
    coupon: { required },
    status: { required },
    commission: { required, maxValue: maxValue(100), minValue: minValue(0) },
  }),
  beforeSend(data) {
    return {
      id:                   data.id,
      name:                 data.name,
      phone:                data.phone,
      email:                data.email,
      coupon_id:            data.coupon?.id,
      commission:           Number(data.commission),
      status:               data.status == 1 ? 1 : 0,
      bank_name:            data.bank_name || null,
      bank_account_name:    data.bank_account_name || null,
      bank_account_number:  data.bank_account_number || null,
      min_payout_kz:        data.min_payout_kz != null && data.min_payout_kz !== '' ? Number(data.min_payout_kz) : null,
    };
  },
});

defineExpose({ show, hide, resetForm, v$ });
</script>
