<!--
  -  Copyright © 2021 - 2026
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -->

<template>
  <div class="period-picker dropdown" ref="root">
    <button
      type="button"
      class="form-control d-flex align-items-center justify-content-between period-picker-toggle"
      :class="{ 'is-invalid': !!validationError || !!serverError }"
      @click="toggleMenu"
    >
      <span class="text-truncate">{{ currentLabel }}</span>
      <Icon icon="tabler:calendar" :width="16" :height="16" />
    </button>

    <div
      v-if="open"
      class="dropdown-menu dropdown-menu-end show period-picker-menu"
    >
      <div class="row g-3">
        <div
          v-for="group in groups"
          :key="group.title"
          :class="['period-picker-section', group.span === 2 ? 'col-12' : 'col-6']"
        >
          <div class="section-header mb-2">{{ group.title }}</div>
          <div class="row g-2">
            <div
              v-for="opt in group.options"
              :key="opt.key"
              :class="['col-' + (12 / group.cols)]"
            >
              <button
                type="button"
                class="period-chip w-100"
                :class="{ active: isActive(opt.key) }"
                @click="select(opt.key)"
              >
                <Icon
                  v-if="isActive(opt.key)"
                  icon="tabler:check"
                  :width="12"
                  :height="12"
                  class="me-1"
                />
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="dropdown-divider"></div>

      <a
        class="dropdown-item d-flex align-items-center justify-content-between"
        role="button"
        @click="customOpen = !customOpen"
      >
        <span>Personalizado</span>
        <Icon
          icon="tabler:chevron-down"
          :width="14"
          :height="14"
          :style="{ transform: customOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }"
        />
      </a>

      <div v-if="customOpen" class="p-2 period-picker-custom">
        <div class="row g-2">
          <div class="col-6">
            <label class="form-label small mb-1">Início</label>
            <input type="date" class="form-control form-control-sm" v-model="customStart" />
          </div>
          <div class="col-6">
            <label class="form-label small mb-1">Fim</label>
            <input type="date" class="form-control form-control-sm" v-model="customEnd" />
          </div>
        </div>
        <div class="d-flex justify-content-end mt-2">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="!customStart || !customEnd || customStart > customEnd"
            @click="applyCustom"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs'

type PresetKey =
  | 'today' | 'yesterday'
  | 'this_week' | 'last_week'
  | 'this_month' | 'last_month'
  | 'q1' | 'q2' | 'q3' | 'q4'
  | 'h1' | 'h2'
  | 'this_year' | 'last_year'
  | 'custom'

export interface PeriodValue {
  preset: PresetKey
  start: string
  end: string
}

const props = defineProps<{
  modelValue?: PeriodValue | null
  validationError?: string | null
  serverError?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: PeriodValue): void
}>()

const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD')

const today = dayjs()
const year = today.year()

const presets: Record<Exclude<PresetKey, 'custom'>, { label: string; range: () => { start: string; end: string } }> = {
  today:      { label: 'Hoje',             range: () => ({ start: fmt(today),                        end: fmt(today) }) },
  yesterday:  { label: 'Ontem',            range: () => ({ start: fmt(today.subtract(1, 'day')),     end: fmt(today.subtract(1, 'day')) }) },
  this_week:  { label: 'Esta Semana',      range: () => ({ start: fmt(today.startOf('week')),        end: fmt(today.endOf('week')) }) },
  last_week:  { label: 'Semana Passada',   range: () => ({ start: fmt(today.subtract(1, 'week').startOf('week')), end: fmt(today.subtract(1, 'week').endOf('week')) }) },
  this_month: { label: 'Este Mês',         range: () => ({ start: fmt(today.startOf('month')),       end: fmt(today.endOf('month')) }) },
  last_month: { label: 'Último Mês',       range: () => ({ start: fmt(today.subtract(1, 'month').startOf('month')), end: fmt(today.subtract(1, 'month').endOf('month')) }) },
  q1:         { label: '1º Trimestre',     range: () => ({ start: `${year}-01-01`, end: `${year}-03-31` }) },
  q2:         { label: '2º Trimestre',     range: () => ({ start: `${year}-04-01`, end: `${year}-06-30` }) },
  q3:         { label: '3º Trimestre',     range: () => ({ start: `${year}-07-01`, end: `${year}-09-30` }) },
  q4:         { label: '4º Trimestre',     range: () => ({ start: `${year}-10-01`, end: `${year}-12-31` }) },
  h1:         { label: '1º Semestre',      range: () => ({ start: `${year}-01-01`, end: `${year}-06-30` }) },
  h2:         { label: '2º Semestre',      range: () => ({ start: `${year}-07-01`, end: `${year}-12-31` }) },
  this_year:  { label: 'Este Ano',         range: () => ({ start: `${year}-01-01`, end: `${year}-12-31` }) },
  last_year:  { label: 'Último Ano',       range: () => ({ start: `${year - 1}-01-01`, end: `${year - 1}-12-31` }) },
}

