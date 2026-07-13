import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'
import type { IMaterial, IStockRow } from '../../application/dtos'

export const MateriaisService: CrudService<IMaterial> = {
  index: async (filters) => {
    return await API.get('/api/v1/materiais', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/materiais/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/materiais`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/materiais/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/materiais/${id}`)
  },
}

export const StockService = {
  porObra: async (obraId: number) => {
    return await API.get<IStockRow[]>(`/api/v1/obras/${obraId}/stock`)
  },
}
