<!--
  -  Tecnobra — EntitySelect (portado do bantuhub):
  -  pesquisa server-side com debounce + AbortController, carrega o item já
  -  selecionado (loadSelectedItem) e, opcionalmente, abre um modal de seleção
  -  avançada (EntitySelectModal). Parametrizado por `service` + campos.
  -->
<template>
  <div class="mb-3" :class="columnClass">
    <label v-if="label && showLabel" class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div
      ref="wrapperRef"
      class="entity-select-wrapper"
      :class="{ 'is-invalid': validationError || serverError, 'is-disabled': disabled }"
    >
      <multiselect
        v-model="selectedValue"
        class="entity-multiselect"
        :options="items"
        :multiple="multiple"
        :searchable="true"
        :loading="isLoading"
        :placeholder="placeholder"
        :disabled="disabled"
        :close-on-select="!multiple"
        :clear-on-select="false"
        :preserve-search="true"
        :internal-search="false"
        :show-labels="false"
        :max-height="300"
        :track-by="valueField"
        :label="labelField"
        @select="handleSelect"
        @remove="handleRemove"
        @search-change="onSearch"
        @open="handleOpen"
        @close="handleClose"
      >
        <template #option="{ option }">
          <div class="option-item">
            <span class="option-text">{{ getFieldFromObject(labelField, option) }}</span>
            <span v-if="templateSubtitle && showSubtitle" class="option-subtitle text-muted">
              {{ templateSubtitle(option) }}
            </span>
          </div>
        </template>

        <template #singleLabel="{ option }">
          <span>{{ getFieldFromObject(labelField, option) }}</span>
        </template>

        <template #tag="{ option, remove }">
          <span class="entity-tag">
            {{ getFieldFromObject(labelField, option) }}
            <button type="button" class="entity-tag-remove" @click.stop="remove(option)">
              <Icon icon="tabler:x" style="width: 10px; height: 10px" />
            </button>
          </span>
        </template>

        <template #noResult><div class="multiselect-no-result">Sem registos</div></template>
        <template #noOptions><div class="multiselect-no-options">Escreva para pesquisar</div></template>
      </multiselect>

      <button
        v-if="addModal"
        type="button"
        class="entity-select-btn"
        :disabled="disabled"
        @click="handleOpenSearchModal"
      >
        <Icon icon="tabler:search" />
      </button>
    </div>

    <div v-if="serverError" class="text-danger small mt-1">{{ serverError }}</div>
    <div v-if="validationError" class="invalid-feedback d-block">{{ validationError }}</div>
    <div v-if="hint" class="form-text text-muted">{{ hint }}</div>

    <EntitySelectModal
      v-if="addModal && modalMounted"
      ref="selectModalRef"
      :service="service"
      :title="`Selecionar ${entityDisplayName}`"
      :label-field="labelField"
      :value-field="valueField"
      :search-fields="searchFields"
      :multiple="multiple"
      :columns="modalColumns"
      :with="props.with"
      @confirm="handleSelectionConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import { Icon } from '@iconify/vue'
import EntitySelectModal from './EntitySelectModal.vue'
import type { FilterOptions } from '@common/presentation/hooks/types'

interface Column {
  key: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: any
    label?: string
    placeholder?: string
    required?: boolean
    showLabel?: boolean
    disabled?: boolean
    validationError?: string
    serverError?: string
    hint?: string
    columnClass?: string
    service: any
    searchFields?: string[]
    labelField?: string
    valueField?: string
    templateSubtitle?: (item: any) => string
    multiple?: boolean
    showSubtitle?: boolean
    additionalFilters?: Partial<FilterOptions>
    preloadItems?: boolean
    watch?: any
    with?: string[]
    perPage?: number
    addModal?: boolean
    modalColumns?: Column[]
    entityDisplayName?: string
  }>(),
  {
    label: '',
    placeholder: 'Escolher',
    required: false,
    showLabel: true,
    disabled: false,
    validationError: '',
    serverError: '',
    hint: '',
    columnClass: 'col-md-12',
    searchFields: () => ['nome'],
    labelField: 'nome',
    valueField: 'id',
    multiple: false,
    showSubtitle: true,
    additionalFilters: () => ({}),
    preloadItems: false,
    watch: 0,
    with: () => [],
    perPage: 15,
    addModal: false,
    modalColumns: () => [],
    entityDisplayName: 'Item',
  },
)

