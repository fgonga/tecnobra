export interface IMaterial {
  id?: number
  obra_id: number | null
  nome: string
  unidade: string
  categoria?: string | null
  stock_atual?: number
  stock_minimo?: number
  obra?: { id: number; nome: string; codigo: string } | null
  created_at?: string
}

export interface IStockRow {
  id: number
  nome: string
  unidade: string
  categoria?: string | null
  stock_atual: number
  stock_minimo: number
  orcado: number
  entregue: number
  consumido: number
  abaixo_minimo: boolean
}
