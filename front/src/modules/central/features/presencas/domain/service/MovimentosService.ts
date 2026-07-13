import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'

export interface IMovimento {
  id?: number
  obra_id: number
  tipo_entidade: 'trabalhador' | 'visitante' | 'veiculo'
  trabalhador_id?: number | null
  visitante_id?: number | null
  veiculo_id?: number | null
  direcao: 'entrada' | 'saida'
  metodo: 'qr' | 'manual' | 'ocr'
  portao?: string | null
  ocorrido_em: string
  obs?: string | null
  trabalhador?: { id: number; nome: string; funcao?: string } | null
  visitante?: { id: number; nome: string } | null
  veiculo?: { id: number; matricula: string } | null
  obra?: { id: number; nome: string; codigo: string } | null
}

export const MovimentosService: CrudService<IMovimento> = {
  index: async (filters) => {
    return await API.get('/api/v1/movimentos', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/movimentos/${id}`, { params: filters })
  },
  store: async () => {
    throw new Error('Movimentos são criados na portaria.')
  },
  update: async () => {
    throw new Error('Movimentos não são editáveis.')
  },
  destroy: async () => {
    throw new Error('Movimentos não são elimináveis.')
  },
}
