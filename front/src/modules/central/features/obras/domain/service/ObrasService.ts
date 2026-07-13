import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'
import type { IObra } from '../../application/dtos'

export const ObrasService: CrudService<IObra> = {
  index: async (filters) => {
    return await API.get('/api/v1/obras', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/obras/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/obras`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/obras/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/obras/${id}`)
  },
}
