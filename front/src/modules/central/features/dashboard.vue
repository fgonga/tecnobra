<!--
 -  Tecnobra — Painel executivo ao vivo.
 -  KPIs (presentes, entradas, equipamentos, alertas) + gráficos, com
 -  atualização em tempo real via Socket.IO (sala obra:<id>).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <!-- Cabeçalho + seletor de obra -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <div class="page-pretitle">Painel</div>
          <h2 class="page-title">Visão geral</h2>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span v-if="aoVivo" class="badge bg-green-lt">
            <span class="status-dot status-dot-animated bg-green me-1"></span> Ao vivo
          </span>
          <select v-model.number="obraId" class="form-select" style="max-width: 260px">
            <option :value="0">Todas as obras</option>
            <option v-for="o in obras" :key="o.id" :value="o.id">{{ o.codigo }} — {{ o.nome }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="text-center py-6">
        <div class="spinner-border text-primary" />
      </div>

      <template v-else-if="dados">
        <!-- KPIs -->
        <div class="row row-deck row-cards mb-3">
          <div class="col-6 col-md-3" v-for="kpi in kpiCards" :key="kpi.label">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="subheader">{{ kpi.label }}</div>
                  <span class="text-muted"><component :is="kpi.icon" :size="20" /></span>
                </div>
                <div class="h1 mb-0 mt-2" :class="kpi.classe">{{ kpi.valor }}</div>
                <div v-if="kpi.detalhe" class="text-muted small">{{ kpi.detalhe }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row row-deck row-cards">
          <!-- Movimentos de hoje por hora -->
          <div class="col-md-7">
            <div class="card">
              <div class="card-header"><h3 class="card-title">Movimentos de hoje (por hora)</h3></div>
              <div class="card-body" style="height: 260px">
                <Bar :data="porHoraData" :options="chartOptions" />
              </div>
            </div>
          </div>
          <!-- Presenças últimos 14 dias -->
          <div class="col-md-5">
            <div class="card">
              <div class="card-header"><h3 class="card-title">Trabalhadores presentes (14 dias)</h3></div>
              <div class="card-body" style="height: 260px">
                <Line :data="porDiaData" :options="chartOptions" />
              </div>
            </div>
          </div>
        </div>

        <!-- Quem está no estaleiro (só com obra selecionada) -->
        <div v-if="obraId && dados.dentro?.length" class="card mt-3">
          <div class="card-header">
            <h3 class="card-title">No estaleiro agora ({{ dados.dentro.length }})</h3>
          </div>
          <div class="table-responsive">
            <table class="table table-vcenter card-table">
              <thead>
                <tr><th>Nome</th><th>Tipo</th><th>Detalhe</th><th>Empresa</th><th>Desde</th><th>Portão</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in dados.dentro" :key="`${p.tipo}-${p.id}`">
                  <td>{{ p.nome }}</td>
                  <td>
                    <span v-if="p.tipo === 'trabalhador'" class="badge bg-blue text-blue-fg">Trabalhador</span>
                    <span v-else-if="p.tipo === 'visitante'" class="badge bg-purple text-purple-fg">Visitante</span>
                    <span v-else class="badge bg-azure text-azure-fg">Veículo</span>
                  </td>
                  <td class="text-muted">{{ p.detalhe || '—' }}</td>
                  <td class="text-muted">{{ p.empresa || '—' }}</td>
                  <td class="text-muted">{{ hora(p.desde) }}</td>
                  <td class="text-muted">{{ p.portao || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  IconUsers,
  IconLogin2,
  IconUserCheck,
  IconTool,
  IconPackageOff,
  IconBellRinging,
  IconCar,
  IconLogout2,
} from '@tabler/icons-vue'
import dayjs from 'dayjs'
import { API } from '@common/domain/services/api'
import { socket } from '@common/application/socket'
import { ObrasService } from '@/modules/central/features/obras/domain/service/ObrasService'

ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

const loading = ref(true)
const dados = ref<any | null>(null)
const obras = ref<any[]>([])
const obraId = ref<number>(Number(localStorage.getItem('dashboard.obraId')) || 0)
const aoVivo = ref(false)

const hora = (v: string) => dayjs(v).format('HH:mm')

async function carregar() {
  try {
    const { data } = await API.get('/api/v1/report-dashboard', {
      params: obraId.value ? { obra_id: obraId.value } : {},
    })
    dados.value = data
  } finally {
    loading.value = false
  }
}

const kpiCards = computed(() => {
  const k = dados.value?.kpis ?? {}
  return [
    { label: 'No estaleiro agora', valor: k.presentes ?? 0, icon: IconUsers, classe: 'text-primary', detalhe: `${k.presentes_trabalhadores ?? 0} trabalhadores · ${k.presentes_visitantes ?? 0} visitantes` },
    { label: 'Entradas hoje', valor: k.entradas_hoje ?? 0, icon: IconLogin2, classe: '' },
    { label: 'Saídas hoje', valor: k.saidas_hoje ?? 0, icon: IconLogout2, classe: '' },
    { label: 'Visitantes hoje', valor: k.visitantes_hoje ?? 0, icon: IconUserCheck, classe: '' },
    { label: 'Veículos hoje', valor: k.veiculos_hoje ?? 0, icon: IconCar, classe: '' },
    { label: 'Equipamentos em uso', valor: k.equipamentos_em_uso ?? 0, icon: IconTool, classe: '', detalhe: `${k.equipamentos_disponiveis ?? 0} disponíveis · ${k.equipamentos_danificados ?? 0} danificados` },
    { label: 'Stock baixo', valor: k.stock_baixo ?? 0, icon: IconPackageOff, classe: k.stock_baixo ? 'text-warning' : '' },
    { label: 'Alertas abertos', valor: k.alertas_abertos ?? 0, icon: IconBellRinging, classe: k.alertas_abertos ? 'text-danger' : '' },
  ]
})

const porHoraData = computed(() => {
  const serie = dados.value?.series?.por_hora ?? []
  return {
    labels: serie.map((s: any) => `${String(s.hora).padStart(2, '0')}h`),
    datasets: [
      { label: 'Entradas', data: serie.map((s: any) => Number(s.entradas)), backgroundColor: '#2fb344' },
      { label: 'Saídas', data: serie.map((s: any) => Number(s.saidas)), backgroundColor: '#d63939' },
    ],
  }
})

const porDiaData = computed(() => {
  const serie = dados.value?.series?.por_dia ?? []
  return {
    labels: serie.map((s: any) => dayjs(s.dia).format('DD/MM')),
    datasets: [
      {
        label: 'Trabalhadores',
        data: serie.map((s: any) => Number(s.trabalhadores)),
        borderColor: '#206bc4',
        backgroundColor: 'rgba(32,107,196,0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, position: 'bottom' as const } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}

function onPresenceUpdate() {
  // Recarrega os KPIs quando há movimentos na obra subscrita
  carregar()
}

function subscrever(novo: number, antigo?: number) {
  if (antigo) socket.emit('leave-obra', antigo)
  if (novo) {
    socket.emit('join-obra', novo)
    aoVivo.value = true
  } else {
    aoVivo.value = false
  }
}

watch(obraId, (novo, antigo) => {
  localStorage.setItem('dashboard.obraId', String(novo))
  subscrever(novo, antigo)
  loading.value = true
  carregar()
})

onMounted(async () => {
  const { data } = await ObrasService.index({ perPage: 100, page: 1 } as any)
  obras.value = data.data ?? []
  subscrever(obraId.value)
  socket.on('presence-update', onPresenceUpdate)
  socket.on('stock-update', onPresenceUpdate)
  socket.on('equipment-update', onPresenceUpdate)
  socket.on('alert-created', onPresenceUpdate)
  await carregar()
})

onUnmounted(() => {
  if (obraId.value) socket.emit('leave-obra', obraId.value)
  socket.off('presence-update', onPresenceUpdate)
  socket.off('stock-update', onPresenceUpdate)
  socket.off('equipment-update', onPresenceUpdate)
  socket.off('alert-created', onPresenceUpdate)
})
</script>
