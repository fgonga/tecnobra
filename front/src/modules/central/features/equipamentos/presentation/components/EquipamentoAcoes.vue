<!--
 -  Tecnobra — Separador de estado do equipamento: levantar/devolver + histórico.
-->
<template>
  <div class="p-4">
    <LoadingState v-if="!equipamento" />
    <template v-else>
      <PageHeader
        :title="equipamento.nome"
        :status="equipamento.estado === 'disponivel' ? 'active' : 'inactive'"
        :status-label="EQUIPAMENTO_ESTADOS[equipamento.estado ?? '']?.label ?? '—'"
        :meta-items="[{ label: 'Código', value: equipamento.codigo || '—' }]"
      />

      <InfoSection title="Situação" :icon="IconTool">
        <ResponsiveGrid columns="3">
          <InfoCard :icon="IconBuilding" label="Obra" :value="equipamento.obra?.nome || '—'" />
          <InfoCard :icon="IconTag" label="Categoria" :value="equipamento.categoria === 'equipamento' ? 'Equipamento' : 'Ferramenta'" />
          <InfoCard :icon="IconUser" label="Responsável atual" :value="equipamento.trabalhador_atual?.nome || '—'" />
        </ResponsiveGrid>
      </InfoSection>

      <!-- Ações -->
      <div class="my-3 d-flex gap-2 flex-wrap">
        <button
          v-if="equipamento.estado === 'disponivel'"
          class="btn btn-primary"
          @click="mostrarLevantar = !mostrarLevantar"
        >
          Registar levantamento
        </button>
        <button
          v-if="equipamento.estado === 'em_uso'"
          class="btn btn-success"
          @click="mostrarDevolver = !mostrarDevolver"
        >
          Registar devolução
        </button>
      </div>

      <!-- Form levantar -->
      <div v-if="mostrarLevantar" class="card mb-3">
        <div class="card-body">
          <h4>Levantamento</h4>
          <div class="row">
            <EntitySelectField
              label="Trabalhador responsável"
              v-model="levantarForm.trabalhador_id"
              required
              :service="TrabalhadoresService"
              :searchFields="['nome', 'funcao']"
              :templateSubtitle="(t) => t.funcao"
              :additionalFilters="trabalhadorFilters"
              :watchKey="equipamento?.id ?? 0"
              placeholder="Procurar trabalhador…"
              columnClass="col-md-6"
            />
            <FormField
              label="Devolução prevista"
              v-model="levantarForm.devolucao_prevista"
              type="datetime"
              columnClass="col-md-6"
            />
            <FormField label="Observações" v-model="levantarForm.obs" type="text" columnClass="col-md-12" />
          </div>
          <button class="btn btn-primary" :disabled="busy || !levantarForm.trabalhador_id" @click="levantar">
            <span v-if="busy" class="spinner-border spinner-border-sm me-2" />Confirmar levantamento
          </button>
        </div>
      </div>

      <!-- Form devolver -->
      <div v-if="mostrarDevolver" class="card mb-3">
        <div class="card-body">
          <h4>Devolução</h4>
          <div class="row">
            <FormField
              label="Estado na devolução"
              v-model="devolverForm.estado_devolucao"
              type="select"
              :options="[
                { label: 'Em bom estado', value: 'ok' },
                { label: 'Danificado', value: 'danificado' },
                { label: 'Desaparecido', value: 'desaparecido' },
              ]"
              columnClass="col-md-6"
            />
            <FormField label="Observações" v-model="devolverForm.obs" type="text" columnClass="col-md-6" />
          </div>
          <button class="btn btn-success" :disabled="busy" @click="devolver">
            <span v-if="busy" class="spinner-border spinner-border-sm me-2" />Confirmar devolução
          </button>
        </div>
      </div>

      <!-- Histórico -->
      <InfoSection title="Histórico de movimentos" :icon="IconHistory">
        <div v-if="historico.length" class="table-responsive">
          <table class="table table-sm table-vcenter">
            <thead>
              <tr><th>Tipo</th><th>Trabalhador</th><th>Estado</th><th>Quando</th><th>Obs.</th></tr>
            </thead>
            <tbody>
              <tr v-for="m in historico" :key="m.id">
                <td>
                  <span v-if="m.tipo === 'levantamento'" class="badge bg-blue text-blue-fg">Levantamento</span>
                  <span v-else class="badge bg-green text-green-fg">Devolução</span>
                </td>
                <td>{{ m.trabalhador?.nome ?? '—' }}</td>
                <td>
                  <template v-if="m.estado_devolucao === 'ok'">OK</template>
                  <template v-else-if="m.estado_devolucao === 'danificado'">Danificado</template>
                  <template v-else-if="m.estado_devolucao === 'desaparecido'">Desaparecido</template>
                  <template v-else>—</template>
                </td>
                <td class="text-muted">{{ fmt(m.ocorrido_em) }}</td>
                <td class="text-muted">{{ m.obs || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyState v-else message="Sem movimentos registados" />
      </InfoSection>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { IconTool, IconBuilding, IconTag, IconUser, IconHistory } from '@tabler/icons-vue'
import dayjs from 'dayjs'
import LoadingState from '@components/LoadingState.vue'
import EmptyState from '@components/EmptyState.vue'
import PageHeader from '@components/PageHeader.vue'
import InfoSection from '@components/InfoSection.vue'
import InfoCard from '@components/InfoCard.vue'
import ResponsiveGrid from '@components/ResponsiveGrid.vue'
import FormField from '@components/FormField.vue'
import EntitySelectField from '@components/EntitySelectField.vue'
import notify from '@common/application/utils/notification'
import { EquipamentoAcoesService } from '../../domain/service/EquipamentosService'
import { TrabalhadoresService } from '@/modules/central/features/trabalhadores/domain/service/TrabalhadoresService'
import type { IEquipamento } from '../../application/dtos'
import { EQUIPAMENTO_ESTADOS } from '../../application/dtos'

const props = defineProps<{
  equipamento?: IEquipamento | null
  onChanged?: () => void
}>()

const busy = ref(false)
const mostrarLevantar = ref(false)
const mostrarDevolver = ref(false)
const historico = ref<any[]>([])

const levantarForm = reactive({ trabalhador_id: null as number | null, devolucao_prevista: null as string | null, obs: '' })
const devolverForm = reactive({ estado_devolucao: 'ok', obs: '' })

// Trabalhadores ativos da obra do equipamento
const trabalhadorFilters = computed(() => ({
  filters: props.equipamento?.obra_id
    ? [
        { field: 'obra_id', operator: '=', value: props.equipamento.obra_id },
        { field: 'estado', operator: '=', value: 'ativo' },
      ]
    : [],
}))

const fmt = (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')

async function carregarHistorico() {
  if (!props.equipamento?.id) return
  const { data } = await EquipamentoAcoesService.historico(props.equipamento.id)
  historico.value = data.data ?? []
}

async function levantar() {
  if (!props.equipamento?.id || !levantarForm.trabalhador_id) return
  busy.value = true
  try {
    await EquipamentoAcoesService.levantar(props.equipamento.id, {
      trabalhador_id: Number(levantarForm.trabalhador_id),
      devolucao_prevista: levantarForm.devolucao_prevista || null,
      obs: levantarForm.obs || null,
    })
    notify.success('Levantamento registado.')
    mostrarLevantar.value = false
    props.onChanged?.()
    await carregarHistorico()
  } finally {
    busy.value = false
  }
}

async function devolver() {
  if (!props.equipamento?.id) return
  busy.value = true
  try {
    await EquipamentoAcoesService.devolver(props.equipamento.id, {
      estado_devolucao: devolverForm.estado_devolucao,
      obs: devolverForm.obs || null,
    })
    notify.success('Devolução registada.')
    mostrarDevolver.value = false
    props.onChanged?.()
    await carregarHistorico()
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  carregarHistorico()
})
watch(
  () => props.equipamento?.id,
  () => {
    mostrarLevantar.value = false
    mostrarDevolver.value = false
    carregarHistorico()
  }
)
</script>
