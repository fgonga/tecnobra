import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'
import type { IEmpresa } from '../../application/dtos'

export const EmpresasService: CrudService<IEmpresa> = {
  index: async (filters) => {
    return await API.get('/api/v1/empresas', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/empresas/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/empresas`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/empresas/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/empresas/${id}`)
  },
}
