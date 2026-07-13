import { API } from '@common/domain/services/api'

export const SettlementsService = {
  index: async (filters?: any) => {
    return await API.get('/api/v1/settlements', { params: filters })
  },
  show: async (id: number, filters?: any) => {
    return await API.get(`/api/v1/settlements/${id}`, { params: filters })
  },
  store: async (data: any) => {
    return await API.post('/api/v1/settlements', data)
  },
  update: async (id: number, data: any) => {
    return await API.put(`/api/v1/settlements/${id}`, data)
  },
  destroy: async (id: number) => {
    return await API.delete(`/api/v1/settlements/${id}`)
  },
  balance: async () => {
    return await API.get('/api/v1/settlements/balance')
  },
  calculate: async (data: any) => {
    return await API.post('/api/v1/settlements/calculate', data)
  },
  markAsPaid: async (id: number, data: any) => {
    return await API.post(`/api/v1/settlements/${id}/mark-paid`, data)
  },
  transactions: async (params?: any) => {
    return await API.get('/api/v1/settlements/transactions', { params })
  },
  addManualTransaction: async (data: any) => {
    return await API.post('/api/v1/settlements/transactions/manual', data)
  },
  bulk: async (data: any) => {
    return await API.post('/api/v1/settlements/bulk', data)
  },
  addProof: async (id: number, proof_url: string) => {
    return await API.post(`/api/v1/settlements/${id}/proofs`, { proof_url })
  },
  removeProof: async (id: number, filename: string) => {
    return await API.delete(`/api/v1/settlements/${id}/proofs/${filename}`)
  },
}
