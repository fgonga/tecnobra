<!--
 -  Tecnobra — Consumos de materiais (saídas de stock).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div class="page-pretitle">Recursos</div>
          <h2 class="page-title">Consumos de materiais</h2>
        </div>
        <button class="btn btn-primary" @click="mostrarModal = true">Registar consumo</button>
      </div>

      <div class="card">
        <div v-if="crudService.isLoading.value" class="text-center py-5"><div class="spinner-border text-primary" /></div>
        <div v-else class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr><th>Material</th><th class="text-end">Quantidade</th><th>Trabalhador</th><th>Quando</th><th>Obs.</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in consumos" :key="c.id">
                <td><strong>{{ c.material?.nome ?? c.material_id }}</strong></td>
                <td class="text-end">{{ Number(c.quantidade) }} {{ c.material?.unidade }}</td>
                <td>{{ c.trabalhador?.nome ?? '—' }}</td>
                <td class="text-muted">{{ fmt(c.ocorrido_em!) }}</td>
                <td class="text-muted">{{ c.obs || '—' }}</td>
              </tr>
              <tr v-if="!consumos.length">
                <td colspan="5" class="text-center text-muted py-4">Sem consumos registados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal registar consumo -->
      <BModal v-model="mostrarModal" title="Registar consumo" :no-close-on-backdrop="true" @hidden="reset">
        <div class="row">
          <EntitySelectField
            label="Obra"
            v-model="form.obra_id"
            required
            :service="ObrasService"
            :searchFields="['nome', 'codigo', 'cliente']"
            :templateSubtitle="(o) => o.codigo"
            placeholder="Procurar obra…"
            columnClass="col-md-6"
            @update:modelValue="onObraChange"
          />
          <EntitySelectField
            label="Material"
            v-model="form.material_id"
            required
            :service="MateriaisService"
            :searchFields="['nome', 'categoria']"
            :templateSubtitle="(m) => `${Number(m.stock_atual)} ${m.unidade}`"
            :additionalFilters="materiaisFilters"
            :watchKey="obraWatch"
            :disabled="!form.obra_id"
            placeholder="Procurar material…"
            columnClass="col-md-6"
          />
          <FormField label="Quantidade" v-model="form.quantidade" required type="number" columnClass="col-md-6" />
          <EntitySelectField
            label="Trabalhador (opcional)"
            v-model="form.trabalhador_id"
            :service="TrabalhadoresService"
            :searchFields="['nome', 'funcao']"
            :templateSubtitle="(t) => t.funcao"
            :additionalFilters="trabalhadorFilters"
            :watchKey="obraWatch"
            :disabled="!form.obra_id"
            placeholder="Procurar trabalhador…"
            columnClass="col-md-6"
          />
          <FormField label="Observações" v-model="form.obs" type="text" columnClass="col-12" />
        </div>
        <template #footer>
          <button class="btn" @click="mostrarModal = false">Cancelar</button>
          <button class="btn btn-primary" :disabled="busy || !valido" @click="guardar">
            <span v-if="busy" class="spinner-border spinner-border-sm me-2" />Registar
          </button>
        </template>
      </BModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import FormField from '@components/FormField.vue'
import EntitySelectField from '@components/EntitySelectField.vue'
import notify from '@common/application/utils/notification'
import { ConsumosService } from '../../domain/service/ConsumosService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'
import { MateriaisService } from '@/modules/central/features/materiais/domain/service/MateriaisService'
import { TrabalhadoresService } from '@/modules/central/features/trabalhadores/domain/service/TrabalhadoresService'

const fmt = (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')

const mostrarModal = ref(false)
const busy = ref(false)

const form = reactive({
  obra_id: null as number | null,
  material_id: null as number | null,
  quantidade: null as number | null,
  trabalhador_id: null as number | null,
  obs: '',
})

// Material e trabalhador filtrados pela obra selecionada
const obraWatch = ref(0)
const materiaisFilters = computed(() => ({
  filters: form.obra_id ? [{ field: 'obra_id', operator: '=', value: form.obra_id }] : [],
}))
const trabalhadorFilters = computed(() => ({
  filters: form.obra_id ? [{ field: 'obra_id', operator: '=', value: form.obra_id }] : [],
}))

function onObraChange() {
  form.material_id = null
  form.trabalhador_id = null
  obraWatch.value++
}

const valido = computed(() => form.obra_id && form.material_id && Number(form.quantidade) > 0)

const crudService = useCrud({
  service: ConsumosService,
  searchable: [],
  relations: ['material', 'trabalhador'],
})
crudService.filters.orderBy = 'ocorrido_em'
crudService.filters.sortMethod = 'DESC'

const consumos = computed(() => crudService.items.value as any[])

function reset() {
  form.obra_id = null
  form.material_id = null
  form.quantidade = null
  form.trabalhador_id = null
  form.obs = ''
}

async function guardar() {
  busy.value = true
  try {
    const { data } = await ConsumosService.store({
      obra_id: Number(form.obra_id),
      material_id: Number(form.material_id),
      quantidade: Number(form.quantidade),
      trabalhador_id: form.trabalhador_id ? Number(form.trabalhador_id) : null,
      obs: form.obs || null,
    } as any)
    if ((data as any).stock_baixo) {
      notify.error(`Atenção: ${(data as any).material.nome} ficou abaixo do stock mínimo!`)
    } else {
      notify.success('Consumo registado.')
    }
    mostrarModal.value = false
    crudService.fetchItems()
  } finally {
    busy.value = false
  }
}
</script>
