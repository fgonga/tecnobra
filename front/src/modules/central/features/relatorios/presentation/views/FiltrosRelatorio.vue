<!--
 -  Tecnobra — Barra de filtros comum aos relatórios (período + obra + exports).
-->
<template>
  <div class="card mb-3">
    <div class="card-body py-3">
      <div class="row g-2 align-items-end">
        <div class="col-auto">
          <label class="form-label small mb-1">De</label>
          <input v-model="localStart" type="date" class="form-control" />
        </div>
        <div class="col-auto">
          <label class="form-label small mb-1">Até</label>
          <input v-model="localEnd" type="date" class="form-control" />
        </div>
        <div class="col-auto">
          <label class="form-label small mb-1">Obra</label>
          <select v-model.number="localObra" class="form-select">
            <option :value="0">Todas</option>
            <option v-for="o in obras" :key="o.id" :value="o.id">{{ o.codigo }} — {{ o.nome }}</option>
          </select>
        </div>
        <slot name="extra" />
        <div class="col-auto">
          <button class="btn btn-primary" :disabled="busy" @click="aplicar">
            <span v-if="busy" class="spinner-border spinner-border-sm me-2" />Aplicar
          </button>
        </div>
        <div class="col-auto ms-auto">
          <button class="btn btn-outline-secondary me-2" @click="$emit('export-excel')">Excel</button>
          <button class="btn btn-outline-secondary" @click="$emit('export-pdf')">PDF</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'

const props = defineProps<{ busy?: boolean }>()
const emit = defineEmits(['aplicar', 'export-excel', 'export-pdf'])

const obras = ref<any[]>([])
const localStart = ref(dayjs().startOf('month').format('YYYY-MM-DD'))
const localEnd = ref(dayjs().format('YYYY-MM-DD'))
const localObra = ref(0)

function aplicar() {
  emit('aplicar', {
    start: localStart.value,
    end: localEnd.value,
    obra_id: localObra.value || null,
  })
}

onMounted(async () => {
  const { data } = await ObrasService.index({ perPage: 100, page: 1 } as any)
  obras.value = data.data ?? []
  aplicar()
})

defineExpose({ aplicar })
</script>
