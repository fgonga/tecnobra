import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'

export interface IGuiaItem {
  material_id: number | null
  quantidade: number | null
  preco_unitario?: number | null
  material_nome?: string
  unidade?: string
}

export interface IGuia {
  id?: number
  obra_id: number | null
  numero: string
  fornecedor_empresa_id?: number | null
  fornecedor_nome?: string | null
  data_entrega: string
  documento?: string | null
  obs?: string | null
  itens?: IGuiaItem[]
  obra?: { id: number; nome: string; codigo: string } | null
  fornecedor?: { id: number; nome: string } | null
  created_at?: string
}

export const GuiasService: CrudService<IGuia> = {
  index: async (filters) => {
    return await API.get('/api/v1/guias-remessa', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/guias-remessa/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/guias-remessa`, data)
  },
  update: async () => {
    throw new Error('Guias de remessa não são editáveis.')
  },
  destroy: async () => {
    throw new Error('Guias de remessa não podem ser eliminadas.')
  },
}
