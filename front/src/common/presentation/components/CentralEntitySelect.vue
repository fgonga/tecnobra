<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte,
  -  é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<template>
  <EntitySelect
    ref="entitySelectRef"
    module="customer"
    v-bind="entityProps"
    :value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @loaded="$emit('loaded', $event)"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import EntitySelect from '@common/presentation/components/EntitySelect.vue'
import type { IEntitySelectProps } from '@/common/presentation/hooks/types'
import { CoursesService } from '@/modules/central/features/courses/domain/service/CoursesService'
import type { ICourses } from '@/modules/central/courses/application/dtos'
import { entitySelectProps } from '@/common/application/utils/entitySelectProps'

export type EntityType = 'courses'
type IFolders = 'courses'


const entityConfigs: Record<EntityType, any> = {
  courses: {
   service: () => CoursesService,
    label: 'Escolha um curso',
    searchFields: ['name'],
    labelField: 'name',
    valueField: 'id',
    required: true,
    placeholder: 'Buscar cursos...',
    folderName: 'courses',
  },
}

const entitySelectRef = ref<InstanceType<typeof EntitySelect>>()


const props = defineProps({
  type: {
    type: String as () => EntityType,
    required: true,
  },
  ...entitySelectProps,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'loaded', payload: any): void
}>()


const entityProps = computed(() => {
  const config = entityConfigs[props.type] || {}

  return {
    ...config,
    module: 'customer',
    label: props.label ?? config.label,
    placeholder: props.placeholder ?? config.placeholder,
    required: props.required ?? config.required,
    service: props.service ?? config.service,
    searchFields: props.searchFields ?? config.searchFields,
    labelField: props.labelField ?? config.labelField,
    valueField: props.valueField ?? config.valueField,
    showSubtitle: props.showSubtitle ?? config.showSubtitle,

    disabled: props.disabled,
    validationError: props.validationError,
    serverError: props.serverError,
    hint: props.hint,
    columnClass: props.columnClass,
    multiple: props.multiple,
    showId: props.showId,
    additionalFilters: config.additionalFilters || props.additionalFilters,
    preloadItems: props.preloadItems,
    watch: props.watch,
    modelValue: props.modelValue,
  }
})


watch(
  () => props.watch,
  () => {
    if (entitySelectRef.value) {
      entitySelectRef.value.loadItems(true)
    }
  }
)
</script>
