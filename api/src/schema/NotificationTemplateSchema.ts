/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Schemas AJV para os templates de notificação (SMS / WhatsApp).
 */

const EVENTS = ["OrderCreated", "ReferenceGenerated", "ReferenceExpiring", "PaymentReceived", "PaymentFailed", "EnrolmentCompleted", "CartRecovery"];
const CHANNELS = ["sms", "whatsapp"];

export class NotificationTemplateSchema {
  static store = {
    body: {
      type: "object",
      required: ["event_type", "channel", "body"],
      properties: {
        event_type: { type: "string", enum: EVENTS },
        channel: { type: "string", enum: CHANNELS },
        language: { type: "string", maxLength: 5 },
        offset_days: { type: ["integer", "null"] },
        body: { type: "string", minLength: 1, maxLength: 4000 },
        enabled: { type: "boolean" },
      },
      additionalProperties: false,
    },
  };

  static update = {
    body: {
      type: "object",
      properties: {
        event_type: { type: "string", enum: EVENTS },
        channel: { type: "string", enum: CHANNELS },
        language: { type: "string", maxLength: 5 },
        offset_days: { type: ["integer", "null"] },
        body: { type: "string", minLength: 1, maxLength: 4000 },
        enabled: { type: "boolean" },
      },
      additionalProperties: false,
    },
  };

  static preview = {
    body: {
      type: "object",
      required: ["event_type", "channel", "body"],
      properties: {
        event_type: { type: "string", enum: EVENTS },
        channel: { type: "string", enum: CHANNELS },
        body: { type: "string", maxLength: 4000 },
      },
      additionalProperties: true,
    },
  };

  static test = {
    body: {
      type: "object",
      required: ["event_type", "channel", "to"],
      properties: {
        event_type: { type: "string", enum: EVENTS },
        channel: { type: "string", enum: CHANNELS },
        to: { type: "string", minLength: 3, maxLength: 100 },
        body: { type: ["string", "null"], maxLength: 4000 },
        template_id: { type: ["integer", "null"] },
      },
      additionalProperties: true,
    },
  };
}
