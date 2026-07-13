<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
-->

<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar cupom' : 'Adicionar cupom'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy || isLoading"
    @submit="handleSubmit"
  >
    <div class="row">
      <FormField
        label="Código"
        v-model="form.code"
        required
        type="text"
        :validationError="v$.code.$error ? v$.code.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('code')"
        columnClass="col-md-6"
        hint="Código único do cupom (Ex: DESCONTO10)"
      />
      <FormField
        label="Nome"
        v-model="form.name"
        required
        type="text"
        :validationError="v$.name.$error ? v$.name.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('name')"
        columnClass="col-md-6"
      />

      <FormField
        label="Valor (AOA)"
        v-model="form.amount"
        type="number"
        step="0.01"
        :serverError="form.errors?.get('amount')"
        columnClass="col-md-6"
      />

      <FormField
        label="Percentagem (%)"
        v-model="form.percentage"
        type="number"
        step="0.01"
        :serverError="form.errors?.get('percentage')"
        columnClass="col-md-6"
      />

      <FormField
        label="Estado"
        v-model="form.active"
        type="select"
        :options="[
          { label: 'Ativo', value: true },
          { label: 'Inativo', value: false }
        ]"
        :serverError="form.errors?.get('active')"
        columnClass="col-md-6"
      />
      <FormField
        label="Data de Expiração"
        v-model="form.expire_at"
        type="datetime"
        required
        :validationError="v$.expire_at.$error ? v$.expire_at.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('expire_at')"
        columnClass="col-md-6"
      />
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { required, minValue } from "@common/application/utils/validators";
import ModalForm from "@components/ModalForm.vue";
import FormField from "@components/FormField.vue";
import { useModalForm } from "@common/presentation/hooks/useModalForm";
import { defineProps } from "vue";
import {ICoupon} from "../../application/dtos";

import { toData } from "@/common/application/utils/date";
const defaultCoupon: Partial<ICoupon> = {
  name: "",
  code: "",
  amount: 0,
  percentage: 0,
  expire_at: "",
  active: 1,
};

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
});

function formatToInputDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<ICoupon>>({
  defaultValues: defaultCoupon,
  defaultsRef: () => {
    return{
      ...props.defaults
      , expire_at: props.defaults?.expire_at ? formatToInputDate(props.defaults.expire_at) : toData(new Date())
    }
  },
  editMode: props.editMode,
  handler: props.handler,
  rules: (form) => ({
    name: { required },
    code: { required },
    expire_at: {required},
  }),
  beforeSend(data) {
    return {
      ...data,
      amount: data.amount ? Number(data.amount) : null,
      percentage: data.percentage ? Number(data.percentage) : null,
      active: data.active == 1 ? true : false,
    };
  },
});

defineExpose({
  show,
  hide,
  resetForm,
  v$
});
</script>
