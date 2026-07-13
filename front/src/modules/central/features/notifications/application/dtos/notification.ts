/*
 *  Tecnobra — Tipos + tabelas de apresentação para os templates de
 *  notificação (SMS / WhatsApp / E-mail).
 */

export type INotificationChannel = 'sms' | 'whatsapp' | 'email'

export type INotificationEventType =
  | 'WorkerCardIssued'
  | 'VisitorCardIssued'
  | 'UnreturnedToolAlert'
  | 'LowStockAlert'

export interface INotificationTemplate {
  id: number
  event_type: INotificationEventType
  channel: INotificationChannel
  language: string
  offset_days: number | null
  subject?: string | null
  body: string
  enabled: boolean | number
  created_at?: string
  updated_at?: string
}

export interface INotificationVariable {
  key: string
  label: string
  sample: string
}

export interface INotificationCatalog {
  events: INotificationEventType[]
  variables: Record<INotificationEventType, INotificationVariable[]>
}

export interface IPreviewResponse {
  body: string
}

export interface ISendTestResponse {
  ok: boolean
  rendered?: IPreviewResponse
  sent_to?: string
  channel?: INotificationChannel
  message?: string
}

export const EVENT_LABELS: Record<INotificationEventType, string> = {
  WorkerCardIssued: 'Cartão de trabalhador emitido',
  VisitorCardIssued: 'Cartão de visitante emitido',
  UnreturnedToolAlert: 'Ferramenta não devolvida',
  LowStockAlert: 'Stock baixo',
}

export const EVENT_DESCRIPTIONS: Record<INotificationEventType, string> = {
  WorkerCardIssued: 'Disparado quando o cartão QR de um trabalhador é emitido ou renovado.',
  VisitorCardIssued: 'Quando é criado um cartão de visitante com janela de validade.',
  UnreturnedToolAlert: 'Alerta de fim de dia quando um equipamento não foi devolvido.',
  LowStockAlert: 'Quando um material atinge o stock mínimo definido.',
}

export const EVENT_ICONS: Record<INotificationEventType, string> = {
  WorkerCardIssued: 'tabler:id-badge-2',
  VisitorCardIssued: 'tabler:user-check',
  UnreturnedToolAlert: 'tabler:tool',
  LowStockAlert: 'tabler:package-off',
}

export const CHANNEL_LABELS: Record<INotificationChannel, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
}

export const CHANNEL_ICONS: Record<INotificationChannel, string> = {
  sms: 'tabler:message',
  whatsapp: 'tabler:brand-whatsapp',
  email: 'tabler:mail',
}

export const CHANNEL_COLORS: Record<INotificationChannel, string> = {
  sms: 'primary',
  whatsapp: 'success',
  email: 'orange',
}

export const CHANNELS: INotificationChannel[] = ['sms', 'whatsapp', 'email']
