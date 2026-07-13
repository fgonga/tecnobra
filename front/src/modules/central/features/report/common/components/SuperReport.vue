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
  <div class="px-4" ref="reportEl">
    <div class="row g-2 align-items-center mb-2">
      <div class="col">
        <div class="page-pretitle">Relatórios</div>
        <h2 class="page-title">{{ config.title }}</h2>
        <p v-if="config.subtitle" class="text-muted">{{ config.subtitle }}</p>
      </div>

      <div class="col-auto ms-auto d-print-none">
        <b-button  variant="primary" class="me-2" @click="fetchReport">
          <IconFilterFilled size="15" class="me-2"/> Filtrar
        </b-button>
        <template v-if="config.showExportButtons !== false">
          <b-button variant="default" @click="exportData('pdf')" :disabled="exporting">
            <IconFileTypePdf size="15" class="me-2"/>
            {{ exporting ? 'A exportar...' : 'Exportar PDF' }}
          </b-button>
        </template>
      </div>
    </div>

    <div class="card">
      <div class="card-body">

        <div v-if="config.filterSchema?.fields?.length" class="mb-3">
          <form @submit.prevent="fetchReport">
            <div class="row ">
              <template v-for="(field, index) in config.filterSchema.fields" :key="index">
                <component
                  :is="field.entityComponent || FormField"
                  v-model="crudService.filters.filters[field.field]"
                  :label="field.label"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  :column-class="field.columnClass || 'col-md-4'"
                  v-bind="field.props || {}"
                />
              </template>


            </div>

          </form>
        </div>

        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Carregando...</span>
          </div>
        </div>

        <div v-else-if="error" class="alert alert-danger" role="alert">
          {{ error }}
          <button class="btn btn-sm btn-outline-danger ms-2" @click="fetchReport">
            Tentar novamente
          </button>
        </div>

        <div v-else class="row whiteDiv">
          <div class="col-sm-12">
            <div class="table-responsive">
              <table class="table table-striped table-bordered">
                <thead>
                <tr>
                  <th v-for="column in config.columns" :key="column.key" :nowrap="column.nowrap"
                      :class="getColumnClass(column)">
                    {{ column.label }}
                  </th>
                </tr>
                </thead>

                <tbody>
                <tr v-for="(item, index) in reportResult?.items || []" :key="index">
                  <td v-for="column in config.columns" :key="column.key" :nowrap="column.nowrap"
                      :class="getColumnClass(column)">
                    <!-- <a v-if="column.type === 'link'" :href="buildLinkPath(column, item)">
                        {{ getCellValue(item, column) }}
                    </a> -->
                    <span v-if="column.type === 'link'">
                                                {{ getCellValue(item, column) }}
                                            </span>

                    <span v-else-if="column.type === 'currency'">
                                                {{ toMoney(getCellValue(item, column)) }}
                                            </span>

                    <span v-else-if="column.type === 'number'">
                                                {{ formatNumber(getCellValue(item, column)) }}
                                            </span>

                    <span v-else>
                                                {{ getCellValue(item, column) }}
                                            </span>
                  </td>
                </tr>
                </tbody>

                <tfoot v-if="reportResult">
                <tr>
                  <td v-for="column in config.columns" :key="column.key"
                      :class="getColumnClass(column)">
                    <b v-if="column.totalLabel">{{ column.totalLabel }}</b>

                    <b v-else-if="column.showInTotal && getTotalValue(column) !== null">
                                                <span v-if="column.type === 'currency'">
                                                    {{ toMoney(getTotalValue(column)!) }}
                                                </span>
                      <span v-else-if="column.type === 'number'">
                                                    {{ formatNumber(getTotalValue(column)!) }}
                                                </span>
                      <span v-else>
                                                    {{ getTotalValue(column) }}
                                                </span>
                    </b>

                    <b v-else></b>
                  </td>
                </tr>
                </tfoot>
              </table>
            </div>

            <div v-if="config.footerNotes?.length" class="mt-3">
                            <span class="text-muted">
                                <div v-for="(note, index) in config.footerNotes" :key="index">
                                    <sup>({{ index + 1 }})</sup> {{ note }} <br>
                                </div>
                            </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ReportAPIService } from '../../domain/service/ReportService'
