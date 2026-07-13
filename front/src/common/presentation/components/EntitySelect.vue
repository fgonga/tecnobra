<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<template xmlns="">
  <div class="mb-3" :class="columnClass">
    <label v-if="label && showLabel" class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <BInputGroup :class="{ 'add-modal': addModal }">

      <template v-if="addModal" #append>
        <b-button variant="light" @click="handleOpenSearchModal">
          <i class="ti ti-search" />
        </b-button>
      </template>

      <multiselect @remove="handleRemove" @select="handleSelect" v-model="selectedValue" :options="items"
        :multiple="multiple" :searchable="true" :loading="isLoading" :placeholder="placeholder" :disabled="disabled"
        :close-on-select="!multiple" :clear-on-select="false" :preserve-search="true" :internal-search="false"
        :show-labels="false" :max-height="300" :track-by="valueField"
        :option-label="(option: any) => getFieldFromObject(labelField, option)" @search-change="onSearch"
        @open="handleFocus" :class="[
          (validationError || serverError) ? 'is-invalid' : ''
        ]">
        <template #noResult>
          <div class="multiselect-no-result">
            Sem regitos
          </div>
        </template>

        <template #noOptions>
          <div class="multiselect-no-options">
            Escreva para pesquisar
          </div>
        </template>

        <template #option="{ option }">
          <div class="option-item">
            <div class="option-text">{{ getFieldFromObject(labelField, option) }}</div>
            <div v-if="templateSubtitle && showSubtitle" class="option-id option-hovered text-gray">
              {{ templateSubtitle(option) }}
            </div>
          </div>
        </template>

        <template #singleLabel="{ option }">
          <div class="selected-item">
            <span>{{ getFieldFromObject(labelField, option) }}</span>
            <div v-if="templateSubtitle && showSubtitle" class="option-id">{{ templateSubtitle(option) }}</div>
          </div>
        </template>

        <template #tag="{ option, remove }">
          <div class="multiselect-tag">
            <span>{{ getFieldFromObject(labelField, option) }}</span>
            <i class="multiselect-tag-icon" @click="remove(option)"></i>
          </div>
        </template>
      </multiselect>
    </BInputGroup>
    <div v-if="serverError" class="text-danger">{{ serverError }}</div>
    <div v-if="validationError" class="invalid-feedback d-block">
      {{ validationError }}
    </div>
    <div v-if="hint" class="form-text text-muted">{{ hint }}</div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.css';
import type {
  FilterOptions,
  IEntitySelectProps
} from '@common/presentation/hooks/types';
import { BInputGroup } from 'bootstrap-vue-next';

const props = withDefaults(defineProps(), {
  label: '',
  placeholder: 'Escolher',
  required: false,
  showLabel: true,
  disabled: false,
  validationError: '',
  serverError: '',
  hint: '',
  columnClass: 'col-md-12',
  searchFields: () => ['name'],
  labelField: 'name',

  valueField: 'id',
  multiple: false,
  showId: true,
  additionalFilters: () => ({}),
  preloadItems: false,
  watch: 0,
  addModal: true,
  showSubtitle: true,
  entityDisplayName: 'Item',
  modalColumns: () => [],
})

const emit = defineEmits(['update:modelValue', 'loaded']);

const items = ref<any[]>([]);
const isLoading = ref(false);
const page = ref(1);
const searchQuery = ref('');
const totalPages = ref(1);
const focused = ref(false);
const selectedValue = ref(null);
const searchTimer = ref<Timer | null>(null);
const selectModalRef = ref<any>(null);


watch(() => props.modelValue, (newValue) => {
  if (newValue !== selectedValue.value) {
    selectedValue.value = newValue;

    if (newValue && !hasSelectedItem(newValue)) {
      loadSelectedItem();
    }
  }
}, { immediate: true });

const handleSelect = (selectedOption, id) => {
  emit('update:modelValue', selectedOption);

}

const handleRemove = (removedOption, id) => {
  emit('update:modelValue', null);
}

function handleOpenSearchModal() {
  selectModalRef.value?.show();

  if (selectedValue.value) {
    selectModalRef.value?.handleItemSelect(selectedValue.value, true)
  }
}

