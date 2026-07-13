import { API } from '@common/domain/services/api'

export type RelatorioParams = {
  start?: string
  end?: string
  obra_id?: number | null
  empresa_id?: number | null
  trabalhador_id?: number | null
  metrica_id?: number | null
  motivo?: string | null
}

function limpar(params: RelatorioParams) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ''))
}

export const RelatoriosService = {
  presencas: (p: RelatorioParams) => API.get('/api/v1/report/presencas', { params: limpar(p) }),
  visitantes: (p: RelatorioParams) => API.get('/api/v1/report/visitantes', { params: limpar(p) }),
  inventario: (p: RelatorioParams) => API.get('/api/v1/report/inventario', { params: limpar(p) }),
  materiais: (p: RelatorioParams) => API.get('/api/v1/report/materiais', { params: limpar(p) }),
  desempenho: (p: RelatorioParams) => API.get('/api/v1/report/desempenho', { params: limpar(p) }),
}
