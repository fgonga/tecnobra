<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
-->

<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2 d-print-none">
        <PeriodPicker @update:model-value="v => onPeriodApply(v.start, v.end)" />
        <div class="d-flex gap-2 flex-wrap">
          <b-button variant="primary" @click="handleSubmit">
            <IconFilterFilled size="15" class="me-2" /> Filtrar
          </b-button>
          <b-button variant="default" @click="handleSubmit" :disabled="loading" title="Atualizar">
            <IconRefresh size="15" :class="loading ? 'spin' : ''" />
          </b-button>
          <b-button variant="default" @click="exportExcel">
            <IconFileTypeXls size="15" class="me-2" /> Excel
          </b-button>
          <b-button variant="default" @click="exportPdf">
            <IconFileTypePdf size="15" class="me-2" /> PDF
          </b-button>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <form @submit.prevent="handleSubmit">
            <div class="row">
              <FormField
                label="Início"
                v-model="form.start"
                required
                type="date"
                :validationError="v$.start.$error ? v$.start.$errors[0].$message.toString() : ''"
                :serverError="form.errors?.get('start')"
                columnClass="col-md-2"
              />
              <FormField
                label="Fim"
                v-model="form.end"
                required
                type="date"
                :validationError="v$.end.$error ? v$.end.$errors[0].$message.toString() : ''"
                :serverError="form.errors?.get('end')"
                columnClass="col-md-2"
              />
              <div class="col-md-8">
                <CourseEntity v-model="form.course" />
              </div>
            </div>
          </form>

          <hr class="mt-0 mb-3" />

          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>

          <div v-else-if="error" class="alert alert-danger" role="alert">
            {{ error }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="handleSubmit">
              Tentar novamente
            </button>
          </div>

          <div v-else class="row whiteDiv">
            <!-- === TABELA === -->
            <div class="col-sm-12">
              <div class="table-responsive">
                <table class="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th class="text-end">Nº Vendas</th>
                      <th class="text-end">Valor Bruto</th>
                      <th class="text-end">Descontos</th>
                      <th class="text-end">Devoluções</th>
                      <th class="text-end">Outras Reduções</th>
                      <th class="text-end">Resultado Ilíquido</th>
                      <th class="text-end">Encargos</th>
                      <th class="text-end">Líquido</th>
                      <th class="text-end">Comissões</th>
                      <th class="text-end">Líquido Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="report in reportResult?.report ?? []" :key="report.course_id">
                      <td>{{ report.course_name }}</td>
                      <td class="text-end">{{ report.sales ?? 0 }}</td>
                      <td class="text-end">{{ toMoney(report.gross) }}</td>
                      <td class="text-end">{{ toMoney(report.discounts) }}</td>
                      <td class="text-end">{{ report.refunds_count ?? 0 }}</td>
                      <td class="text-end">{{ toMoney(report.refunds_amount ?? 0) }}</td>
                      <td class="text-end">{{ toMoney(report.result_iliquido) }}</td>
                      <td class="text-end">{{ toMoney(report.fees) }}</td>
                      <td class="text-end">{{ toMoney(report.result) }}</td>
                      <td class="text-end">{{ toMoney(report.commissions) }}</td>
                      <td class="text-end"><b>{{ toMoney(report.result_final) }}</b></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><b>TOTAL</b></td>
                      <td class="text-end"><b>{{ reportResult?.total.sales ?? 0 }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.gross ?? 0) }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.discounts ?? 0) }}</b></td>
                      <td class="text-end"><b>{{ reportResult?.total.refunds_count ?? 0 }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.refunds_amount ?? 0) }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.result_iliquido ?? 0) }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.fees ?? 0) }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.result ?? 0) }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.commissions ?? 0) }}</b></td>
                      <td class="text-end"><b>{{ toMoney(reportResult?.total.result_final ?? 0) }}</b></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- === GRÁFICOS (Chart.js via vue-chartjs) === -->
            <div class="col-12 mt-5">
              <div class="row">
                <div class="col-md-7">
                  <div class="card p-3">
                    <h5 class="mb-2">Resultado Líquido por Curso</h5>
                    <Bar :data="barData" :options="chartOptions" style="height:300px;" />
                  </div>
                </div>

                <div class="col-md-5">
                  <div class="card p-3">
                    <h5 class="mb-2">Distribuição das Vendas</h5>
                    <Pie :data="pieData" :options="chartOptions" style="height:300px;" />
                  </div>
                </div>
              </div>
            </div>
            <!-- === /GRÁFICOS === -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormField from "@components/FormField.vue";