function handleSelectionConfirm(selectedItems: any) {
  if (props.multiple) {
    emit('update:modelValue', selectedItems);
    // Adicionar à lista local se não existir
    selectedItems.forEach(item => {
      if (!items.value.some(existing => existing[props.valueField] === item[props.valueField])) {
        items.value.push(item);
      }
    });
  } else {
    emit('update:modelValue', selectedItems);
    // Adicionar à lista local se não existir
    if (selectedItems && !items.value.some(existing => existing[props.valueField] === selectedItems[props.valueField])) {
      items.value.push(selectedItems);
    }
  }
}

function handleSelectionCancel() {

}

watch([() => props.watch, focused], (newValue) => {
  loadItems(true)
});

function getFieldFromObject(field: string, object: Record<string, any>) {
  return field.split('.').reduce((obj, key) => obj?.[key], object)
}

function handleFocus() {

  focused.value = true;
}

function hasSelectedItem(value: any): boolean {
  if (!value) return true;

  if (Array.isArray(value)) {
    return value.every(v =>
      items.value.some(item => item[props.valueField] === v)
    );
  }

  if (typeof value === 'object') {
    return items.value.some(item =>
      item[props.valueField] === value[props.valueField]
    );
  }

  return items.value.some(item => item[props.valueField] === value);
};

async function loadItems(reset = false) {
  if (reset) {
    page.value = 1;
    items.value = [];
  }

  try {
    isLoading.value = true;

    const filters: FilterOptions = {
      search: searchQuery.value,
      page: page.value,
      perPage: 1000,
      total: 0,
      with: props.with || [],
      columns: [],
      searchable: props.searchFields,
      filters: [],
      ...props.additionalFilters
    };

    const response = await props.service.index(filters);
    const data = response.data;

    if (data.data) {
      const newItems = data.data.filter(newItem =>
        !items.value.some(existingItem => existingItem.id === newItem.id)
      );

      if (reset) {
        items.value = data.data;
      } else {
        items.value = [...items.value, ...newItems];
      }

      totalPages.value = data.last_page || 1;
    }

    emit('loaded', items.value);
  } catch (error) {
    console.error('Error loading items:', error);
  } finally {
    isLoading.value = false;
  }
};

async function loadSelectedItem() {
  if (!props.modelValue || isLoading.value) return;

  try {
    isLoading.value = true;

    if (Array.isArray(props.modelValue)) {
      const loadedItems = [];

      for (const value of props.modelValue) {
        try {
          const id = typeof value === 'object' ? value[props.valueField] : value;
          const filters = {
            with: props.with || [],
            columns: ["*"],
          };

          const response = await props.service.show(id, filters);
          if (response.data) {
            loadedItems.push(response.data);
          }
        } catch (err) {
          console.error(`Error loading item:`, err);
        }
      }

      if (loadedItems.length > 0) {
        items.value = [...items.value, ...loadedItems.filter(item =>
          !items.value.some(existingItem =>
            existingItem[props.valueField] === item[props.valueField]
          )
        )];
      }
    } else {
      const id = typeof props.modelValue === 'object'
        ? props.modelValue[props.valueField]
        : props.modelValue;

      const filters = {
        with: props.with || [],
        columns: ["*"],
      };

      const response = await props.service.show(id, filters);

      if (response.data) {
        const newItem = response.data;

        if (!items.value.some(item =>
          item[props.valueField] === newItem[props.valueField]
        )) {
          items.value = [...items.value, newItem];
        }
      }
    }
  } catch (error) {
    console.error('Error loading selected item:', error);
  } finally {
    isLoading.value = false;
  }
};

function onSearch(query: string) {
  if (searchTimer.value !== null) {
    clearTimeout(searchTimer.value);
  }

  searchQuery.value = query;

  searchTimer.value = setTimeout(() => {
    loadItems(true);
    searchTimer.value = null;
  }, 1500);
};

onMounted(() => {
  if (focused.value || props.preloadItems) {
    loadItems();
  }

  if (props.modelValue) {
    loadSelectedItem();
  }
});

