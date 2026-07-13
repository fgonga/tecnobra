<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar obra' : 'Adicionar obra'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy"
    @submit="handleSubmit"
  >
    <div class="row">
      <FormField
        label="Nome"
        v-model="form.nome"
        required
        type="text"
        :validationError="v$.nome.$error ? v$.nome.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('nome')"
        columnClass="col-md-8"
      />
      <FormField
        label="Código"
        v-model="form.codigo"
        required
        type="text"
        :validationError="v$.codigo.$error ? v$.codigo.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('codigo')"
        columnClass="col-md-4"
        hint="Código único (ex.: OBR-001)"
      />
      <FormField
        label="Cliente"
        v-model="form.cliente"
        type="text"
        :serverError="form.errors?.get('cliente')"
        columnClass="col-md-6"
      />
      <FormField
        label="Endereço"
        v-model="form.endereco"
        type="text"
        :serverError="form.errors?.get('endereco')"
        columnClass="col-md-6"
      />
      <FormField
        label="Estado"
        v-model="form.estado"
        type="select"
        :options="OBRA_ESTADOS"
        :serverError="form.errors?.get('estado')"
        columnClass="col-md-4"
      />
      <FormField
        label="Data de início"
        v-model="form.data_inicio"
        type="date"
        :serverError="form.errors?.get('data_inicio')"
        columnClass="col-md-4"
      />
      <FormField
        label="Fim previsto"
        v-model="form.data_fim_prevista"
        type="date"
        :serverError="form.errors?.get('data_fim_prevista')"
        columnClass="col-md-4"
      />
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { required } from '@common/application/utils/validators'
import ModalForm from '@components/ModalForm.vue'
import FormField from '@components/FormField.vue'
import { useModalForm } from '@common/presentation/hooks/useModalForm'
import type { IObra } from '../../application/dtos'
import { OBRA_ESTADOS } from '../../application/dtos'

const defaultObra: Partial<IObra> = {
  nome: '',
  codigo: '',
  cliente: '',
  endereco: '',
  estado: 'ativa',
  data_inicio: null,
  data_fim_prevista: null,
}

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
})

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IObra>>({
  defaultValues: defaultObra,
  defaultsRef: () => ({
    ...props.defaults,
    data_inicio: props.defaults?.data_inicio ? String(props.defaults.data_inicio).slice(0, 10) : null,
    data_fim_prevista: props.defaults?.data_fim_prevista ? String(props.defaults.data_fim_prevista).slice(0, 10) : null,
  }),
  editMode: props.editMode,
  handler: props.handler,
  rules: () => ({
    nome: { required },
    codigo: { required },
  }),
  beforeSend(data) {
    return {
      ...data,
      data_inicio: data.data_inicio || null,
      data_fim_prevista: data.data_fim_prevista || null,
      endereco: data.endereco || null,
      cliente: data.cliente || null,
    }
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
