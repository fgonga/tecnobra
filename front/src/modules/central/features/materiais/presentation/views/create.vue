<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar material' : 'Adicionar material'"
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
        label="Unidade"
        v-model="form.unidade"
        required
        type="text"
        :validationError="v$.unidade.$error ? v$.unidade.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('unidade')"
        columnClass="col-md-4"
        hint="Ex.: saco, m3, un, rolo"
      />
      <FormField
        label="Obra"
        v-model="form.obra_id"
        required
        type="select"
        :options="obraOptions"
        :validationError="v$.obra_id.$error ? v$.obra_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('obra_id')"
        columnClass="col-md-6"
      />
      <FormField
        label="Categoria"
        v-model="form.categoria"
        type="text"
        :serverError="form.errors?.get('categoria')"
        columnClass="col-md-6"
      />
      <FormField
        v-if="!editMode"
        label="Stock inicial"
        v-model="form.stock_atual"
        type="number"
        :serverError="form.errors?.get('stock_atual')"
        columnClass="col-md-6"
        hint="Depois, o stock só muda via guias e consumos"
      />
      <FormField
        label="Stock mínimo (alerta)"
        v-model="form.stock_minimo"
        type="number"
        :serverError="form.errors?.get('stock_minimo')"
        columnClass="col-md-6"
      />
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { required } from '@common/application/utils/validators'
import ModalForm from '@components/ModalForm.vue'
import FormField from '@components/FormField.vue'
import { useModalForm } from '@common/presentation/hooks/useModalForm'
import type { IMaterial } from '../../application/dtos'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'

const defaultMaterial: Partial<IMaterial> = {
  nome: '',
  unidade: 'un',
  obra_id: null,
  categoria: '',
  stock_atual: 0,
  stock_minimo: 0,
}

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
})

const obraOptions = ref<{ label: string; value: number }[]>([])

onMounted(async () => {
  const { data } = await ObrasService.index({ perPage: 100, page: 1 } as any)
  obraOptions.value = (data.data ?? []).map((o: any) => ({ label: `${o.codigo} — ${o.nome}`, value: o.id }))
})

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IMaterial>>({
  defaultValues: defaultMaterial,
  defaultsRef: () => ({ ...props.defaults }),
  editMode: props.editMode,
  handler: props.handler,
  rules: () => ({
    nome: { required },
    unidade: { required },
    obra_id: { required },
  }),
  beforeSend(data) {
    const payload: Record<string, any> = {
      ...data,
      obra_id: data.obra_id ? Number(data.obra_id) : null,
      categoria: data.categoria || null,
      stock_minimo: Number(data.stock_minimo ?? 0),
    }
    if (props.editMode) {
      delete payload.stock_atual
    } else {
      payload.stock_atual = Number(data.stock_atual ?? 0)
    }
    delete payload.obra
    delete payload.created_at
    delete payload.updated_at
    return payload
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
