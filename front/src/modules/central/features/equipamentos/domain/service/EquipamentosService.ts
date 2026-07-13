import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'
import type { IEquipamento } from '../../application/dtos'

export const EquipamentosService: CrudService<IEquipamento> = {
  index: async (filters) => {
    return await API.get('/api/v1/equipamentos', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/equipamentos/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/equipamentos`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/equipamentos/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/equipamentos/${id}`)
  },
}

export const EquipamentoAcoesService = {
  levantar: async (id: number, payload: { trabalhador_id: number; devolucao_prevista?: string | null; obs?: string | null }) => {
    return await API.post(`/api/v1/equipamentos/${id}/levantar`, payload)
  },
  devolver: async (id: number, payload: { estado_devolucao?: string; obs?: string | null }) => {
    return await API.post(`/api/v1/equipamentos/${id}/devolver`, payload)
  },
  historico: async (equipamentoId: number) => {
    return await API.get('/api/v1/movimentos-equipamento', {
      params: {
        perPage: 20,
        page: 1,
        with: ['trabalhador'],
        filters: [{ field: 'equipamento_id', operator: '=', value: equipamentoId }],
        orderBy: 'ocorrido_em',
        sortMethod: 'DESC',
      },
    })
  },
}
