<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
-->

<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar utilizador' : 'Adicionar utilizador'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy || isLoading"
    @submit="handleSubmit"
  >
    <div class="row">
      <FormField
        label="Username"
        v-model="form.username"
        required
        type="text"
        :validationError="v$.username.$error ? v$.username.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('username')"
        columnClass="col-md-6"
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
        label="Telefone"
        v-model="form.phone"
        type="string"
        required
        :validationError="v$.phone.$error ? v$.phone.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('phone')"
        columnClass="col-md-6"
      />
      <FormField
        label="Permissão"
        v-model="form.role"
        required
        type="select"
        :options="[
          { label: 'Super Administrador', value: 'superadmin' },
          { label: 'Administrador', value: 'admin' },
          { label: 'Utilizador normal', value: 'user' },
          { label: 'Contador', value: 'account' },
          { label: 'Suporte', value: 'helper' }
        ]"
        :validationError="v$.role.$error ? v$.role.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('role')"
        columnClass="col-md-6"
        :hint="roleHint"
      />
      <div class="col-md-6">
        <FormField
          label="Senha"
          v-model="form.password"
          type="password"
          placeholder="Senha do utilizador"
          autocomplete="off"
          :serverError="form.errors?.get('password')"
          class="flex-grow-1"
          hint="Mínimo 6 caracteres. Deixe em branco para manter a senha atual. Senha padrão: treesix"
        />
        <b-button  variant="default" @click="generatePassword"  title="Gerar senha aleatória">
          <IconLockPassword size="15" class="me-2"/> Gerar senha
        </b-button>
      </div>
      <FormField
        label="Estado"
        v-model="form.status"
        required
        type="select"
        :options="[
          { label: 'Ativo', value: true },
          { label: 'Inativo', value: false }
        ]"
        :validationError="v$.status.$error ? v$.status.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('status')"
        columnClass="col-md-6"
      />

    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { required } from "@common/application/utils/validators";
import ModalForm from "@components/ModalForm.vue";
import FormField from "@components/FormField.vue";
import { useModalForm } from "@common/presentation/hooks/useModalForm";
import { defineProps, computed } from "vue";
import {IconLockPassword} from "@tabler/icons-vue"
interface IUser {
  id?: number;
  username: string;
  name: string;
  phone: string;
  role: string;
  password: string;
  status: any;
}
const defaultUser: Partial<IUser> = {
  username: "",
  name: "",
  phone: "",
  password: "",
  role: "user",
};
const roleHint = computed(() => {
  switch (form.role) {
    case "superadmin":
      return "Acesso total a todo o sistema e configurações.";
    case "admin":
      return "Pode gerir utilizadores e operações principais.";
    case "user":
      return "Acesso limitado às funções atribuídas.";
    case "account":
      return "Utilizador com acesso a relatórios financeiros.";
    case "helper":
      return "Apoio técnico e atendimento de suporte.";
    default:
      return "Seleccione o tipo de permissão apropriado.";
  }
});
const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
});
const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IUser>>({
  defaultValues: defaultUser,
  defaultsRef: () => props.defaults,
  editMode: props.editMode,
  handler: props.handler,
  rules: (form) => ({
    name: { required },
    username: { required },
    phone: { required },
    role: { required },
    status: { required }
  }),
  beforeSend(data) {

    return {
      ...data,
      status: data.status == 1 ? 1: 0,
    };
  },
});
function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  form.password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
defineExpose({
  show,
  hide,
  resetForm,
  v$,
});
</script>
