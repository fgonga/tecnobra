<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar registo' : 'Registar desempenho'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy"
    @submit="handleSubmit"
  >
    <div class="row">
      <FormField
        label="Obra"
        v-model="form.obra_id"
        required
        type="select"
        :options="obraOptions"
        :validationError="v$.obra_id.$error ? v$.obra_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('obra_id')"
        columnClass="col-md-6"
        @update:modelValue="carregarTrabalhadores"
      />
      <FormField
        label="Trabalhador"
        v-model="form.trabalhador_id"
        required
        type="select"
        :options="trabalhadorOptions"
        :validationError="v$.trabalhador_id.$error ? v$.trabalhador_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('trabalhador_id')"
        columnClass="col-md-6"
      />
      <FormField
        label="Métrica"
        v-model="form.metrica_id"
        required
        type="select"
        :options="metricaOptions"
        :validationError="v$.metrica_id.$error ? v$.metrica_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('metrica_id')"
        columnClass="col-md-4"
      />
      <FormField
        label="Data"
        v-model="form.data"
        required
        type="date"
        :validationError="v$.data.$error ? v$.data.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('data')"
        columnClass="col-md-4"
      />
      <FormField
        label="Quantidade"
        v-model="form.quantidade"
        required
        type="number"
        :validationError="v$.quantidade.$error ? v$.quantidade.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('quantidade')"
        columnClass="col-md-4"
      />
      <FormField label="Observações" v-model="form.obs" type="text" :serverError="form.errors?.get('obs')" columnClass="col-12" />
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { required } from '@common/application/utils/validators'
import ModalForm from '@components/ModalForm.vue'
import FormField from '@components/FormField.vue'
import { useModalForm } from '@common/presentation/hooks/useModalForm'
import type { IDesempenho } from '../../domain/service/DesempenhosService'
import { MetricasService } from '../../domain/service/DesempenhosService'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'
import { TrabalhadoresService } from '@/modules/central/features/trabalhadores/domain/service/TrabalhadoresService'

const defaultDesempenho: Partial<IDesempenho> = {
  obra_id: null,
  trabalhador_id: null,
  metrica_id: null,
  data: dayjs().format('YYYY-MM-DD'),
  quantidade: null,
  obs: '',
}

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
})

const obraOptions = ref<{ label: string; value: number }[]>([])
const trabalhadorOptions = ref<{ label: string; value: number }[]>([])
const metricaOptions = ref<{ label: string; value: number }[]>([])

async function carregarTrabalhadores() {
  if (!form.obra_id) return
  const { data } = await TrabalhadoresService.index({
    perPage: 200,
    page: 1,
    filters: [{ field: 'obra_id', operator: '=', value: form.obra_id }],
  } as any)
  trabalhadorOptions.value = (data.data ?? []).map((t: any) => ({ label: t.nome, value: t.id }))
}

onMounted(async () => {
  const [obras, metricas] = await Promise.all([
    ObrasService.index({ perPage: 100, page: 1 } as any),
    MetricasService.index(),
  ])
  obraOptions.value = (obras.data.data ?? []).map((o: any) => ({ label: `${o.codigo} — ${o.nome}`, value: o.id }))
  metricaOptions.value = ((metricas.data as any).data ?? []).map((m: any) => ({ label: `${m.nome} (${m.unidade})`, value: m.id }))
})

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IDesempenho>>({
  defaultValues: defaultDesempenho,
  defaultsRef: () => ({
    ...props.defaults,
    data: props.defaults?.data ? String(props.defaults.data).slice(0, 10) : dayjs().format('YYYY-MM-DD'),
  }),
  editMode: props.editMode,
  handler: props.handler,
  rules: () => ({
    obra_id: { required },
    trabalhador_id: { required },
    metrica_id: { required },
    data: { required },
    quantidade: { required },
  }),
  beforeSend(data) {
    const payload: Record<string, any> = {
      obra_id: Number(data.obra_id),
      trabalhador_id: Number(data.trabalhador_id),
      metrica_id: Number(data.metrica_id),
      data: data.data,
      quantidade: Number(data.quantidade),
      obs: data.obs || null,
    }
    if (props.editMode) {
      // No update só data/quantidade/obs são editáveis
      delete payload.obra_id
      delete payload.trabalhador_id
      delete payload.metrica_id
    }
    return payload
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