const emit = defineEmits(['update:modelValue', 'loaded'])

const items = ref<any[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const focused = ref(false)
const selectedValue = ref<any>(props.modelValue ?? null)
const wrapperRef = ref<HTMLElement | null>(null)
const selectModalRef = ref<any>(null)
const modalMounted = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let fetchAbort: AbortController | null = null
let unmounted = false
let modalEl: HTMLElement | null = null

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== selectedValue.value) {
      selectedValue.value = newValue ?? null
      if (newValue && !hasSelectedItem(newValue)) loadSelectedItem()
    }
  },
  { immediate: true },
)

// Recarrega quando um filtro dependente (watch) muda ou ao ganhar foco vazio.
watch(
  () => props.watch,
  () => loadItems(true),
)
watch(focused, (isFocused) => {
  if (isFocused && !props.preloadItems && items.value.length === 0) loadItems(true)
})

function getFieldFromObject(field: string, object: Record<string, any>) {
  return field.split('.').reduce((obj: any, key) => obj?.[key], object)
}

function handleSelect(option: any) {
  emit('update:modelValue', option)
}
function handleRemove() {
  emit('update:modelValue', null)
}

function handleOpen() {
  focused.value = true
  // Deixa o modal pai overflow:visible para o dropdown não ser cortado.
  modalEl = wrapperRef.value?.closest('.modal') as HTMLElement | null
  if (modalEl) modalEl.style.overflow = 'visible'
}
function handleClose() {
  if (modalEl) {
    modalEl.style.overflow = ''
    modalEl = null
  }
}

function hasSelectedItem(value: any): boolean {
  if (!value) return true
  if (Array.isArray(value)) {
    return value.every((v) =>
      items.value.some((item) => item[props.valueField] === (typeof v === 'object' ? v[props.valueField] : v)),
    )
  }
  if (typeof value === 'object') {
    return items.value.some((item) => item[props.valueField] === value[props.valueField])
  }
  return items.value.some((item) => item[props.valueField] === value)
}

async function loadItems(reset = false) {
  if (reset) items.value = []
  try {
    isLoading.value = true
    fetchAbort?.abort()
    fetchAbort = new AbortController()
    const currentAbort = fetchAbort

    const filters: FilterOptions = {
      search: searchQuery.value,
      page: 1,
      perPage: props.perPage,
      total: 0,
      with: props.with || [],
      columns: [],
      searchable: props.searchFields,
      filters: [],
      ...props.additionalFilters,
    } as FilterOptions

    const response = await props.service.index(filters)
    if (currentAbort.signal.aborted || unmounted) return
    const data = response.data
    if (data?.data) {
      items.value = data.data
    }
    emit('loaded', items.value)
  } catch (error) {
    console.error('EntitySelect: erro ao carregar itens', error)
  } finally {
    if (!unmounted) isLoading.value = false
  }
}

async function loadSelectedItem() {
  if (!props.modelValue || isLoading.value) return
  const filters = { with: props.with || [], columns: ['*'] }
  try {
    isLoading.value = true
    const values = Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
    const loaded: any[] = []
    for (const value of values) {
      if (unmounted) break
      const id = typeof value === 'object' ? value[props.valueField] : value
      // Se já é um objeto completo, usa-o diretamente.
      if (typeof value === 'object' && value[props.labelField] !== undefined) {
        loaded.push(value)
        continue
      }
      try {
        const response = await props.service.show(id, filters)
        if (!unmounted && response.data) loaded.push(response.data)
      } catch (err) {
        console.error('EntitySelect: erro ao carregar item selecionado', err)
      }
    }
    if (!unmounted && loaded.length) {
      items.value = [
        ...items.value,
        ...loaded.filter((it) => !items.value.some((ex) => ex[props.valueField] === it[props.valueField])),
      ]
    }
  } finally {
    if (!unmounted) isLoading.value = false
  }
}

