<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->
<template>
  <div class="table-filter">
    <div v-if="schema">
      <div>
        <form @submit.prevent="applyFilters">
          <div class="row">
            <template v-for="(field, index) in schema.fields || []" :key="index">
              <template v-if="['text', 'number', 'date', 'datetime'].includes(field.type)">
                <FormField
                  :label="field.label"
                  :type="field.type"
                  v-model="formValues[field.field]"
                  :placeholder="field.placeholder"
                  :required="field.required"
                  :disabled="field.disabled"
                  :hint="field.hint"
                  :columnClass="field.columnClass || schema.columnClass || 'col-md-4'"
                />
              </template>

              <template v-else-if="field.type === 'select'">
                <FormField
                  :label="field.label"
                  type="select"
                  v-model="formValues[field.field]"
                  :placeholder="field.placeholder"
                  :required="field.required"
                  :disabled="field.disabled"
                  :hint="field.hint"
                  :options="field.options"
                  :columnClass="field.columnClass || schema.columnClass || 'col-md-4'"
                />
              </template>

              <template v-else-if="field.type === 'checkbox'">
                <FormField
                  :label="field.label"
                  type="checkbox"
                  v-model="formValues[field.field]"
                  :placeholder="field.placeholder"
                  :required="field.required"
                  :disabled="field.disabled"
                  :hint="field.hint"
                  :columnClass="field.columnClass || schema.columnClass || 'col-md-4'"
                />
              </template>

              <template v-else-if="field.type === 'entity' && field.entityType">
                <div :class="field.columnClass || schema.columnClass || 'col-md-4'">
                  <label class="form-label">{{ field.label }}</label>
                  <!-- <component :is="getComponentEntity(props.module)" label="" :type="field.entityType" -->
                  <component
                    :is="field.entityComponent || schema.entityComponent"
                    label=""
                    :type="field.entityType"
                    v-model="formValues[field.field]"
                    :placeholder="field.placeholder"
                    :required="field.required"
                    :disabled="field.disabled"
                    :showSubtitle="false"
                  />
                  <!-- <ECEntity label="" :type="field.entityType" v-model="formValues[field.field]"
                    :placeholder="field.placeholder" :required="field.required" :disabled="field.disabled" /> -->
                  <div v-if="field.hint" class="form-text text-muted">{{ field.hint }}</div>
                </div>
              </template>
            </template>
          </div>

          <div class="d-flex justify-content-end mt-3">
            <BButton @click="clearFilters" variant="default" class="me-2">
              <i class="ti ti-eraser me-1"></i> Limpar
            </BButton>
            <BButton type="submit" variant="primary">
              <i class="ti ti-filter me-1"></i> Aplicar filtros
            </BButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits, watch, onMounted, computed } from 'vue'
import FormField from '@components/FormField.vue'
import type { FilterSchema, FilterCondition, IEntitySelectProps } from '@common/hooks/types'
import type { useCrud } from '../hooks/useCrud'

const props = defineProps({
  schema: {
    type: Object as () => FilterSchema,
    required: false,
  },
  crudService: {
    type: Object as () => ReturnType<typeof useCrud>,
    required: true,
  },
  defaultFilters: {
    type: Array as () => FilterCondition[],
    default: () => [],
  },
  module: {
    type: String,
    default: 'ecommerce',
  },
})

const emit = defineEmits(['filter-applied', 'filter-cleared'])

const isExpanded = ref(false)
const formValues = reactive<Record<string, any>>({})

// @ts-expect-error deleteAfter
const allDefaultFilters = computed(() => props.defaultFilters.filter((e) => !e.deleteAfter))

watch(
  () => props.schema,
  (newSchema) => {
    newSchema?.fields?.forEach((field) => {
      if (field.defaultValue !== undefined) {
        formValues[field.field] = field.defaultValue
      } else {
        switch (field.type) {
          case 'checkbox':
            formValues[field.field] = false
            break
          case 'select':
          case 'entity':
            formValues[field.field] = field.multiple ? [] : null
            break
          default:
            formValues[field.field] = null
        }
      }
    })
  },
  { immediate: true },
)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

function clearField(field: string) {
  if (field.includes('|')) {
    const [, newField] = field.split('|')
    return newField
  }
  return field
}

const applyFilters = () => {
  const filters: FilterCondition[] = [...allDefaultFilters.value]

  props.schema?.fields?.forEach((field) => {
    let value = formValues[field.field]

    if (field.operator === 'like' && value) {
      value = `%${value}%`
    }

    if (value !== null && value !== undefined && value !== '') {
      const exists = filters.find((f) => f.field === field.field)
      if (exists) {
        const index = filters.findIndex((i) => i.field === exists.field)
        filters[index] = {
          field: clearField(field.field),
          operator: field.operator || '=',
          value: typeof value === 'object' && 'id' in value ? value.id : value,
        }
      } else {
        filters.push({
          field: clearField(field.field),
          operator: field.operator || '=',
          value: typeof value === 'object' && 'id' in value ? value.id : value,
        })
      }
    }
  })

  props.crudService.filters.filters = filters

  props.crudService.fetchItems()

  emit('filter-applied', filters)
}

const clearFilters = () => {
  props.schema?.fields?.forEach((field) => {
    if (field.defaultValue !== undefined) {
      formValues[field.field] = field.defaultValue
    } else {
      switch (field.type) {
        case 'checkbox':
          formValues[field.field] = false
          break
        case 'select':
        case 'entity':
          formValues[field.field] = field.multiple ? [] : null
          break
        default:
          formValues[field.field] = null
      }
    }
  })

  props.crudService.filters.filters = [...props.defaultFilters]

  props.crudService.fetchItems()

  emit('filter-cleared')
}
</script>

<style scoped>
.table-filter {
  /* margin-bottom: 1rem; */
}
</style>
