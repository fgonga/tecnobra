import { API } from '@common/domain/services/api'

export const RefundsService = {
  index: async (filters?: any) => {
    return await API.get('/api/v1/refunds', { params: filters })
  },
  show: async (id: number, filters?: any) => {
    return await API.get(`/api/v1/refunds/${id}`, { params: filters })
  },
  store: async (data: any) => {
    return await API.post('/api/v1/refunds', data)
  },
  update: async (id: number, data: any) => {
    return await API.put(`/api/v1/refunds/${id}`, data)
  },
  destroy: async (id: number) => {
    return await API.delete(`/api/v1/refunds/${id}`)
  },
  approve: async (id: number, notes?: string) => {
    return await API.post(`/api/v1/refunds/${id}/approve`, { notes })
  },
  reject: async (id: number, notes?: string) => {
    return await API.post(`/api/v1/refunds/${id}/reject`, { notes })
  },
}
