/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

export type OperatorsAllowed =
    | "="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "LIKE"
    | "IN"
    | "NOT IN"

export interface FilterCondition {
  field: string
  value?: any
  operator: OperatorsAllowed
}

export type PaginationRequestDto = {
  search?: string | null
  total?: number | null
  perPage?: number
  page?: number
  columns?: string[]
  with?: string[]
  filters?: FilterCondition[]
  orderBy?: string
  sortMethod?: "ASC" | "DESC"
  searchable?: string[]
}
export type CustomShowDTO  ={
  id: number | string | null;
  with: string[] | string;
  columns: string[];
}


