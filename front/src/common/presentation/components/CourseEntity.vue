<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
-->

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
      placeholder="Escolher curso..."
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
import { CoursesService } from '@/modules/central/features/courses/domain/service/CoursesService'
import type { FilterOptions } from '@common/presentation/hooks/types'

const props = defineProps({
  modelValue: [Object, String, Number],
  label: { type: String, default: 'Curso' },
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

    const res = await CoursesService.index(filters)
    items.value = res.data?.data || []
    emit('loaded', items.value)
  } catch (e) {
    console.error('Erro ao carregar cursos:', e)
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
