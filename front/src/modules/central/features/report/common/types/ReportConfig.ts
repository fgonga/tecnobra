/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

import type { FilterCondition, FilterSchema } from '@/common/hooks/types'
import type { ISalesReportItem } from '@/modules/billing/common/application/dtos'

export interface IReportColumn {
  key: keyof ISalesReportItem | 'group_name' // Para mapear os dados do backend
  label: string
  type?: 'text' | 'currency' | 'number' | 'link'
  align?: 'left' | 'center' | 'right'
  nowrap?: boolean
  linkPath?: string // Para colunas do tipo link, ex: '/app/clients/detail/id/:group_key'
  showInTotal?: boolean // Se deve aparecer no footer de totais
  totalLabel?: string // Label específica para o total (ex: "TOTAL" para primeira coluna)
  formatterLabel?(value: any): string
}

export interface IReportFilter {
  key: string
  label: string
  type: 'select' | 'text'
  options?: { value: string; label: string }[]
  placeholder?: string
  filterKey?: string // Key que será enviada no filters do backend
}

export interface IReportConfig {
  title: string
  subtitle?: string
  groupBy: string // Valor para enviar no groupBy do ISalesReportRequest
  columns: IReportColumn[]
  filterSchema?: FilterSchema
  defaultFilters?: FilterCondition[]
  showSearch?: boolean
  showExportButtons?: boolean
  showPrintButton?: boolean
  showDateFilter?: boolean
  footerNotes?: string[]
}