import {IconFilterFilled,IconFileTypePdf, IconFileTypeXls} from "@tabler/icons-vue"
import { exportToPdf } from '@common/application/utils/export'
import type {
  IReportConfig,
  IReportColumn
} from '../types/ReportConfig'
import type { ISalesReportItem, ISalesReportRequest, ISalesReportResult } from '@/modules/billing/common/application/dtos';
import TableFilter from '@common/presentation/components/TableFilter.vue';

interface Props {
  config: IReportConfig,
}

const props = defineProps<Props>()

const loading = ref(false)
const error = ref<string | null>(null)
const reportResult = ref<ISalesReportResult | null>(null)
const showFilters = ref(true)
const reportEl = ref<HTMLElement | null>(null)
const exporting = ref(false)


const crudService = reactive({
  filters: {
    filters: props.config.defaultFilters || [],
  },
  fetchItems: () => {
    fetchReport();
  },
});

const requestPayload = computed<ISalesReportRequest>(() => {

  const payload: ISalesReportRequest = {
    groupBy: props.config.groupBy,
    // @ts-expect-error filters
    filters: crudService.filters.filters
  }
  return payload
})

const fetchReport = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await ReportAPIService.index(requestPayload.value)
    reportResult.value = response.data?.data || null
  } catch (err) {
    error.value = 'Erro ao carregar relatório'
    console.error('Report fetch error:', err)
  } finally {
    loading.value = false
  }
}

const filters = reactive({
  search: '',
})

const getColumnClass = (column: IReportColumn) => {
  const classes = []
  if (column.align) {
    classes.push(`text-${column.align}`)
  }
  return classes.join(' ')
}

const getCellValue = (item: ISalesReportItem, column: IReportColumn) => {

  if (column.key === 'group_name') {
    return column.formatterLabel ? column.formatterLabel(item.group_name) : item.group_name
  }
  const value = item[column.key as keyof ISalesReportItem] ?? '';
  return column.formatterLabel ? column.formatterLabel(value) : value
}

const getTotalValue = (column: IReportColumn) => {

  if (!reportResult.value) return null
  switch (column.key) {
    case 'quantity':
      return reportResult.value.total_quantity
    case 'net_sales':
      return reportResult.value.total_net_sales
    case 'gross_sales':
      return reportResult.value.total_gross_sales
    case 'count':
      return reportResult.value.sales_count
    default:
      return null
  }
}

const buildLinkPath = (column: IReportColumn, item: ISalesReportItem) => {
  if (!column.linkPath) return '#'
  return column.linkPath.replace(':group_key', item.group_key)
}

const toMoney = (value: string | number) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (numericValue === null || isNaN(numericValue)) return '0,00 Kz'

  return new Intl.NumberFormat('pt-AO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue) + ' Kz'
}

const formatNumber = (value: string | number) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (numericValue === null || isNaN(numericValue)) return '0'
  return new Intl.NumberFormat('pt-AO').format(numericValue)
}

const exportData = async (format: 'pdf' | 'excel') => {
  if (format === 'pdf') {
    if (!reportEl.value || exporting.value) return
    exporting.value = true
    const fileName = props.config.title
      ? props.config.title.toLowerCase().replace(/\s+/g, '-')
      : 'relatorio'
    try {
      await exportToPdf(reportEl.value, fileName, 'landscape')
    } finally {
      exporting.value = false
    }
  }
}

const printReport = () => {
  window.print()
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.searchDiv {
  margin-bottom: 1rem;
}

.whiteDiv {
  background-color: white;
}

@media print {
  .d-print-none {
    display: none !important;
  }
}
</style>
