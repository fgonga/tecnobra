import { API } from '@common/domain/services/api'

export const RecoveryAPIService = {
    stats:  (params?: any) => API.get('/api/v1/recovery/stats',  { params }),
    orders: (params?: any) => API.get('/api/v1/recovery/orders', { params }),
    send:   (data: any)    => API.post('/api/v1/recovery/send',  data),
}
