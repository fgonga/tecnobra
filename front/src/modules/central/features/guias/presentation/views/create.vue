<!--
 -  Tecnobra — Registo de guia de remessa com linhas dinâmicas de itens
 -  e upload do documento (data-URL).
-->
<template>
  <BModal
    v-model="aberto"
    title="Registar guia de remessa"
    size="lg"
    :no-close-on-backdrop="true"
    @hidden="reset"
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
        columnClass="col-md-6"
        @update:modelValue="carregarMateriais"
      />
      <FormField label="N.º da guia" v-model="form.numero" required type="text" columnClass="col-md-6" hint="Ex.: GR-2026-014" />
      <EntitySelectField
        label="Fornecedor (empresa registada)"
        v-model="form.fornecedor_empresa_id"
        :service="EmpresasService"
        :searchFields="['nome', 'nif', 'contacto_nome']"
        :additionalFilters="{ filters: [{ field: 'tipo', operator: '=', value: 'fornecedor' }] }"
        placeholder="Procurar fornecedor…"
        columnClass="col-md-6"
      />
      <FormField label="Fornecedor (texto livre)" v-model="form.fornecedor_nome" type="text" columnClass="col-md-6" />
      <FormField label="Data de entrega" v-model="form.data_entrega" required type="datetime" columnClass="col-md-6" />
      <div class="col-md-6 mb-3">
        <label class="form-label">Documento (foto/PDF da guia)</label>
        <input class="form-control" type="file" accept="image/*,application/pdf" @change="onDocumento" />
      </div>
    </div>

    <h4 class="mt-2">Itens recebidos</h4>
    <div v-for="(item, idx) in itens" :key="idx" class="row g-2 align-items-end mb-2">
      <div class="col-md-5">
        <label class="form-label small">Material</label>
        <select v-model.number="item.material_id" class="form-select">
          <option :value="null" disabled>Selecionar…</option>
          <option v-for="m in materiais" :key="m.id" :value="m.id">{{ m.nome }} ({{ m.unidade }})</option>
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label small">Quantidade</label>
        <input v-model.number="item.quantidade" type="number" min="0" step="0.001" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label small">Preço unitário (Kz)</label>
        <input v-model.number="item.preco_unitario" type="number" min="0" step="0.01" class="form-control" />
      </div>
      <div class="col-md-1">
        <button class="btn btn-outline-danger w-100" :disabled="itens.length <= 1" @click="itens.splice(idx, 1)">×</button>
      </div>
    </div>
    <button class="btn btn-outline-primary btn-sm" @click="itens.push({ material_id: null, quantidade: null, preco_unitario: null })">
      + Adicionar item
    </button>

    <FormField label="Observações" v-model="form.obs" type="text" columnClass="col-12 mt-3" />

    <template #footer>
      <button class="btn" @click="aberto = false">Cancelar</button>
      <button class="btn btn-primary" :disabled="busy || !valido" @click="guardar">
        <span v-if="busy" class="spinner-border spinner-border-sm me-2" />Guardar guia
      </button>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import FormField from '@components/FormField.vue'
import EntitySelectField from '@components/EntitySelectField.vue'
import notify from '@common/application/utils/notification'
import { GuiasService, type IGuiaItem } from '../../domain/service/GuiasService'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'
import { EmpresasService } from '@/modules/central/features/empresas/domain/service/EmpresasService'
import { MateriaisService } from '@/modules/central/features/materiais/domain/service/MateriaisService'

const emit = defineEmits(['created'])

const aberto = ref(false)
const busy = ref(false)
const materiais = ref<any[]>([])

const form = reactive({
  obra_id: null as number | null,
  numero: '',
  fornecedor_empresa_id: null as number | null,
  fornecedor_nome: '',
  data_entrega: '',
  documento: null as string | null,
  obs: '',
})

const itens = ref<IGuiaItem[]>([{ material_id: null, quantidade: null, preco_unitario: null }])

const valido = computed(
  () =>
    form.obra_id &&
    form.numero.trim() &&
    form.data_entrega &&
    itens.value.length &&
    itens.value.every((i) => i.material_id && Number(i.quantidade) > 0)
)

function abrir() {
  aberto.value = true
}

function reset() {
  form.obra_id = null
  form.numero = ''
  form.fornecedor_empresa_id = null
  form.fornecedor_nome = ''
  form.data_entrega = ''
  form.documento = null
  form.obs = ''
  itens.value = [{ material_id: null, quantidade: null, preco_unitario: null }]
}

function onDocumento(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => (form.documento = String(reader.result))
  reader.readAsDataURL(file)
}

async function carregarMateriais() {
  if (!form.obra_id) return
  const { data } = await MateriaisService.index({
    perPage: 200,
    page: 1,
    filters: [{ field: 'obra_id', operator: '=', value: form.obra_id }],
  } as any)
  materiais.value = data.data ?? []
}

async function guardar() {
  busy.value = true
  try {
    await GuiasService.store({
      obra_id: form.obra_id,
      numero: form.numero,
      fornecedor_empresa_id: form.fornecedor_empresa_id || null,
      fornecedor_nome: form.fornecedor_nome || null,
      data_entrega: form.data_entrega.replace('T', ' ') + (form.data_entrega.length === 16 ? ':00' : ''),
      documento: form.documento,
      obs: form.obs || null,
      itens: itens.value.map((i) => ({
        material_id: Number(i.material_id),
        quantidade: Number(i.quantidade),
        preco_unitario: i.preco_unitario != null && i.preco_unitario !== ('' as any) ? Number(i.preco_unitario) : null,
      })),
    } as any)
    notify.success('Guia registada — stock atualizado.')
    aberto.value = false
    emit('created')
  } finally {
    busy.value = false
  }
}

defineExpose({ abrir })
</script>
