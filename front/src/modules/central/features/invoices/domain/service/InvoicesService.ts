/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Serviço de Faturação (Vendus) — consome /api/v1/invoices/*.
 */
import { API } from '@common/domain/services/api'

const BASE = '/api/v1/invoices'

export const InvoicesService = {
  // Documentos emitidos/conectados (paginado)
  index: (params?: any) => API.get(`${BASE}`, { params }),
  // Encomendas por faturar (pagas/concluídas sem documento)
  pending: (params?: any) => API.get(`${BASE}/pending`, { params }),
  // Emite documento { order_id, type?, client?, notes?, send_email? }
  emit: (data: any) => API.post(`${BASE}/emit`, data),
  // Liga doc existente { order_id, provider?, vendusId?, external_id?, number?, type?, amount? }
  connect: (data: any) => API.post(`${BASE}/connect`, data),
  // Anula documento
  cancel: (id: number, reason?: string) => API.post(`${BASE}/${id}/cancel`, { reason }),
  // URL do PDF (backoffice do Vendus; abrir no browser com a sessão do admin)
  pdf: (id: number) => API.get(`${BASE}/${id}/pdf`),
  // Pesquisas no Vendus
  searchVendus: (params: any) => API.get(`${BASE}/vendus/search`, { params }),
  searchClients: (params: any) => API.get(`${BASE}/vendus/clients`, { params }),
  searchProducts: (params: any) => API.get(`${BASE}/vendus/products`, { params }),
  // Mapeamento curso -> produto Vendus
  courses: () => API.get(`${BASE}/courses`),
  connectCourse: (
    id: number,
    vendus_product_id: string | null,
    vendus_product_name: string | null = null,
  ) => API.post(`${BASE}/courses/${id}/connect`, { vendus_product_id, vendus_product_name }),
  // Mapeamento método de pagamento local -> método Vendus
  paymentMethods: () => API.get(`${BASE}/payment-methods`),
  searchPaymentMethods: () => API.get(`${BASE}/vendus/payment-methods`),
  createPaymentMethod: (title: string, type: string) =>
    API.post(`${BASE}/vendus/payment-methods`, { title, type }),
  connectPaymentMethod: (
    key: string,
    vendus_id: string | null,
    vendus_name: string | null = null,
  ) => API.post(`${BASE}/payment-methods/${key}/connect`, { vendus_id, vendus_name }),
}

export default InvoicesService
