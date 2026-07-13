import { API } from '@/common/domain/services/api'
import { ReportAPIService } from '@/modules/central/features/report/domain/service/ReportService'

export const ComparisonService = {
  loadPeriod: async (start: string, end: string) =>
    ReportAPIService.report({ type: 'general', start, end }),

  compare: async (periods: Array<{ period: { start: string; end: string; name?: string }; data: any }>) =>
    API.post<{ analysis: string }>('api/v1/insights/compare', { periods }),

  savedAnalyses: {
    list: async () =>
      API.get<any[]>('api/v1/saved-analyses'),

    get: async (id: number) =>
      API.get<any>(`api/v1/saved-analyses/${id}`),

    save: async (payload: { name: string; periods_config: any[]; report_snapshots: any[]; ai_analysis?: string | null }) =>
      API.post<any>('api/v1/saved-analyses', payload),

    delete: async (id: number) =>
      API.delete<any>(`api/v1/saved-analyses/${id}`),
  },
}
