export interface IEquipamento {
  id?: number
  obra_id: number | null
  nome: string
  codigo?: string | null
  categoria: 'equipamento' | 'ferramenta'
  numero_serie?: string | null
  estado?: 'disponivel' | 'em_uso' | 'danificado' | 'fora_servico' | 'desaparecido'
  trabalhador_atual_id?: number | null
  trabalhador_atual?: { id: number; nome: string } | null
  obra?: { id: number; nome: string; codigo: string } | null
  foto?: string | null
  obs?: string | null
  created_at?: string
}

export const EQUIPAMENTO_ESTADOS: Record<string, { label: string; badge: string }> = {
  disponivel: { label: 'Disponível', badge: 'bg-green text-green-fg' },
  em_uso: { label: 'Em uso', badge: 'bg-blue text-blue-fg' },
  danificado: { label: 'Danificado', badge: 'bg-orange text-orange-fg' },
  fora_servico: { label: 'Fora de serviço', badge: 'bg-secondary text-secondary-fg' },
  desaparecido: { label: 'Desaparecido', badge: 'bg-red text-red-fg' },
}
