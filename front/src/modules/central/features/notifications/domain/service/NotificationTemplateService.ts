/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 */

import { API } from '@common/domain/services/api'
import type {
  INotificationCatalog,
  INotificationChannel,
  INotificationEventType,
  INotificationTemplate,
  IPreviewResponse,
  ISendTestResponse,
} from '@/modules/central/features/notifications/application/dtos/notification'

const BASE = '/api/v1/notification-templates'

export const NotificationTemplateService = {
  index: async (filters?: any) => await API.get(BASE, { params: filters }),
  show: async (id: number, filters?: any) => await API.get(`${BASE}/${id}`, { params: filters }),
  store: async (data: Partial<INotificationTemplate>) => await API.post(BASE, data),
  update: async (id: number, data: Partial<INotificationTemplate>) => await API.put(`${BASE}/${id}`, data),
  destroy: async (id: number) => await API.delete(`${BASE}/${id}`),
}

export const NotificationTemplateExtras = {
  catalog: async (): Promise<INotificationCatalog> => {
    const res = await API.get<INotificationCatalog>(`${BASE}/catalog`)
    return res.data ?? ({ events: [], variables: {} } as never)
  },
  preview: async (payload: {
    event_type: INotificationEventType
    channel: INotificationChannel
    body: string
  }): Promise<IPreviewResponse> => {
    const res = await API.post<IPreviewResponse>(`${BASE}/preview`, payload)
    return res.data
  },
  test: async (payload: {
    event_type: INotificationEventType
    channel: INotificationChannel
    to: string
    body?: string | null
    template_id?: number | null
  }): Promise<ISendTestResponse> => {
    const res = await API.post<ISendTestResponse>(`${BASE}/test`, payload)
    return res.data
  },
}
