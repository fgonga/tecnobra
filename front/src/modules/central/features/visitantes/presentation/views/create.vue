<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar visitante' : 'Registar visitante'"
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
        columnClass="col-md-6"
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
      <FormField label="Empresa" v-model="form.empresa" type="text" :serverError="form.errors?.get('empresa')" columnClass="col-md-6" />
      <FormField label="Motivo da visita" v-model="form.motivo" type="text" :serverError="form.errors?.get('motivo')" columnClass="col-md-6" />
      <FormField label="Anfitrião" v-model="form.anfitriao" type="text" :serverError="form.errors?.get('anfitriao')" columnClass="col-md-4" hint="Quem recebe a visita" />
      <FormField label="Telefone" v-model="form.telefone" type="text" :serverError="form.errors?.get('telefone')" columnClass="col-md-4" />
      <FormField label="E-mail" v-model="form.email" type="text" :serverError="form.errors?.get('email')" columnClass="col-md-4" hint="Para envio do cartão" />
      <FormField label="Válido de" v-model="form.valido_de" type="datetime" :serverError="form.errors?.get('valido_de')" columnClass="col-md-6" />
      <FormField label="Válido até" v-model="form.valido_ate" type="datetime" :serverError="form.errors?.get('valido_ate')" columnClass="col-md-6" />
      <FormField
        v-if="!editMode"
        label="Enviar cartão digital (email/WhatsApp)"
        v-model="form.enviar_cartao"
        type="checkbox"
        columnClass="col-md-12"
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
import type { IVisitante } from '../../domain/service/VisitantesService'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'

const defaultVisitante: Partial<IVisitante> = {
  nome: '',
  obra_id: null,
  empresa: '',
  motivo: '',
  anfitriao: '',
  telefone: '',
  email: '',
  valido_de: null,
  valido_ate: null,
  enviar_cartao: true,
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

const toSql = (v?: string | null) => {
  if (!v) return null
  const s = String(v).replace('T', ' ')
  return s.length === 16 ? `${s}:00` : s
}

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IVisitante>>({
  defaultValues: defaultVisitante,
  defaultsRef: () => ({
    ...props.defaults,
    valido_de: props.defaults?.valido_de ? String(props.defaults.valido_de).replace(' ', 'T').slice(0, 16) : null,
    valido_ate: props.defaults?.valido_ate ? String(props.defaults.valido_ate).replace(' ', 'T').slice(0, 16) : null,
  }),
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
      empresa: data.empresa || null,
      motivo: data.motivo || null,
      anfitriao: data.anfitriao || null,
      telefone: data.telefone || null,
      email: data.email || null,
      valido_de: toSql(data.valido_de),
      valido_ate: toSql(data.valido_ate),
    }
    if (props.editMode) delete payload.enviar_cartao
    delete payload.obra
    delete payload.estado
    delete payload.created_at
    delete payload.updated_at
    return payload
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
