<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar empresa' : 'Adicionar empresa'"
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
        label="NIF"
        v-model="form.nif"
        type="text"
        :serverError="form.errors?.get('nif')"
        columnClass="col-md-4"
      />
      <FormField
        label="Tipo"
        v-model="form.tipo"
        type="select"
        :options="EMPRESA_TIPOS"
        :serverError="form.errors?.get('tipo')"
        columnClass="col-md-6"
      />
      <FormField
        label="Estado"
        v-model="form.estado"
        type="select"
        :options="[
          { label: 'Ativa', value: 'ativa' },
          { label: 'Inativa', value: 'inativa' },
        ]"
        :serverError="form.errors?.get('estado')"
        columnClass="col-md-6"
      />
      <FormField
        label="Nome do contacto"
        v-model="form.contacto_nome"
        type="text"
        :serverError="form.errors?.get('contacto_nome')"
        columnClass="col-md-4"
      />
      <FormField
        label="Telefone"
        v-model="form.telefone"
        type="text"
        :serverError="form.errors?.get('telefone')"
        columnClass="col-md-4"
      />
      <FormField
        label="E-mail"
        v-model="form.email"
        type="text"
        :serverError="form.errors?.get('email')"
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
import type { IEmpresa } from '../../application/dtos'
import { EMPRESA_TIPOS } from '../../application/dtos'

const defaultEmpresa: Partial<IEmpresa> = {
  nome: '',
  nif: '',
  tipo: 'subempreiteiro',
  contacto_nome: '',
  telefone: '',
  email: '',
  estado: 'ativa',
}

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
})

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IEmpresa>>({
  defaultValues: defaultEmpresa,
  defaultsRef: () => ({ ...props.defaults }),
  editMode: props.editMode,
  handler: props.handler,
  rules: () => ({
    nome: { required },
  }),
  beforeSend(data) {
    return {
      ...data,
      nif: data.nif || null,
      contacto_nome: data.contacto_nome || null,
      telefone: data.telefone || null,
      email: data.email || null,
    }
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