const groups = [
  { title: 'Dias',       cols: 2, span: 1, options: [
      { key: 'today',      label: presets.today.label },
      { key: 'yesterday',  label: presets.yesterday.label },
  ] },
  { title: 'Semanas',    cols: 2, span: 1, options: [
      { key: 'this_week',  label: 'Esta' },
      { key: 'last_week',  label: 'Passada' },
  ] },
  { title: 'Meses',      cols: 2, span: 1, options: [
      { key: 'this_month', label: presets.this_month.label },
      { key: 'last_month', label: presets.last_month.label },
  ] },
  { title: 'Anos',       cols: 2, span: 1, options: [
      { key: 'this_year',  label: presets.this_year.label },
      { key: 'last_year',  label: presets.last_year.label },
  ] },
  { title: 'Trimestres', cols: 4, span: 2, options: [
      { key: 'q1', label: '1º Tri' },
      { key: 'q2', label: '2º Tri' },
      { key: 'q3', label: '3º Tri' },
      { key: 'q4', label: '4º Tri' },
  ] },
  { title: 'Semestres',  cols: 2, span: 2, options: [
      { key: 'h1', label: '1º Sem' },
      { key: 'h2', label: '2º Sem' },
  ] },
] as const

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const customOpen = ref(false)

const initial = props.modelValue ?? { preset: 'this_month' as PresetKey, ...presets.this_month.range() }
const currentPreset = ref<PresetKey>(initial.preset)
const currentStart = ref<string>(initial.start)
const currentEnd = ref<string>(initial.end)
const customStart = ref<string>(initial.preset === 'custom' ? initial.start : '')
const customEnd = ref<string>(initial.preset === 'custom' ? initial.end : '')

watch(() => props.modelValue, (v) => {
  if (!v) return
  currentPreset.value = v.preset
  currentStart.value = v.start
  currentEnd.value = v.end
}, { deep: true })

const currentLabel = computed(() => {
  if (currentPreset.value === 'custom') {
    return `${currentStart.value} — ${currentEnd.value}`
  }
  return (presets as any)[currentPreset.value]?.label ?? 'Selecionar período'
})

function isActive(key: string) {
  return key === currentPreset.value
}

function toggleMenu() {
  open.value = !open.value
  if (!open.value) customOpen.value = false
}

function closeMenu() {
  open.value = false
  customOpen.value = false
}

function select(key: PresetKey) {
  if (key === 'custom') return
  const preset = presets[key as Exclude<PresetKey, 'custom'>]
  const range = preset.range()
  currentPreset.value = key
  currentStart.value = range.start
  currentEnd.value = range.end
  emit('update:modelValue', { preset: key, start: range.start, end: range.end })
  closeMenu()
}

function applyCustom() {
  if (!customStart.value || !customEnd.value) return
  currentPreset.value = 'custom'
  currentStart.value = customStart.value
  currentEnd.value = customEnd.value
  emit('update:modelValue', { preset: 'custom', start: customStart.value, end: customEnd.value })
  closeMenu()
}

function onDocClick(e: MouseEvent) {
  if (!root.value) return
  if (!root.value.contains(e.target as Node)) closeMenu()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.period-picker {
  position: relative;
  min-width: 200px;
}

.period-picker-toggle {
  cursor: pointer;
  text-align: left;
}

.period-picker-menu {
  min-width: 440px;
  padding: 1rem;
  margin-top: 4px;
}

.period-picker-section {
  border: none !important;
  background: transparent !important;
}

.section-header {
  padding: 0 0.35rem;
  line-height: 1.2;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bs-secondary-color);
  font-weight: 600;
  border: none !important;
  background: transparent !important;
}

.period-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  background: #e9ecef;
  border: 1px solid #dee2e6;
  font-size: 0.8rem;
  color: #495057;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.period-chip:hover {
  background: #dee2e6;
  color: #212529;
  border-color: #ced4da;
}

[data-bs-theme="dark"] .period-chip {
  background: #2b3035;
  border-color: #373b3e;
  color: #adb5bd;
}

[data-bs-theme="dark"] .period-chip:hover {
  background: #343a40;
  border-color: #495057;
  color: #f8f9fa;
}

.period-chip.active {
  background: rgba(var(--bs-primary-rgb), 0.18);
  color: var(--bs-primary);
  border-color: var(--bs-primary);
  font-weight: 600;
}

.period-chip.active:hover {
  background: rgba(var(--bs-primary-rgb), 0.25);
}

.period-picker-custom {
  background-color: var(--bs-tertiary-bg);
  border-radius: 6px;
}

@media (max-width: 540px) {
  .period-picker-menu {
    min-width: 300px;
  }
  .period-picker-grid {
    grid-template-columns: 1fr;
  }
}
</style>
