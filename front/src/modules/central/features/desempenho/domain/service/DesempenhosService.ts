import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'

export interface IDesempenho {
  id?: number
  obra_id: number | null
  trabalhador_id: number | null
  metrica_id: number | null
  data: string
  quantidade: number | null
  obs?: string | null
  trabalhador?: { id: number; nome: string; funcao?: string } | null
  metrica?: { id: number; nome: string; unidade: string } | null
  created_at?: string
}

export const DesempenhosService: CrudService<IDesempenho> = {
  index: async (filters) => {
    return await API.get('/api/v1/desempenhos', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/desempenhos/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/desempenhos`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/desempenhos/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/desempenhos/${id}`)
  },
}

export const MetricasService = {
  index: async () => {
    return await API.get('/api/v1/metricas-desempenho', { params: { perPage: 100, page: 1 } })
  },
}
