<template>
  <div class="json-viewer">
    <template v-for="(value, key) in normalizedData" :key="key">
      <div v-if="isObject(value)" class="json-group">
        <h6 class="json-title">{{ key }}</h6>
        <JsonViewerSection :data="value" />
      </div>

      <div v-else class="json-item">
        <span class="key">{{ key }}:</span>
        <span class="value">{{ formatValue(value) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import JsonViewerSection from '@components/JsonViewerSection.vue'
import { defineProps, defineEmits  } from 'vue'
const props = defineProps<{ data: Record<string, any> }>()
import { computed } from 'vue'
// Faz parse automático de campos stringificados em JSON
const normalize = (input: any): any => {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return normalize(parsed)
    } catch {
      return input
    }
  }
  if (Array.isArray(input)) return input.map(normalize)
  if (input && typeof input === 'object') {
    const result: Record<string, any> = {}
    for (const [k, v] of Object.entries(input)) result[k] = normalize(v)
    return result
  }
  return input
}

const normalizedData = computed(() => normalize(props.data))

const isObject = (value: any): boolean =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const formatValue = (val: any) => {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não'
  if (typeof val === 'number') return val.toString()
  return val
}
</script>

<style scoped>
.json-viewer {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-left: 0.5rem;
}

.json-group {
  background: var(--tblr-bg-surface-secondary, #f9fafb);
  border: 1px solid var(--tblr-border-color, #e5e7eb);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  margin-top: 0.6rem;
}

.json-title {
  font-weight: 600;
  color: var(--tblr-body-color, #1e293b);
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  border-bottom: 1px solid var(--tblr-border-color, #e2e8f0);
  padding-bottom: 0.2rem;
}

.json-item {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed var(--tblr-border-color, #e2e8f0);
  padding: 0.25rem 0;
}
.json-item:last-child {
  border-bottom: none;
}

.key {
  font-weight: 600;
  color: var(--tblr-body-color, #1e293b);
}
.value {
  color: var(--tblr-secondary-color, #334155);
  text-align: right;
  max-width: 70%;
  word-break: break-word;
}
</style>
