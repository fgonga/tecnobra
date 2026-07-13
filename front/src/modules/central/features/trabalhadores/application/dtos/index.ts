export interface ITrabalhador {
  id?: number
  obra_id: number | null
  empresa_id: number | null
  nome: string
  funcao?: string | null
  telefone?: string | null
  email?: string | null
  documento?: string | null
  foto?: string | null
  cartao_estado?: 'ativo' | 'revogado'
  cartao_emitido_em?: string | null
  estado: 'ativo' | 'suspenso' | 'inativo'
  obra?: { id: number; nome: string } | null
  empresa?: { id: number; nome: string } | null
  created_at?: string
  updated_at?: string
}

export interface ICartaoPreview {
  link: string
  qrDataUrl: string
  cartao_estado: string
}

export const TRABALHADOR_ESTADOS = [
  { label: 'Ativo', value: 'ativo' },
  { label: 'Suspenso', value: 'suspenso' },
  { label: 'Inativo', value: 'inativo' },
]
