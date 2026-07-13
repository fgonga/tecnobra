<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar veículo' : 'Registar veículo'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy"
    @submit="handleSubmit"
  >
    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Foto da matrícula (OCR)</label>
        <input class="form-control" type="file" accept="image/*" capture="environment" @change="onFoto" />
        <small class="text-muted">Tire uma foto — a matrícula é lida automaticamente.</small>
        <div v-if="ocrBusy" class="mt-2 text-muted">
          <span class="spinner-border spinner-border-sm me-2" />A ler a matrícula…
        </div>
        <div v-else-if="ocrResultado" class="mt-2 small" :class="ocrResultado.matricula ? 'text-success' : 'text-warning'">
          <template v-if="ocrResultado.matricula">
            Lida: <strong>{{ ocrResultado.matricula }}</strong> (confiança {{ Math.round(ocrResultado.confianca * 100) }}%)
          </template>
          <template v-else>
            Não foi possível ler — {{ ocrResultado.observacao || 'introduza manualmente' }}
          </template>
        </div>
        <img v-if="fotoPreview" :src="fotoPreview" class="rounded mt-2" style="max-height: 90px" alt="Pré-visualização" />
      </div>
      <FormField
        label="Matrícula"
        v-model="form.matricula"
        required
        type="text"
        :validationError="v$.matricula.$error ? v$.matricula.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('matricula')"
        columnClass="col-md-6"
        hint="Confirme sempre a leitura do OCR"
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
      <FormField label="Marca/Modelo" v-model="form.marca_modelo" type="text" :serverError="form.errors?.get('marca_modelo')" columnClass="col-md-6" />
      <FormField label="Tipo" v-model="form.tipo" type="select" :options="VEICULO_TIPOS" :serverError="form.errors?.get('tipo')" columnClass="col-md-6" />
      <FormField
        label="Proprietário (tipo)"
        v-model="form.proprietario_tipo"
        type="select"
        :options="[
          { label: 'Empresa', value: 'empresa' },
          { label: 'Trabalhador', value: 'trabalhador' },
          { label: 'Visitante', value: 'visitante' },
          { label: 'Outro', value: 'outro' },
        ]"
        :serverError="form.errors?.get('proprietario_tipo')"
        columnClass="col-md-6"
      />
      <FormField label="Proprietário (nome)" v-model="form.proprietario_nome" type="text" :serverError="form.errors?.get('proprietario_nome')" columnClass="col-md-12" />
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { required } from '@common/application/utils/validators'
import ModalForm from '@components/ModalForm.vue'
import FormField from '@components/FormField.vue'
import EntitySelectField from '@components/EntitySelectField.vue'
import { useModalForm } from '@common/presentation/hooks/useModalForm'
import type { IVeiculo } from '../../domain/service/VeiculosService'
import { VEICULO_TIPOS, PlateOcrService } from '../../domain/service/VeiculosService'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'

const defaultVeiculo: Partial<IVeiculo> = {
  matricula: '',
  obra_id: null,
  marca_modelo: '',
  tipo: 'ligeiro',
  proprietario_tipo: 'outro',
  proprietario_nome: '',
  foto: null,
}

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
})

const fotoPreview = ref<string | null>(null)
const ocrBusy = ref(false)
const ocrResultado = ref<{ matricula: string | null; confianca: number; observacao?: string | null } | null>(null)

/** Redimensiona a foto (≤1280px), guarda-a no form e tenta o OCR. */
function onFoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = async () => {
      const MAX = 1280
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      form.foto = dataUrl
      fotoPreview.value = dataUrl

      // OCR automático (fallback silencioso para entrada manual)
      ocrBusy.value = true
      ocrResultado.value = null
      try {
        const { data } = await PlateOcrService.ler(dataUrl)
        ocrResultado.value = data
        if (data.matricula) {
          form.matricula = data.matricula
          form.ocr_matricula = data.matricula
          form.ocr_confianca = data.confianca
        }
      } catch {
        ocrResultado.value = { matricula: null, confianca: 0, observacao: 'OCR indisponível' }
      } finally {
        ocrBusy.value = false
      }
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
}

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<IVeiculo>>({
  defaultValues: defaultVeiculo,
  defaultsRef: () => ({ ...props.defaults }),
  editMode: props.editMode,
  handler: props.handler,
  rules: () => ({
    matricula: { required },
    obra_id: { required },
  }),
  beforeSend(data) {
    const payload: Record<string, any> = {
      ...data,
      obra_id: data.obra_id ? Number(data.obra_id) : null,
      marca_modelo: data.marca_modelo || null,
      proprietario_nome: data.proprietario_nome || null,
    }
    if (!payload.foto || !String(payload.foto).startsWith('data:')) delete payload.foto
    if (props.editMode) {
      delete payload.ocr_matricula
      delete payload.ocr_confianca
    }
    delete payload.obra
    delete payload.created_at
    delete payload.updated_at
    return payload
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
