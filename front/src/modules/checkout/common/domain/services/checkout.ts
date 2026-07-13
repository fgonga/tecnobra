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
 */

import { API } from '@common/domain/services/api'
export default {
  done: async (data) => {
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
    )
    return await API.post('/api/checkout/done', filtered)
  },
  checkPayment: async (paymentId:string) => {
    return await API.get('/api/checkout/payment/check',{
        params: {
          paymentId:paymentId
        }
      }
    )
  },
  configurations: async ({ course }: { course?: string | number }) => {
    const params: Record<string, any> = {};
    if (course) params.course = course;

    return await API.get('/api/checkout/configurations', { params });
  },
  getCoupon: async (code: string | number ) => {
    const params: Record<string, any> = {};
    if (code) params.code = code;
    return await API.get('/api/checkout/coupon', { params });
  },
  getCard: async (code: string | number ) => {
    const params: Record<string, any> = {};
    if (code) params.code = code;
    return await API.get('/api/checkout/card', { params });
  },
  getCart: async (code: string | number ) => {
    const params: Record<string, any> = {};
    if (code) params.code = code;
    return await API.get('/api/checkout/cart', { params });
  },
  print: async ({orderCode,paymentCode}) => {
    const params: Record<string, any> = {};
    if (orderCode) params.orderCode = orderCode;
    if (paymentCode) params.paymentCode = paymentCode;
    return await API.get('/api/checkout/print', { params });
  }
}

