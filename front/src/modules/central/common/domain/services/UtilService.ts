import { API } from '@common/domain/services/api'
export default {
  devAprovePayment: async (paymentCode) => {
    return await API.post('/api/v1/util/dev-aprove-payment',{
      paymentCode:paymentCode
    })
  },
  devRecusePayment: async (paymentCode) => {
    return await API.post('/api/v1/util/dev-recuse-payment', {
      paymentCode:paymentCode
    })
  },

}

