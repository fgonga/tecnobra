import { API } from '@common/domain/services/api'
export default {
  me: async () => {
    return await API.get('/api/central/my-account/me')
  },
  updateUser: async ({ name, username }: { name: string; username: string }) => {
    return await API.post('/api/central/my-account/update-user', { name, username })
  },
  updatePhone: async (phone: string) => {
    return await API.post('/api/central/my-account/update-phone', { phone })
  },
  updatePassword: async ({ confirmPassword, newPassword, oldPassword }) => {
    return await API.post('/api/central/my-account/update-password', {confirmPassword, newPassword, oldPassword })
  }
}