import CourseEntity from "@components/CourseEntity.vue";
import { IconFilterFilled, IconFileTypePdf, IconFileTypeXls, IconRefresh } from "@tabler/icons-vue";
import { required } from "@common/application/utils/validators";
import { ref, reactive, computed } from "vue";
import { exportToExcel, exportToPdf } from "@/common/application/utils/export";
import PeriodPicker from '../../../common/components/PeriodPicker.vue'
import { ReportAPIService } from "../../../domain/service/ReportService";
import { useModalForm } from "@common/presentation/hooks/useModalForm";
import toMoney from "@/common/application/utils/money";

// Chart.js + Vue wrapper
import { Bar, Pie } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

const config = { title: "Vendas por Curso" };
const loading = ref(false);
const error = ref<string | null>(null);
const reportResult = ref<any | null>(null);

let defaultFilters = reactive({
  start: "",
  end: "",
  course: null,
  type: "course",
});

const fetchReport = async (data: any) => {
  loading.value = true;
  error.value = null;
  try {
    const response = await ReportAPIService.report({
      start: data.start,
      end: data.end,
      course: data.course?.id,
      type: "course",
    });
    reportResult.value = response.data || null;
  } catch (err) {
    console.error("Report fetch error:", err);
    error.value = "Erro ao carregar relatório";
  } finally {
    loading.value = false;
  }
};

const { form, v$, handleSubmit } = useModalForm({
  defaultValues: defaultFilters,
  handler: fetchReport,
  rules: () => ({
    start: { required },
    end: { required },
  }),
});

function onPeriodApply(start: string, end: string) {
  form.start = start
  form.end = end
  handleSubmit()
}

// === Dados dos gráficos ===
const chartBase = computed(() =>
  (reportResult.value?.report || []).map((r: any) => ({
    name: r.course_name,
    sales: Number(r.sales || 0),
    result: Number(r.result || 0),
  }))
);

const barData = computed(() => ({
  labels: chartBase.value.map((r) => r.name),
  datasets: [
    {
      label: "Resultado Líquido (Kz)",
      backgroundColor: "#4429f2",
      data: chartBase.value.map((r) => r.result),
    },
  ],
}));

const pieData = computed(() => ({
  labels: chartBase.value.map((r) => r.name),
  datasets: [
    {
      backgroundColor: ["#4429f2", "#28a745", "#ffc107", "#17a2b8", "#6f42c1"],
      data: chartBase.value.map((r) => r.sales),
    },
  ],
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: "bottom" },
  },
};

function exportExcel() {
  if (!reportResult.value?.report?.length) return;
  const rows = reportResult.value.report.map((r: any) => ({
    'Curso': r.course_name || '-',
    'Nº Vendas': r.sales,
    'Valor Bruto': Number(r.gross),
    'Descontos': Number(r.discounts),
    'Devoluções': r.refunds_count ?? 0,
    'Outras Reduções': Number(r.refunds_amount ?? 0),
    'Resultado Ilíquido': Number(r.result_iliquido),
    'Encargos': Number(r.fees),
    'Líquido': Number(r.result),
    'Comissões': Number(r.commissions),
    'Líquido Final': Number(r.result_final),
  }));
  exportToExcel(rows, 'relatorio-cursos', 'Vendas por Curso');
}

async function exportPdf() {
  const el = document.querySelector('.page-body') as HTMLElement;
  if (!el) return;
  await exportToPdf(el, 'relatorio-cursos');
}
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.card h5 {
  font-size: 15px;
  font-weight: 600;
}
</style>
