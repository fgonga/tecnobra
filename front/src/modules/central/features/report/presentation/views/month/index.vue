<!--
  Copyright © 2021 - 2050
  Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="d-flex justify-content-end align-items-center gap-2 flex-wrap mb-2 d-print-none">
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

      <div class="card">
        <div class="card-body">
          <!-- === FILTRO === -->
          <form @submit.prevent="handleSubmit">
            <div class="row">
              <FormField
                label="Ano"
                v-model="form.year"
                required
                type="number"
                :validationError="v$.year.$error ? v$.year.$errors[0].$message.toString() : ''"
                :serverError="form.errors?.get('year')"
                columnClass="col-md-4"
              />
              <div class="col-md-8">
                <CourseEntity v-model="form.course" />
              </div>
            </div>
          </form>
          <hr class="mt-0 mb-3" />

          <!-- === ESTADOS === -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
          </div>
          <div v-else-if="error" class="alert alert-danger" role="alert">
            {{ error }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="handleSubmit">Tentar novamente</button>
          </div>

          <!-- === RESULTADO === -->
          <div v-else class="row whiteDiv">
            <!-- === TABELA === -->
            <div class="col-sm-12 mb-4">
              <div class="table-responsive">
                <table class="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th class="text-right">Nº Vendas</th>
                      <th class="text-right">Valor Bruto</th>
                      <th class="text-right">Descontos</th>
                      <th class="text-right">Devoluções</th>
                      <th class="text-right">Outras Reduções</th>
                      <th class="text-right">Resultado Ilíquido</th>
                      <th class="text-right">Encargos</th>
                      <th class="text-right">Líquido</th>
                      <th class="text-right">Comissões</th>
                      <th class="text-right">Líquido Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="report in reportResult?.report ?? []" :key="report.month">
                      <td>{{ report.month }}</td>
                      <td class="text-right">{{ report.sales ?? 0 }}</td>
                      <td class="text-right">{{ toMoney(report.gross) }}</td>
                      <td class="text-right">{{ toMoney(report.discounts) }}</td>
                      <td class="text-right">{{ report.refunds_count ?? 0 }}</td>
                      <td class="text-right">{{ toMoney(report.refunds_amount ?? 0) }}</td>
                      <td class="text-right">{{ toMoney(report.result_iliquido) }}</td>
                      <td class="text-right">{{ toMoney(report.fees) }}</td>
                      <td class="text-right">{{ toMoney(report.result) }}</td>
                      <td class="text-right">{{ toMoney(report.commissions) }}</td>
                      <td class="text-right"><b>{{ toMoney(report.result_final) }}</b></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><b>TOTAL</b></td>
                      <td class="text-right"><b>{{ reportResult?.total.sales ?? 0 }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.gross ?? 0) }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.discounts ?? 0) }}</b></td>
                      <td class="text-right"><b>{{ reportResult?.total.refunds_count ?? 0 }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.refunds_amount ?? 0) }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.result_iliquido ?? 0) }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.fees ?? 0) }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.result ?? 0) }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.commissions ?? 0) }}</b></td>
                      <td class="text-right"><b>{{ toMoney(reportResult?.total.result_final ?? 0) }}</b></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- === GRÁFICOS === -->
            <div class="col-12">
              <div class="row">
                <div class="col-md-7 mb-4">
                  <div class="card p-3">
                    <h5 class="mb-3">Resultado Líquido por Mês</h5>
                    <Bar :data="barChartData" :options="chartOptions" />
                  </div>
                </div>
                <div class="col-md-5 mb-4">
                  <div class="card p-3">
                    <h5 class="mb-3">Distribuição das Vendas</h5>
                    <Pie :data="pieChartData" :options="chartOptions" />
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
import { ReportAPIService } from "../../../domain/service/ReportService";
import { useModalForm } from "@common/presentation/hooks/useModalForm";
import toMoney from "@/common/application/utils/money";
import { Bar, Pie } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const config = { title: "Vendas Mensais" };
const loading = ref(false);
const error = ref<string | null>(null);
const reportResult = ref<any | null>(null);

const defaultFilters = reactive({
  year: "",
  course: null,
  type: "month",
});

const fetchReport = async (data: any) => {
  loading.value = true;
  error.value = null;
  try {
    const response = await ReportAPIService.report({
      year: data.year,
      course: data.course?.id,
      type: "month",
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
  rules: () => ({ year: { required } }),
});

const COLORS = ["#4429f2", "#28a745", "#ffc107", "#17a2b8", "#6f42c1", "#ff6384", "#36a2eb"];

const barChartData = computed(() => ({
  labels: (reportResult.value?.report ?? []).map((r: any) => r.month),
  datasets: [
    {
      label: "Resultado Líquido (Kz)",
      backgroundColor: "#4429f2",
      data: (reportResult.value?.report ?? []).map((r: any) => r.result || 0),
    },
  ],
}));

const pieChartData = computed(() => ({
  labels: (reportResult.value?.report ?? []).map((r: any) => r.month),
  datasets: [
    {
      label: "Vendas",
      backgroundColor: COLORS,
      data: (reportResult.value?.report ?? []).map((r: any) => r.sales || 0),
    },
  ],
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: "bottom" },
    tooltip: { mode: "index", intersect: false },
  },
};

function exportExcel() {
  if (!reportResult.value?.report?.length) return;
  const rows = reportResult.value.report.map((r: any) => ({
    'Mês': r.month,
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
  exportToExcel(rows, 'relatorio-mensal', 'Vendas Mensais');
}

async function exportPdf() {
  const el = document.querySelector('.page-body') as HTMLElement;
  if (!el) return;
  await exportToPdf(el, 'relatorio-mensal');
}
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}
.card h5 {
  font-size: 15px;
  font-weight: 600;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
