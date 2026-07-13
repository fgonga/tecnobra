import { API } from '@common/domain/services/api'
export default {
  get: async () => {
    return await API.get('/api/v1/config')
  },
  set: async (data: any) => {
    return await API.post('/api/v1/config',  data )
  }
}
