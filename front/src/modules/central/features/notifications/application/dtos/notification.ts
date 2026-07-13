/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Tipos + tabelas de apresentação para os templates de notificação
 *  (SMS / WhatsApp) do checkout.
 */

export type INotificationChannel = 'sms' | 'whatsapp'

export type INotificationEventType =
  | 'OrderCreated'
  | 'ReferenceGenerated'
  | 'PaymentReceived'
  | 'PaymentFailed'
  | 'EnrolmentCompleted'
  | 'CartRecovery'

export interface INotificationTemplate {
  id: number
  event_type: INotificationEventType
  channel: INotificationChannel
  language: string
  offset_days: number | null
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
  OrderCreated: 'Encomenda criada',
  ReferenceGenerated: 'Referência gerada',
  PaymentReceived: 'Pagamento confirmado',
  PaymentFailed: 'Pagamento falhou',
  EnrolmentCompleted: 'Matrícula concluída',
  CartRecovery: 'Recuperação de carrinho',
}

export const EVENT_DESCRIPTIONS: Record<INotificationEventType, string> = {
  OrderCreated: 'Disparado quando uma nova encomenda é registada no checkout.',
  ReferenceGenerated: 'Quando é gerada a referência Multicaixa para pagamento.',
  PaymentReceived: 'Quando o pagamento da encomenda é confirmado.',
  PaymentFailed: 'Quando uma tentativa de pagamento é recusada ou falha.',
  EnrolmentCompleted: 'Quando o acesso ao curso é concedido ao aluno.',
  CartRecovery: 'Lembrete para clientes que não concluíram o pagamento (carrinho abandonado).',
}

export const EVENT_ICONS: Record<INotificationEventType, string> = {
  OrderCreated: 'tabler:shopping-bag-plus',
  ReferenceGenerated: 'tabler:barcode',
  PaymentReceived: 'tabler:cash-banknote',
  PaymentFailed: 'tabler:alert-triangle',
  EnrolmentCompleted: 'tabler:school',
  CartRecovery: 'tabler:shopping-cart-exclamation',
}

export const CHANNEL_LABELS: Record<INotificationChannel, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
}

export const CHANNEL_ICONS: Record<INotificationChannel, string> = {
  sms: 'tabler:message',
  whatsapp: 'tabler:brand-whatsapp',
}

export const CHANNEL_COLORS: Record<INotificationChannel, string> = {
  sms: 'primary',
  whatsapp: 'success',
}

export const CHANNELS: INotificationChannel[] = ['sms', 'whatsapp']
