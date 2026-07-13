import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'

export interface IConsumo {
  id?: number
  obra_id: number | null
  material_id: number | null
  quantidade: number | null
  trabalhador_id?: number | null
  ocorrido_em?: string
  obs?: string | null
  material?: { id: number; nome: string; unidade: string } | null
  trabalhador?: { id: number; nome: string } | null
}

export const ConsumosService: CrudService<IConsumo> = {
  index: async (filters) => {
    return await API.get('/api/v1/consumos-materiais', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/consumos-materiais/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/consumos-materiais`, data)
  },
  update: async () => {
    throw new Error('Consumos não são editáveis.')
  },
  destroy: async () => {
    throw new Error('Consumos não são elimináveis.')
  },
}
