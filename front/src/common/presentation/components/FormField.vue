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

<template>
  <div class="mb-3" :class="columnClass">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <!-- Checkbox -->
    <div v-if="type === 'checkbox'" class="form-check d-flex justify-content-start px-0">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="updateValue($event)"
        :class="['form-check-input', (validationError || serverError) ? 'is-invalid' : '']"
        :disabled="disabled"
        :readonly="readonly"
        :name="name"
      />
      <label class="form-check-label">{{ placeholder }}</label>
    </div>

    <!-- Password com botão de mostrar/ocultar -->
    <div v-else-if="type === 'password'" class="input-group">

      <div class="input-group input-group-flat">
        <input
          :tabindex="props.tabindex"
          :type="showPassword ? 'text' : 'password'"
          v-model="localValue"
          :class="inputClass"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :name="name"
          :autocomplete="autocomplete || 'current-password'"
        />
        <span class="input-group-text link-secondary px-2 pe-2 border-start-0" @click="toggleShowPassword" role="button"
        >
                 <IconEye size="20" role="button" v-if="showPassword === true"/>
                 <IconEyeOff v-else size="20" role="button"/>
</span>
      </div>


    </div>
    <input  v-else-if="type === 'datetime'"
            type="datetime-local"
            :value="modelValue"
            @input="updateValue($event)"
            :class="inputClass"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :name="name"
            class="w-100"
            :autocomplete="autocomplete"
    />
    <select
      v-else-if="type === 'year'"
      :value="modelValue"
      @change="updateValue($event)"
      :class="inputClass"
      :disabled="disabled"
      :readonly="readonly"
      :name="name"
      class="form-select w-100"
    >
      <option value="" disabled selected>{{ placeholder || 'Escolha um ano' }}</option>
      <option
        v-for="year in availableYears"
        :key="year"
        :value="year"
      >
        {{ year }}
      </option>
    </select>
    <!-- Input padrão -->
    <input
      v-else-if="type !== 'textarea' && type !== 'select'"
      :type="type"
      :value="modelValue"
      @input="updateValue($event)"
      :class="inputClass"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :name="name"
      class="w-100"
      :autocomplete="autocomplete"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :value="modelValue"
      @input="updateValue($event)"
      :class="inputClass"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :name="name"
    ></textarea>

    <!-- Select -->
    <select
      v-else-if="type === 'select'"
      :value="normalizeValue(modelValue)"
      @change="updateValue($event)"
      :class="inputClass"
      :disabled="disabled"
      :name="name"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value ?? option.text ?? option.label" :value="normalizeValue(option.value)">
        {{ option.text || option.label }}
      </option>
    </select>
    <!-- Mensagens de erro / hint -->
    <div v-if="serverError" class="text-danger">{{ serverError }}</div>
    <div v-if="validationError" class="invalid-feedback d-block">{{ validationError }}</div>
    <div v-if="hint" class="form-text text-muted">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {IconEye, IconEyeOff } from '@tabler/icons-vue';
const props = defineProps({
  modelValue: { type: [String, Number, Boolean, Object], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  validationError: { type: String, default: '' },
  serverError: { type: String, default: '' },
  hint: { type: String, default: '' },
  tabindex: { type: Number, default: 0 },
  name: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  options: { type: Array as () => Array<{ value: any; text?: string; label?: string }>, default: () => [] },
  rows: { type: Number, default: 3 },
  columnClass: { type: String, default: 'col-md-12' }
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>();

const inputClass = computed(() => [
  'form-control',
  (props.validationError || props.serverError) ? 'is-invalid' : ''
]);
const localValue = ref(props.modelValue);
const currentYear = new Date().getFullYear();

const availableYears = computed(() => {
  const range = 10; // quantos anos queres listar
  return Array.from({ length: range }, (_, i) => currentYear - i);
});
watch(localValue, (val) => emit('update:modelValue', val));
watch(() => props.modelValue, (val) => localValue.value = val);
const showPassword = ref(false);
const toggleShowPassword = () => { showPassword.value = !showPassword.value; };
const normalizeValue = (val: any) => {
  if (val === true) return 1
  if (val === false) return 0
  return val
}
const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  let value: any;

  if (target.type === 'checkbox') {
    value = (target as HTMLInputElement).checked;
  } else {
    value = target.value;
  }

  if (value === "true") value = 1;
  if (value === "false") value = 0;
  emit('update:modelValue', value);
};
</script>
