<template>
  <ModalForm
    ref="modal"
    :title="editMode ? 'Editar trabalhador' : 'Adicionar trabalhador'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy"
    @submit="handleSubmit"
  >
    <div class="row">
      <FormField
        label="Nome completo"
        v-model="form.nome"
        required
        type="text"
        :validationError="v$.nome.$error ? v$.nome.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('nome')"
        columnClass="col-md-8"
      />
      <FormField
        label="Função"
        v-model="form.funcao"
        type="text"
        :serverError="form.errors?.get('funcao')"
        columnClass="col-md-4"
        hint="Ex.: Pedreiro, Eletricista"
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
        label="Empresa"
        v-model="form.empresa_id"
        required
        type="select"
        :options="empresaOptions"
        :validationError="v$.empresa_id.$error ? v$.empresa_id.$errors[0].$message.toString() : ''"
        :serverError="form.errors?.get('empresa_id')"
        columnClass="col-md-6"
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
        hint="Para envio do cartão digital"
      />
      <FormField
        label="Documento (BI)"
        v-model="form.documento"
        type="text"
        :serverError="form.errors?.get('documento')"
        columnClass="col-md-4"
      />
      <FormField
        label="Estado"
        v-model="form.estado"
        type="select"
        :options="TRABALHADOR_ESTADOS"
        :serverError="form.errors?.get('estado')"
        columnClass="col-md-6"
      />
      <div class="col-md-6 mb-3">
        <label class="form-label">Fotografia</label>
        <input class="form-control" type="file" accept="image/*" @change="onFotoChange" />
        <small v-if="form.errors?.get('foto')" class="text-danger">{{ form.errors.get('foto') }}</small>
        <div v-if="fotoPreview" class="mt-2">
          <img :src="fotoPreview" alt="Pré-visualização" class="rounded" style="max-height: 80px" />
        </div>
      </div>
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { required } from '@common/application/utils/validators'
import ModalForm from '@components/ModalForm.vue'
import FormField from '@components/FormField.vue'
import { useModalForm } from '@common/presentation/hooks/useModalForm'
import type { ITrabalhador } from '../../application/dtos'
import { TRABALHADOR_ESTADOS } from '../../application/dtos'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'
import { EmpresasService } from '@/modules/central/features/empresas/domain/service/EmpresasService'

const defaultTrabalhador: Partial<ITrabalhador> = {
  nome: '',
  funcao: '',
  obra_id: null,
  empresa_id: null,
  telefone: '',
  email: '',
  documento: '',
  foto: null,
  estado: 'ativo',
}

const props = defineProps({
  editMode: Boolean,
  handler: Function,
  defaults: Object,
})

const obraOptions = ref<{ label: string; value: number }[]>([])
const empresaOptions = ref<{ label: string; value: number }[]>([])
const fotoPreview = ref<string | null>(null)

onMounted(async () => {
  const [obras, empresas] = await Promise.all([
    ObrasService.index({ perPage: 100, page: 1 } as any),
    EmpresasService.index({ perPage: 100, page: 1 } as any),
  ])
  obraOptions.value = (obras.data.data ?? []).map((o: any) => ({ label: `${o.codigo} — ${o.nome}`, value: o.id }))
  empresaOptions.value = (empresas.data.data ?? []).map((e: any) => ({ label: e.nome, value: e.id }))
})

/** Redimensiona a foto no cliente (≤1024px) e guarda como data-URL no form. */
function onFotoChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      form.foto = dataUrl
      fotoPreview.value = dataUrl
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
}

const { modal, busy, form, v$, show, hide, resetForm, handleSubmit } = useModalForm<Partial<ITrabalhador>>({
  defaultValues: defaultTrabalhador,
  defaultsRef: () => ({ ...props.defaults }),
  editMode: props.editMode,
  handler: props.handler,
  rules: () => ({
    nome: { required },
    obra_id: { required },
    empresa_id: { required },
  }),
  beforeSend(data) {
    const payload: Record<string, any> = {
      ...data,
      obra_id: data.obra_id ? Number(data.obra_id) : null,
      empresa_id: data.empresa_id ? Number(data.empresa_id) : null,
      funcao: data.funcao || null,
      telefone: data.telefone || null,
      email: data.email || null,
      documento: data.documento || null,
    }
    // Só envia a foto se for uma nova (data-URL); caminhos já gravados não se reenviam
    if (!payload.foto || !String(payload.foto).startsWith('data:')) delete payload.foto
    // Campos devolvidos pelo backend que o schema não aceita
    delete payload.obra
    delete payload.empresa
    delete payload.cartao_estado
    delete payload.cartao_emitido_em
    delete payload.created_at
    delete payload.updated_at
    return payload
  },
})

defineExpose({ show, hide, resetForm, v$ })
</script>
