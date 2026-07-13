<!--
  -  Tecnobra — EntitySelectModal (portado do bantuhub, versão genérica):
  -  tabela pesquisável e paginada via useCrud, seleção single/multi por clique
  -  na linha e confirmação. Usado pelo EntitySelect (botão de pesquisa).
  -->
<template>
  <BModal ref="modal" :title="title" size="lg" centered @show="onShow">
    <BInputGroup class="mb-2">
      <BFormInput v-model="filters.search" placeholder="Pesquisar..." @keyup.enter="fetchItems()" />
      <BButton variant="secondary" @click="fetchItems()">
        <Icon icon="tabler:search" /> &nbsp; Pesquisar
      </BButton>
    </BInputGroup>

    <BTable
      :fields="fields"
      :items="items"
      :busy="busy.index"
      responsive
      small
      hover
      show-empty
      class="align-middle"
      @row-clicked="toggleRow"
    >
      <template #table-busy>
        <div class="text-center text-primary my-2">
          <BSpinner small class="align-middle mx-2" /> A carregar...
        </div>
      </template>
      <template #empty>
        <div class="text-center my-2 text-muted">Nenhum registo encontrado</div>
      </template>

      <template #head(__sel)><span class="text-muted">#</span></template>

      <template #cell(__sel)="row">
        <Icon
          :icon="isSelected(row.item) ? 'tabler:circle-check-filled' : 'tabler:circle'"
          :class="isSelected(row.item) ? 'text-primary' : 'text-muted'"
          width="20"
          height="20"
        />
      </template>
    </BTable>

    <div class="d-flex justify-content-between align-items-center mt-2">
      <BFormSelect v-model="filters.perPage" class="w-auto" :options="perPageOptions" size="sm" />
      <BPagination
        v-if="filters.total > filters.perPage"
        v-model="filters.page"
        :total-rows="filters.total"
        :per-page="filters.perPage"
        class="mb-0"
      />
    </div>

    <template #footer>
      <div class="d-flex align-items-center justify-content-between w-100">
        <span v-if="selected.length" class="badge bg-primary-lt text-primary">
          {{ selected.length }} selecionado(s)
        </span>
        <span v-else />
        <div class="d-flex gap-2">
          <BButton variant="light" @click="hide">Cancelar</BButton>
          <BButton variant="primary" :disabled="!selected.length" @click="confirm">
            <Icon icon="tabler:check" class="me-1" /> Selecionar
          </BButton>
        </div>
      </div>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { BModal, BButton, BInputGroup, BFormInput, BTable, BPagination, BSpinner, BFormSelect } from 'bootstrap-vue-next'
import { Icon } from '@iconify/vue'
import { useCrud } from '@common/presentation/hooks/useCrud'

interface Column {
  key: string
  label: string
}

const props = withDefaults(
  defineProps<{
    service: any
    title?: string
    labelField?: string
    valueField?: string
    searchFields?: string[]
    multiple?: boolean
    columns?: Column[]
    with?: string[]
  }>(),
  {
    title: 'Selecionar',
    labelField: 'nome',
    valueField: 'id',
    searchFields: () => ['nome'],
    multiple: false,
    columns: () => [],
    with: () => [],
  },
)

const emit = defineEmits(['confirm', 'cancel'])

const modal = ref()
const selected = ref<any[]>([])
const perPageOptions = [8, 20, 30, 40, 50, 100].map((n) => ({ value: n, text: `Mostrar ${n}` }))

const { items, filters, busy, fetchItems } = useCrud({
  service: props.service,
  autoInit: false,
  searchable: props.searchFields,
  relations: props.with,
})

const fields = computed(() => {
  const cols =
    props.columns.length > 0 ? props.columns : [{ key: props.labelField, label: 'Nome' }]
  return [{ key: '__sel', label: '' }, ...cols.map((c) => ({ ...c, sortable: false }))]
})

function isSelected(item: any) {
  return selected.value.some((s) => s[props.valueField] === item[props.valueField])
}

function toggleRow(item: any) {
  if (isSelected(item)) {
    selected.value = selected.value.filter((s) => s[props.valueField] !== item[props.valueField])
    return
  }
  selected.value = props.multiple ? [...selected.value, item] : [item]
}

function onShow() {
  selected.value = []
  fetchItems()
}

function confirm() {
  emit('confirm', props.multiple ? selected.value : selected.value[0])
  hide()
}

function show() {
  modal.value?.show()
}
function hide() {
  modal.value?.hide()
}

defineExpose({ show, hide })
</script>

<style scoped>
:deep(table tbody tr) {
  cursor: pointer;
}
</style>