defineExpose({
  loadItems
})
</script>

<style>
.add-modal .multiselect {
  width: calc(100% - 50px);
}

.multiselect {
  min-height: 38px;
}

.multiselect__tags {
  min-height: 38px;
  padding: 6px 40px 0 8px;
  border-radius: 0.25rem;
  /* border: 1px solid #ced4da; */
}

.multiselect__placeholder {
  padding-top: 0;
  margin-bottom: 0;
}

.multiselect__input,
.multiselect__single {
  margin-bottom: 0;
  padding: 0;
}

.multiselect__select {
  height: 38px;
}

.multiselect__tag {
  /* background: #4429f2; */
  margin-bottom: 4px;
}

.multiselect__tag-icon:after {
  /* color: #ffffff; */
}

.multiselect__tag-icon:focus,
.multiselect__tag-icon:hover {
  /* background: #0069d91c; */
}

.multiselect__option--highlight {
  /* background: #01091234; */
}

.multiselect__option--highlight:after {
  background: #0109129d;
  /* pressione para selecionar*/
}

.multiselect.is-invalid .multiselect__tags {
  /* border-color: #dc3545; */
}


.option-item {
  display: flex;
  flex-direction: column;
}

.option-id {
  font-size: 0.75rem;
  /* color: #6c757d; */
}

.selected-item {
  display: flex;
  flex-direction: column;
}

.selected-id {
  font-size: 0.75rem;
  /* color: #6c757d; */
}

.multiselect-no-result,
.multiselect-no-options {
  padding: 10px 15px;
}

/* ── Dark mode ─────────────────────────────────────────────────── */
[data-bs-theme="dark"] .multiselect__tags {
  background-color: var(--tblr-bg-forms, #1e2635);
  border-color: var(--tblr-border-color, #3a4460);
  color: var(--tblr-body-color, #c8cfda);
}

[data-bs-theme="dark"] .multiselect__input,
[data-bs-theme="dark"] .multiselect__single {
  background-color: var(--tblr-bg-forms, #1e2635);
  color: var(--tblr-body-color, #c8cfda);
}

[data-bs-theme="dark"] .multiselect__placeholder {
  color: var(--tblr-secondary, #7a8ba6);
}

[data-bs-theme="dark"] .multiselect__content-wrapper {
  background-color: var(--tblr-bg-surface, #1a2234);
  border-color: var(--tblr-border-color, #3a4460);
}

[data-bs-theme="dark"] .multiselect__option {
  background-color: var(--tblr-bg-surface, #1a2234);
  color: var(--tblr-body-color, #c8cfda);
}

[data-bs-theme="dark"] .multiselect__option--highlight,
[data-bs-theme="dark"] .multiselect__option--highlight:after {
  background-color: var(--tblr-primary, #4429f2);
  color: #fff;
}

[data-bs-theme="dark"] .multiselect__option--selected {
  background-color: rgba(68, 41, 242, 0.15);
  color: var(--tblr-primary, #4429f2);
  font-weight: 600;
}

[data-bs-theme="dark"] .multiselect__option--selected:after {
  background-color: rgba(68, 41, 242, 0.15);
  color: var(--tblr-primary, #4429f2);
}

[data-bs-theme="dark"] .multiselect__select {
  background: transparent;
}

[data-bs-theme="dark"] .multiselect__select:before {
  border-color: var(--tblr-secondary, #7a8ba6) transparent transparent;
}

[data-bs-theme="dark"] .multiselect__spinner {
  background: var(--tblr-bg-forms, #1e2635);
}

[data-bs-theme="dark"] .multiselect__tag {
  background: var(--tblr-primary, #4429f2);
}

[data-bs-theme="dark"] .multiselect__tag-icon:after {
  color: rgba(255,255,255,0.7);
}

[data-bs-theme="dark"] .multiselect__tag-icon:hover {
  background: rgba(0,0,0,0.2);
}

[data-bs-theme="dark"] .multiselect-no-result,
[data-bs-theme="dark"] .multiselect-no-options {
  color: var(--tblr-secondary, #7a8ba6);
}
</style>
