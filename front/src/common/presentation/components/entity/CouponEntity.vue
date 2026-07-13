<template>
  <div class="mb-3" :class="columnClass">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    <multiselect
      v-model="selected"
      :options="items"
      :loading="isLoading"
      placeholder="Escolher cupon..."
      label="name"
      track-by="id"
      :internal-search="false"
      @search-change="onSearch"
      @select="onSelect"
      @remove="onRemove"
      :class="{ 'is-invalid': validationError || serverError }"
    >
      <template #noResult>Sem registos</template>
      <template #noOptions>Escreva para pesquisar</template>
    </multiselect>
    <div v-if="validationError" class="invalid-feedback d-block">{{ validationError }}</div>
    <div v-if="serverError" class="text-danger">{{ serverError }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import { CouponsService } from '@/modules/central/features/coupons/domain/service/CouponsService'
import type { FilterOptions } from '@common/presentation/hooks/types'

const props = defineProps({
  modelValue: [Object, String, Number],
  label: { type: String, default: 'Coupon' },
  required: { type: Boolean, default: false },
  validationError: { type: String, default: '' },
  serverError: { type: String, default: '' },
  columnClass: { type: String, default: 'col-md-12' },
  preloadItems: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'loaded'])

const items = ref<any[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const selected = ref(props.modelValue)

watch(() => props.modelValue, (v) => (selected.value = v))

async function loadItems() {
  try {
    isLoading.value = true
    const filters: FilterOptions = {
      search: searchQuery.value,
      perPage: 100,
      page: 1,
      searchable: ['name'],
    }

    const res = await CouponsService.index(filters)
    items.value = res.data?.data || []
    emit('loaded', items.value)
  } catch (e) {
    console.error('Erro ao carregar cupons:', e)
  } finally {
    isLoading.value = false
  }
}

function onSelect(option: any) {
  emit('update:modelValue', option)
}

function onRemove() {
  emit('update:modelValue', null)
}

function onSearch(q: string) {
  searchQuery.value = q
  loadItems()
}

onMounted(() => {
  if (props.preloadItems) loadItems()
})
</script>

<style>
.multiselect {
  min-height: 38px;
}
.is-invalid .multiselect__tags {
  border-color: #dc3545 !important;
}
</style>
