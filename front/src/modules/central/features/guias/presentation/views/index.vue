<!--
 -  Tecnobra — Guias de remessa (receção de materiais).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <div class="page-pretitle">Recursos</div>
          <h2 class="page-title">Guias de remessa</h2>
        </div>
        <button class="btn btn-primary" @click="modalNova?.abrir()">
          Registar guia
        </button>
      </div>

      <div class="card">
        <div v-if="crudService.isLoading.value" class="text-center py-5"><div class="spinner-border text-primary" /></div>
        <div v-else class="table-responsive">
          <table class="table table-vcenter card-table">
            <thead>
              <tr>
                <th>N.º</th><th>Obra</th><th>Fornecedor</th><th>Itens</th><th>Entrega</th><th>Documento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in guias" :key="g.id">
                <td><strong>{{ g.numero }}</strong></td>
                <td>{{ g.obra?.codigo ?? g.obra_id }}</td>
                <td>{{ g.fornecedor?.nome ?? g.fornecedor_nome ?? '—' }}</td>
                <td>
                  <span v-for="(i, idx) in g.itens ?? []" :key="idx" class="badge bg-secondary-lt me-1">
                    {{ i.material_nome }}: {{ Number(i.quantidade) }} {{ i.unidade }}
                  </span>
                </td>
                <td class="text-muted">{{ fmt(g.data_entrega) }}</td>
                <td>
                  <a v-if="g.documento" :href="`${apiBase}${g.documento}`" target="_blank" rel="noopener">Ver</a>
                  <span v-else class="text-muted">—</span>
                </td>
              </tr>
              <tr v-if="!guias.length">
                <td colspan="6" class="text-center text-muted py-4">Sem guias registadas.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer d-flex align-items-center" v-if="crudService.filters.total > crudService.filters.perPage">
          <button class="btn btn-sm btn-outline-secondary" :disabled="crudService.filters.page <= 1" @click="crudService.setPage(crudService.filters.page - 1)">Anterior</button>
          <span class="mx-2 text-muted">Página {{ crudService.filters.page }}</span>
          <button class="btn btn-sm btn-outline-secondary" @click="crudService.setPage(crudService.filters.page + 1)">Seguinte</button>
        </div>
      </div>

      <GuiaCreateModal ref="modalNova" @created="crudService.fetchItems()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { GuiasService } from '../../domain/service/GuiasService'
import { useCrud } from '@common/presentation/hooks/useCrud'
import GuiaCreateModal from './create.vue'

const apiBase = import.meta.env.VITE_API_URL
const fmt = (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')

const modalNova = ref<any>(null)

const crudService = useCrud({
  service: GuiasService,
  searchable: ['numero', 'fornecedor_nome'],
  relations: ['itens', 'obra', 'fornecedor'],
})
crudService.filters.orderBy = 'data_entrega'
crudService.filters.sortMethod = 'DESC'

const guias = computed(() => crudService.items.value as any[])
</script>
