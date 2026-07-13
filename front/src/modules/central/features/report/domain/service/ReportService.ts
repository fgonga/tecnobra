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

import { API } from '@/common/domain/services/api'
import type {
  ISalesReportDocumentsResult,
  ISalesReportRequest,
  ISalesReportResult,
  ITaxMapResult,
} from '@/modules/billing/common/application/dtos'

export const ReportAPIService = {
  report: async (data: any) => {
    return await API.get<{ data: ISalesReportResult }>('api/v1/report', {
      params: data,
    })
  },
  reportDashboard: async (data: any) => {
    return await API.get<{ data: ISalesReportResult }>('api/v1/report-dashboard', {
      params: data,
    })
  },
  insights: async (data: any) => {
    return await API.post<{ insight: string }>('api/v1/insights', data)
  },
  insightsCards: async (data: any) => {
    return await API.post<{ cards: Record<string, string> }>('api/v1/insights/cards', data)
  },
  insightsChat: async (data: any) => {
    return await API.post<{ message: string }>('api/v1/insights/chat', data)
  },
  sales: async (params: Record<string, any>) => {
    return await API.get<any[]>('api/v1/report/sales', { params })
  },
}
