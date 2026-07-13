<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
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
          <!-- === FILTRO === -->
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
                <InfluencerEntity v-model="form.influencer" />
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
                    <th rowspan="2">Influenciador</th>
                    <th rowspan="2" class="text-right">Nº Vendas</th>
                    <th rowspan="2" class="text-right">Valor Bruto</th>

                    <!-- GRUPO DESCONTOS -->
                    <th colspan="3" class="text-center">Descontos</th>

                    <th rowspan="2" class="text-right">Receita</th>

                    <!-- GRUPO INFLUENCIADOR -->
                    <th colspan="2" class="text-center">Influenciador</th>

                    <th rowspan="2" class="text-right">Líquido Final</th>

                    <!-- DEVOLUÇÕES -->
                    <th rowspan="2" class="text-right">Dev.</th>
                    <th rowspan="2" class="text-right">Valor Dev.</th>
                  </tr>

                  <tr>
                    <!-- Subcolunas Descontos -->
                    <th class="text-right">Promoção</th>
                    <th class="text-right">Cupom</th>
                    <th class="text-right">Total</th>

                    <!-- Subcolunas Influenciador -->
                    <th class="text-right">%</th>
                    <th class="text-right">Valor</th>
                  </tr>
                  </thead>

                  <tbody>
                  <tr v-for="report in reportResult?.report ?? []" :key="report.day">
                    <td>{{ report.influencer_name }}</td>
                    <td class="text-right">{{ toMoney(report.sales) }}</td>
                    <td class="text-right">{{ toMoney(report.gross) }}</td>

                    <!-- Descontos -->
                    <td class="text-right">{{ toMoney(report.discount_promotion) }}</td>
                    <td class="text-right">{{ toMoney(report.discount_coupon) }}</td>
                    <td class="text-right">{{ toMoney(report.discounts) }}</td>

                    <!-- Resultados -->
                    <td class="text-right">{{ toMoney(report.revenue) }}</td>

                    <!-- Influencer -->
                    <td class="text-right">{{ toMoney(report.influencerCommission) }}</td>
                    <td class="text-right">{{ toMoney(report.influencerCommissionReceiver) }}</td>

                    <!-- Líquido final -->
                    <td class="text-right">{{ toMoney(report.result_final) }}</td>

                    <!-- Devoluções -->
                    <td class="text-right">{{ report.refunds_count ?? 0 }}</td>
                    <td class="text-right">{{ toMoney(report.refunds_amount ?? 0) }}</td>
                  </tr>
                  </tbody>

                  <tfoot>
                  <tr>
                    <td><b>TOTAL</b></td>

                    <td class="text-right"><b>{{ toMoney(reportResult?.total.sales ?? 0) }}</b></td>
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.gross ?? 0) }}</b></td>

                    <!-- Descontos -->
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.discount_promotion ?? 0) }}</b></td>
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.discount_coupon ?? 0) }}</b></td>
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.discounts ?? 0) }}</b></td>

                    <!-- Resultados -->
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.revenue ?? 0) }}</b></td>

                    <!-- Influencer -->
                    <td class="text-right"><b>-</b></td>
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.influencerCommissionReceiver ?? 0) }}</b></td>

                    <!-- Líquido final -->
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.result_final ?? 0) }}</b></td>

                    <!-- Devoluções -->
                    <td class="text-right"><b>{{ reportResult?.total.refunds_count ?? 0 }}</b></td>
                    <td class="text-right"><b>{{ toMoney(reportResult?.total.refunds_amount ?? 0) }}</b></td>
                  </tr>
                  </tfoot>
                </table>


              </div>
            </div>

            <!-- === GRÁFICOS === -->
            <div class="col-12">
              <div class="row">
                <div class="col-md-6 mb-4">
                  <div class="card p-3">
                    <h5 class="mb-3">Resultado Líquido por Influenciador</h5>
                    <Bar :data="barChartData" :options="chartOptions" />
                  </div>
                </div>
                <div class="col-md-6 mb-4">
                  <div class="card p-3">
                    <h5 class="mb-3"> Comissão por Influenciador</h5>
                    <Bar :data="barChartData2" :options="chartOptions" />
                  </div>
                </div>
                <div class="col-md-6 mb-4">
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
import InfluencerEntity from "@components/entity/InfluencerEntity.vue";
import { IconFilterFilled, IconFileTypePdf, IconFileTypeXls } from "@tabler/icons-vue";
import { required } from "@common/application/utils/validators";
import { ref, reactive, computed } from "vue";
import { exportToExcel, exportToPdf } from "@/common/application/utils/export";
import PeriodPicker from '../../../common/components/PeriodPicker.vue'
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

const config = { title: "Vendas por influenciadores" };
const loading = ref(false);
const error = ref<string | null>(null);
const reportResult = ref<any | null>(null);

const defaultFilters = reactive({
  start: "",
  end: "",
  type: "influencer",
  influencer: null,
});

const fetchReport = async (data: any) => {
  loading.value = true;
  error.value = null;
  try {
    const response = await ReportAPIService.report({
      start: data.start,
      end:data.end,
      influencer: data.influencer?.id,
      type: "influencer",
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

const COLORS = ["#4429f2", "#28a745", "#ffc107", "#17a2b8", "#6f42c1", "#ff6384", "#36a2eb"];

const barChartData = computed(() => ({
  labels: (reportResult.value?.report ?? []).map((r: any) => r.influencer_name),
  datasets: [
    {
      label: "Resultado Líquido (Kz)",
      backgroundColor: "#4429f2",
      data: (reportResult.value?.report ?? []).map((r: any) => r.result_final || 0),
    },
  ],
}));
const barChartData2 = computed(() => ({
  labels: (reportResult.value?.report ?? []).map((r: any) => r.influencer_name),
  datasets: [
    {
      label: "Comissão",
      backgroundColor: "#4429f2",
      data: (reportResult.value?.report ?? []).map((r: any) => r.influencerCommissionReceiver || 0),
    },
  ],
}));
const pieChartData = computed(() => ({
  labels: (reportResult.value?.report ?? []).map((r: any) => r.influencer_name),
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
    'Influenciador': r.influencer_name, 'Nº Vendas': r.sales,
    'Bruto (Kz)': Number(r.gross), 'Desc. Promoção (Kz)': Number(r.discount_promotion),
    'Desc. Cupom (Kz)': Number(r.discount_coupon), 'Descontos Total (Kz)': Number(r.discounts),
    'Receita (Kz)': Number(r.revenue), 'Comissão %': Number(r.influencerCommission),
    'Comissão (Kz)': Number(r.influencerCommissionReceiver), 'Líquido Final (Kz)': Number(r.result_final),
    'Devoluções': r.refunds_count ?? 0, 'Valor Devolvido (Kz)': Number(r.refunds_amount ?? 0),
  }));
  exportToExcel(rows, 'relatorio-influenciadores', 'Influenciadores');
}

async function exportPdf() {
  const el = document.querySelector('.page-body') as HTMLElement;
  if (!el) return;
  await exportToPdf(el, 'relatorio-influenciadores');
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
</style>
