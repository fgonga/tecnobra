/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 */
import type { CrudService } from '@common/hooks/types'
import { API } from '@common/domain/services/api'
import type { IOrders } from '@/modules/central/features/orders/application/dtos'
const OrdersAPIService: CrudService<IOrders> = {
  index: async (filters) => {
    return await API.get('/api/v1/orders', { params: filters })
  },
  show: async (id, filters) => {
    return await API.get(`/api/v1/orders/${id}`, { params: filters })
  },
  store: async (data) => {
    return await API.post(`/api/v1/orders`, data)
  },
  update: async (id, data) => {
    return await API.put(`/api/v1/orders/${id}`, data)
  },
  destroy: async (id) => {
    return await API.delete(`/api/v1/orders/${id}`)
  }
}
export const OrdersService: CrudService<IOrders> =  OrdersAPIService
