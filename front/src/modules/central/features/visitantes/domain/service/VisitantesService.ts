import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'

export interface IVisitante {
  id?: number
  obra_id: number | null
  nome: string
  empresa?: string | null
  motivo?: string | null
  telefone?: string | null
  email?: string | null
  documento?: string | null
  anfitriao?: string | null
  valido_de?: string | null
  valido_ate?: string | null
  estado?: 'previsto' | 'ativo' | 'encerrado'
  enviar_cartao?: boolean
  obra?: { id: number; nome: string; codigo: string } | null
  created_at?: string
}

export const VisitantesService: CrudService<IVisitante> = {
  index: async (filters) => {
    return await API.get('/api/v1/visitantes', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/visitantes/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/visitantes`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/visitantes/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/visitantes/${id}`)
  },
}
