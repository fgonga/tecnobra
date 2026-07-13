import { API } from '@common/domain/services/api'

export default {
  login: async ({ identification, password }: { identification: string; password: string }) => {
    return await API.post('/api/central/auth/login', {
      identification,
      password,
    })
  },
  checkPhone: async (phone: string) => {
    return await API.post('/api/central/auth/check-phone', { phone })
  },

  verifyCode: async (phone: string, code: string) => {
    return await API.post('/api/central/auth/verify-code', { phone, code })
  },
  resetPassword: async (phone: string, password: string) => {
    return await API.post('/api/central/auth/reset-password', { phone, password })
  },
}