function onSearch(query: string) {
  if (searchTimer !== null) clearTimeout(searchTimer)
  searchQuery.value = query
  searchTimer = setTimeout(() => {
    loadItems(true)
    searchTimer = null
  }, 500)
}

// ── Modal de seleção avançada ───────────────────────────────────────────
async function handleOpenSearchModal() {
  if (!modalMounted.value) {
    modalMounted.value = true
    await nextTick()
  }
  selectModalRef.value?.show()
}

function handleSelectionConfirm(selection: any) {
  emit('update:modelValue', selection)
  const arr = Array.isArray(selection) ? selection : [selection]
  arr.forEach((it: any) => {
    if (it && !items.value.some((ex) => ex[props.valueField] === it[props.valueField])) {
      items.value.push(it)
    }
  })
  selectedValue.value = selection
}

onMounted(() => {
  if (props.preloadItems) loadItems(true)
  if (props.modelValue) loadSelectedItem()
})

onBeforeUnmount(() => {
  unmounted = true
  if (searchTimer !== null) clearTimeout(searchTimer)
  fetchAbort?.abort()
  if (modalEl) modalEl.style.overflow = ''
})

defineExpose({ loadItems })
</script>

<style scoped>
.entity-select-wrapper {
  display: flex;
  border: 1px solid var(--tblr-border-color, #ced4da);
  border-radius: 0.375rem;
  background: var(--tblr-bg-forms, #fff);
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.entity-select-wrapper:focus-within {
  border-color: var(--tblr-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--tblr-primary-rgb), 0.2);
}
.entity-select-wrapper.is-invalid {
  border-color: var(--tblr-danger, #dc3545);
}
.entity-select-wrapper.is-disabled {
  background: var(--tblr-bg-surface-secondary, #f1f3f5);
}

.entity-multiselect {
  flex: 1;
  min-width: 0;
}
.entity-multiselect :deep(.multiselect__tags) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;
  min-height: 36px;
  padding: 0 8px;
}
.entity-multiselect :deep(.multiselect__single),
.entity-multiselect :deep(.multiselect__input),
.entity-multiselect :deep(.multiselect__placeholder) {
  background: transparent;
  margin-bottom: 0;
  padding-top: 0;
  align-self: center;
  line-height: 1.4;
}
.entity-multiselect :deep(.multiselect__select) {
  display: none;
}
.entity-multiselect :deep(.multiselect__spinner) {
  background: transparent;
}
.entity-multiselect :deep(.multiselect__spinner::before),
.entity-multiselect :deep(.multiselect__spinner::after) {
  border-top-color: var(--tblr-primary);
  border-right-color: transparent;
}

.entity-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  flex-shrink: 0;
  border: none;
  border-left: 1px solid var(--tblr-border-color, #ced4da);
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
  background: var(--tblr-bg-surface-secondary, #f1f3f5);
  color: var(--tblr-secondary, #6c757d);
  cursor: pointer;
}
.entity-select-btn:hover:not(:disabled) {
  color: var(--tblr-primary);
}
.entity-select-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.option-subtitle {
  font-size: 0.78rem;
  white-space: nowrap;
}
.entity-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(var(--tblr-primary-rgb), 0.1);
  color: var(--tblr-primary);
  border: 1px solid rgba(var(--tblr-primary-rgb), 0.25);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 0.75rem;
  margin: 1px 2px 1px 0;
}
.entity-tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  background: rgba(var(--tblr-primary-rgb), 0.15);
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  color: var(--tblr-primary);
}
.multiselect-no-result,
.multiselect-no-options {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--tblr-secondary, #6c757d);
}
</style>
