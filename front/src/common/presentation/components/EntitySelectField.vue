<!--
 -  Tecnobra — Campo de seleção de entidade (pesquisa assíncrona + modal).
 -
 -  Envolve o EntitySelect mas mantém o contrato id-based dos formulários:
 -  - modelValue é o id (número) — não o objeto
 -  - pré-carrega o objeto por id em modo edição
 -  - suporta filtros reativos (ex.: trabalhadores da obra selecionada)
 -  - mostra o botão de pesquisa com modal de seleção avançada
-->
<template>
  <EntitySelect
    ref="innerRef"
    :label="label"
    :required="required"
    :placeholder="placeholder"
    :service="service"
    :searchFields="searchFields"
    :labelField="labelField"
    :templateSubtitle="templateSubtitle"
    :showSubtitle="!!templateSubtitle"
    :additionalFilters="additionalFilters"
    :with="withRelations"
    :columnClass="columnClass"
    :disabled="disabled"
    :validationError="validationError"
    :serverError="serverError"
    :hint="hint"
    :watch="watchKey"
    :addModal="addModal"
    :modalColumns="modalColumns"
    :entityDisplayName="entityDisplayName"
    :modelValue="objeto"
    @update:modelValue="onUpdate"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import EntitySelect from './EntitySelect.vue'
import type { CrudService } from '@common/hooks/types'

interface Column {
  key: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined
    service: CrudService<any>
    label?: string
    placeholder?: string
    required?: boolean
    searchFields?: string[]
    labelField?: string
    templateSubtitle?: (item: any) => string
    additionalFilters?: Record<string, any>
    withRelations?: string[]
    columnClass?: string
    disabled?: boolean
    validationError?: string
    serverError?: string
    hint?: string
    /** Muda para forçar recarregar as opções (ex.: quando a obra muda). */
    watchKey?: number
    /** Mostra o botão de pesquisa que abre o modal de seleção. */
    addModal?: boolean
    modalColumns?: Column[]
    entityDisplayName?: string
  }>(),
  {
    placeholder: 'Escolher…',
    required: false,
    searchFields: () => ['nome'],
    labelField: 'nome',
    columnClass: 'col-md-12',
    disabled: false,
    validationError: '',
    serverError: '',
    hint: '',
    watchKey: 0,
    addModal: true,
    modalColumns: () => [],
    entityDisplayName: 'registo',
  }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: number | null): void }>()

const innerRef = ref<InstanceType<typeof EntitySelect>>()
// O EntitySelect trabalha com o objeto; guardamos-o localmente.
const objeto = ref<any | null>(null)

// EntitySelect emite o objeto (ou null) — devolvemos só o id ao formulário.
function onUpdate(value: any) {
  objeto.value = value
  emit('update:modelValue', value ? (value.id ?? null) : null)
}

/** Pré-carrega o objeto quando o id vem de fora (edição) e ainda não está resolvido. */
async function resolver(id: number | null | undefined) {
  if (!id) {
    objeto.value = null
    return
  }
  if (objeto.value && objeto.value.id === id) return
  try {
    const { data } = await props.service.show(id, { with: props.withRelations ?? [], columns: ['*'] } as any)
    objeto.value = data
  } catch {
    objeto.value = { id }
  }
}

watch(() => props.modelValue, (id) => resolver(id as any), { immediate: true })
</script>
