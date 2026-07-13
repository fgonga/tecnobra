export interface IObra {
  id?: number
  nome: string
  codigo: string
  endereco?: string | null
  cliente?: string | null
  estado: 'ativa' | 'pausada' | 'concluida'
  data_inicio?: string | null
  data_fim_prevista?: string | null
  responsavel_user_id?: number | null
  responsavel?: { id: number; name: string } | null
  created_at?: string
  updated_at?: string
}

export const OBRA_ESTADOS = [
  { label: 'Ativa', value: 'ativa' },
  { label: 'Pausada', value: 'pausada' },
  { label: 'Concluída', value: 'concluida' },
]
