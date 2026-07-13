<!--
 -  Tecnobra — Alertas inteligentes (ferramentas não devolvidas, stock baixo).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div class="page-pretitle">Gestão</div>
          <h2 class="page-title">Alertas</h2>
        </div>
        <div class="btn-group">
          <button class="btn" :class="filtroEstado === 'aberto' ? 'btn-primary' : 'btn-outline-primary'" @click="mudarFiltro('aberto')">Abertos</button>
          <button class="btn" :class="filtroEstado === 'resolvido' ? 'btn-primary' : 'btn-outline-primary'" @click="mudarFiltro('resolvido')">Resolvidos</button>
          <button class="btn" :class="filtroEstado === '' ? 'btn-primary' : 'btn-outline-primary'" @click="mudarFiltro('')">Todos</button>
        </div>
      </div>

      <div class="card">
        <div v-if="crudService.isLoading.value" class="text-center py-5"><div class="spinner-border text-primary" /></div>
        <div v-else class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr><th>Tipo</th><th>Mensagem</th><th>Obra</th><th>Quando</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="a in alertas" :key="a.id">
                <td>
                  <span v-if="a.tipo === 'ferramenta_nao_devolvida'" class="badge bg-orange text-orange-fg">Ferramenta</span>
                  <span v-else-if="a.tipo === 'stock_baixo'" class="badge bg-yellow text-yellow-fg">Stock</span>
                  <span v-else-if="a.tipo === 'visitante_nao_saiu'" class="badge bg-purple text-purple-fg">Visitante</span>
                  <span v-else class="badge bg-secondary text-secondary-fg">Outro</span>
                </td>
                <td>{{ a.mensagem }}</td>
                <td class="text-muted">{{ a.obra?.codigo ?? a.obra_id }}</td>
                <td class="text-muted">{{ fmt(a.created_at) }}</td>
                <td>
                  <span v-if="a.estado === 'aberto'" class="badge bg-red text-red-fg">Aberto</span>
                  <span v-else class="badge bg-green text-green-fg">Resolvido</span>
                </td>
                <td class="text-end">
                  <button v-if="a.estado === 'aberto'" class="btn btn-sm btn-outline-success" :disabled="busy" @click="resolver(a.id)">
                    Resolver
                  </button>
                </td>
              </tr>
              <tr v-if="!alertas.length">
                <td colspan="6" class="text-center text-muted py-4">Sem alertas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import notify from '@common/application/utils/notification'
import { API } from '@common/domain/services/api'
import { useCrud } from '@common/presentation/hooks/useCrud'
import type { CrudService } from '@common/hooks/types'

const AlertasApi: CrudService<any> = {
  index: async (filters) => API.get('/api/v1/alertas', { params: filters }),
  show: async (id, filters) => API.get(`/api/v1/alertas/${id}`, { params: filters }),
  store: async () => { throw new Error('Alertas são criados pelo sistema.') },
  update: async () => { throw new Error('Use o botão Resolver.') },
  destroy: async () => { throw new Error('Alertas não são elimináveis.') },
}

const fmt = (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')

const busy = ref(false)
const filtroEstado = ref<'aberto' | 'resolvido' | ''>('aberto')

const crudService = useCrud({
  service: AlertasApi,
  searchable: ['mensagem'],
  relations: ['obra'],
})
crudService.filters.orderBy = 'created_at'
crudService.filters.sortMethod = 'DESC'
crudService.filters.filters = [{ field: 'estado', operator: '=', value: 'aberto' }]

const alertas = computed(() => crudService.items.value as any[])

function mudarFiltro(estado: 'aberto' | 'resolvido' | '') {
  filtroEstado.value = estado
  crudService.filters.filters = estado ? [{ field: 'estado', operator: '=', value: estado }] : []
  crudService.fetchItems()
}

async function resolver(id: number) {
  busy.value = true
  try {
    await API.post(`/api/v1/alertas/${id}/resolver`, {})
    notify.success('Alerta resolvido.')
    crudService.fetchItems()
  } finally {
    busy.value = false
  }
}
</script>
