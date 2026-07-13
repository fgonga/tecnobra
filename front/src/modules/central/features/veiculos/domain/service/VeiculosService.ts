import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'

export interface IVeiculo {
  id?: number
  obra_id: number | null
  matricula: string
  foto?: string | null
  marca_modelo?: string | null
  tipo?: 'ligeiro' | 'pesado' | 'maquina' | 'outro'
  proprietario_tipo?: 'empresa' | 'trabalhador' | 'visitante' | 'outro'
  proprietario_nome?: string | null
  ocr_matricula?: string | null
  ocr_confianca?: number | null
  obra?: { id: number; nome: string; codigo: string } | null
  created_at?: string
}

export const VEICULO_TIPOS = [
  { label: 'Ligeiro', value: 'ligeiro' },
  { label: 'Pesado', value: 'pesado' },
  { label: 'Máquina', value: 'maquina' },
  { label: 'Outro', value: 'outro' },
]

export const VeiculosService: CrudService<IVeiculo> = {
  index: async (filters) => {
    return await API.get('/api/v1/veiculos', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/veiculos/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/veiculos`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/veiculos/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/veiculos/${id}`)
  },
}

export const PlateOcrService = {
  ler: async (fotoDataUrl: string) => {
    return await API.post<{ matricula: string | null; confianca: number; observacao?: string | null }>(
      '/api/v1/veiculos/ocr-matricula',
      { foto: fotoDataUrl }
    )
  },
}
