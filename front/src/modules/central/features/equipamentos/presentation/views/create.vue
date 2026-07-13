<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar equipamento' : 'Adicionar equipamento'"
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
        type="text"
        :serverError="form.errors?.get('codigo')"
        columnClass="col-md-4"
        hint="Ex.: FER-001"
      />
      <EntitySelectField
        label="Obra"
        v-model="form.obra_id"
        required
        :service="ObrasService"
        :searchFields="['nome', 'codigo', 'cliente']"
        :templateSubtitle="(o) => o.codigo"
        placeholder="Procurar obra…"
        :validationError="v$.obra_id.$error ? v$.obra_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('obra_id')"
        columnClass="col-md-6"
      />
      <FormField
        label="Categoria"
        v-model="form.categoria"
        type="select"
        :options="[
          { label: 'Ferramenta', value: 'ferramenta' },
          { label: 'Equipamento', value: 'equipamento' },
        ]"
        :serverError="form.errors?.get('categoria')"
        columnClass="col-md-6"
      />
      <FormField
        label="N.º de série"
        v-model="form.numero_serie"
        type="text"
        :serverError="form.errors?.get('numero_serie')"
        columnClass="col-md-6"
      />
      <FormField
        v-if="editMode"
        label="Estado"
        v-model="form.estado"
        type="select"
        :options="[
          { label: 'Disponível', value: 'disponivel' },
          { label: 'Danificado', value: 'danificado' },
          { label: 'Fora de serviço', value: 'fora_servico' },
        ]"
        :serverError="form.errors?.get('estado')"
        columnClass="col-md-6"
        hint="Em uso/desaparecido mudam via levantar/devolver"
      />
      <FormField
        label="Observações"
        v-model="form.obs"
        type="textarea"
        :serverError="form.errors?.get('obs')"
        columnClass="col-md-12"
      />
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { required } from '@common/application/utils/validators'
import ModalForm from '@components/ModalForm.vue'
import FormField from '@components/FormField.vue'
import EntitySelectField from '@components/EntitySelectField.vue'
import { useModalForm } from '@common/presentation/hooks/useModalForm'
import type { IEquipamento } from '../../application/dtos'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'

const defaultEquipamento: Partial<IEquipamento> = {
  nome: '',
  codigo: '',
  obra_id: null,
  categoria: 'ferramenta',
  numero_serie: '',
  obs: '',
}

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
})


const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IEquipamento>>({
  defaultValues: defaultEquipamento,
  defaultsRef: () => ({ ...props.defaults }),
  editMode: props.editMode,
  handler: props.handler,
  rules: () => ({
    nome: { required },
    obra_id: { required },
  }),
  beforeSend(data) {
    const payload: Record<string, any> = {
      ...data,
      obra_id: data.obra_id ? Number(data.obra_id) : null,
      codigo: data.codigo || null,
      numero_serie: data.numero_serie || null,
      obs: data.obs || null,
    }
    // Estado em_uso/desaparecido não é editável diretamente
    if (payload.estado && !['disponivel', 'danificado', 'fora_servico'].includes(payload.estado)) {
      delete payload.estado
    }
    delete payload.trabalhador_atual
    delete payload.trabalhador_atual_id
    delete payload.obra
    delete payload.foto
    delete payload.created_at
    delete payload.updated_at
    return payload
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
