<template>
  <div
    v-if="modelValue"
    class="alert alert-dismissible d-flex align-items-center"
    :class="`alert-${type}`"
    role="alert"
  >
    <div class="alert-icon me-2">
      <!-- Ícones com ifs -->
      <svg v-if="type === 'danger'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="icon alert-icon icon-2">
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
        <path d="M12 8v4"></path>
        <path d="M12 16h.01"></path>
      </svg>

      <svg v-else-if="type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="icon alert-icon icon-2">
        <path d="M12 9v4"></path>
        <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z"></path>
        <path d="M12 16h.01"></path>
      </svg>

      <svg v-else-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="icon alert-icon icon-2">
        <path d="M5 12l5 5l10 -10"></path>
      </svg>

      <svg v-else-if="type === 'info'" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="icon alert-icon icon-2">
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
        <path d="M12 9h.01"></path>
        <path d="M11 12h1v4h1"></path>
      </svg>
    </div>

    <span>{{ modelValue }}</span>

    <button
      v-if="dismissible"
      class="btn-close ms-auto"
      @click="close"
      aria-label="close"
    ></button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  type: "success" | "danger" | "warning" | "info"
  dismissible?: boolean
}>()

const emit = defineEmits(["update:modelValue"])

const close = () => {
  emit("update:modelValue", "")
}
</script>
