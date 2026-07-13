import { API } from '@common/domain/services/api'

export const ProfilesService = {
  index:   (params?: any) => API.get('/api/v1/profiles', { params }),
  store:   (data: any)    => API.post('/api/v1/profiles', data),
  show:    (id: number)   => API.get(`/api/v1/profiles/${id}`),
  update:  (id: number, data: any) => API.put(`/api/v1/profiles/${id}`, data),
  destroy: (id: number)   => API.delete(`/api/v1/profiles/${id}`),

  addRule:    (id: number, rule: string)    => API.post(`/api/v1/profiles/${id}/rules`, { rule }),
  removeRule: (id: number, rule: string)    => API.delete(`/api/v1/profiles/${id}/rules/${rule}`),
  setRules:   (id: number, rules: string[]) => API.put(`/api/v1/profiles/${id}/rules`, { rules }),

  getUserPermissions: (userId: number) => API.get(`/api/v1/users/${userId}/permissions`),
  getUserProfiles:    (userId: number) => API.get(`/api/v1/users/${userId}/profiles`),
  assignToUser:       (userId: number, profileId: number) => API.post(`/api/v1/users/${userId}/profiles`, { profile_id: profileId }),
  removeFromUser:     (userId: number, profileId: number) => API.delete(`/api/v1/users/${userId}/profiles/${profileId}`),

  getUserRules:   (userId: number) => API.get(`/api/v1/users/${userId}/rules`),
  addUserRule:    (userId: number, rule: string)    => API.post(`/api/v1/users/${userId}/rules`, { rule }),
  removeUserRule: (userId: number, rule: string)    => API.delete(`/api/v1/users/${userId}/rules/${rule}`),
  setUserRules:   (userId: number, rules: string[]) => API.put(`/api/v1/users/${userId}/rules`, { rules }),
}
