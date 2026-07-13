import { API } from '@/common/domain/services/api'

export type RecommendedAction = 'apply_paid' | 'apply_failed' | 'reverse' | 'noop' | 'manual'

export interface ReconciliationItem {
  payment_id: number
  code: string
  order_id: number | null
  customer_name: string | null
  amount: number
  payment_type: string | null
  db_status: string
  appy_status: string | null
  appy_id: string | null
  appy_amount: number | null
  appy_updated_at: string | null
  match: boolean
  divergence: 'match' | 'missing_in_appy' | 'status_mismatch' | 'amount_mismatch'
  recommended_action: RecommendedAction
}

export interface ReconciliationSummary {
  total: number
  match: number
  status_mismatch: number
  missing_in_appy: number
  amount_mismatch: number
  db_paid_count: number
  db_paid_amount: number
  db_unpaid_count: number
  db_unpaid_amount: number
  appy_success_count: number
  appy_success_amount: number
  appy_unpaid_count: number
  appy_unpaid_amount: number
  apply_paid_count: number
  apply_paid_amount: number
  apply_failed_count: number
  apply_failed_amount: number
  reverse_count: number
  reverse_amount: number
}

export interface ReconciliationResult {
  items: ReconciliationItem[]
  summary: ReconciliationSummary
}

export interface ApplyResult {
  results: Array<{ code: string; action: string; ok: boolean; error?: string }>
}

export const HelpdeskAPIService = {
  sendDayResume: async (date?: string, phone?: string) =>
    API.post<{ success: boolean; preview: string }>('api/v1/helpdesk/send-day-resume', { date, phone }),

  reconcilePayments: async (start: string, end: string) =>
    API.post<ReconciliationResult>('api/v1/helpdesk/reconcile-payments', { start, end }),

  applyReconciliation: async (codes: string[]) =>
    API.post<ApplyResult>('api/v1/helpdesk/apply-reconciliation', { codes }),
}
