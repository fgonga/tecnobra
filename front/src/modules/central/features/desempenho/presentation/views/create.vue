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
      <EntitySelectField
        label="Obra"
        v-model="form.obra_id"
        required
        :service="ObrasService"
        :searchFields="['nome', 'codigo', 'cliente']"
        :templateSubtitle="(o) => o.codigo"
        placeholder="Procurar obra…"
        entity-display-name="obra"
        :modal-columns="[{ key: 'codigo', label: 'Código' }, { key: 'nome', label: 'Nome' }, { key: 'cliente', label: 'Cliente' }]"
        :validationError="v$.obra_id.$error ? v$.obra_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('obra_id')"
        columnClass="col-md-6"
        @update:modelValue="onObraChange"
      />
      <EntitySelectField
        label="Trabalhador"
        v-model="form.trabalhador_id"
        required
        :service="TrabalhadoresService"
        :searchFields="['nome', 'funcao', 'documento']"
        :templateSubtitle="(t) => t.funcao"
        :additionalFilters="trabalhadorFilters"
        :watchKey="obraWatch"
        :disabled="!form.obra_id"
        placeholder="Procurar trabalhador…"
            entity-display-name="trabalhador"
            :modal-columns="[{ key: 'nome', label: 'Nome' }, { key: 'funcao', label: 'Função' }, { key: 'documento', label: 'Documento' }]"
        :validationError="v$.trabalhador_id.$error ? v$.trabalhador_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('trabalhador_id')"
        columnClass="col-md-6"
      />
      <EntitySelectField
        label="Métrica"
        v-model="form.metrica_id"
        required
        :service="MetricasEntity"
        :searchFields="['nome']"
        :templateSubtitle="(m) => m.unidade"
        placeholder="Procurar métrica…"
        entity-display-name="métrica"
        :modal-columns="[{ key: 'nome', label: 'Nome' }, { key: 'unidade', label: 'Unidade' }]"
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
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { required } from '@common/application/utils/validators'
import ModalForm from '@components/ModalForm.vue'
import FormField from '@components/FormField.vue'
import EntitySelectField from '@components/EntitySelectField.vue'
import { useModalForm } from '@common/presentation/hooks/useModalForm'
import type { IDesempenho } from '../../domain/service/DesempenhosService'
import { MetricasEntity } from '../../domain/service/DesempenhosService'
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

// Trabalhadores filtrados pela obra selecionada
const obraWatch = ref(0)
const trabalhadorFilters = computed(() => ({
  filters: form.obra_id ? [{ field: 'obra_id', operator: '=', value: form.obra_id }] : [],
}))

function onObraChange() {
  // Limpa o trabalhador e força recarregar as opções da nova obra
  form.trabalhador_id = null
  obraWatch.value++
}

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
