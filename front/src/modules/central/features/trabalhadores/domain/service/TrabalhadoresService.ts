import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'
import type { ITrabalhador, ICartaoPreview } from '../../application/dtos'

export const TrabalhadoresService: CrudService<ITrabalhador> = {
  index: async (filters) => {
    return await API.get('/api/v1/trabalhadores', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/trabalhadores/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/trabalhadores`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/trabalhadores/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/trabalhadores/${id}`)
  },
}

export const CartaoService = {
  preview: async (trabalhadorId: number) => {
    return await API.get<ICartaoPreview>(`/api/v1/trabalhadores/${trabalhadorId}/cartao`)
  },
  emitir: async (trabalhadorId: number, renovar = false) => {
    return await API.post(`/api/v1/trabalhadores/${trabalhadorId}/emitir-cartao`, { renovar })
  },
  revogar: async (trabalhadorId: number) => {
    return await API.post(`/api/v1/trabalhadores/${trabalhadorId}/revogar-cartao`, {})
  },
}
