export interface IEmpresa {
  id?: number
  nome: string
  nif?: string | null
  tipo: 'empreiteiro' | 'subempreiteiro' | 'fornecedor' | 'fiscalizacao' | 'outro'
  contacto_nome?: string | null
  telefone?: string | null
  email?: string | null
  estado: 'ativa' | 'inativa'
  created_at?: string
  updated_at?: string
}

export const EMPRESA_TIPOS = [
  { label: 'Empreiteiro', value: 'empreiteiro' },
  { label: 'Subempreiteiro', value: 'subempreiteiro' },
  { label: 'Fornecedor', value: 'fornecedor' },
  { label: 'Fiscalização', value: 'fiscalizacao' },
  { label: 'Outro', value: 'outro' },
]

export const EMPRESA_TIPO_LABELS: Record<string, string> = Object.fromEntries(
  EMPRESA_TIPOS.map((t) => [t.value, t.label])
)
