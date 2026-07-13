/*
 *  Tecnobra — Schemas AJV para os templates de notificação (SMS / WhatsApp / E-mail).
 */

const EVENTS = ["WorkerCardIssued", "VisitorCardIssued", "UnreturnedToolAlert", "LowStockAlert"];
const CHANNELS = ["sms", "whatsapp", "email"];

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
        subject: { type: ["string", "null"], maxLength: 255 },
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
        subject: { type: ["string", "null"], maxLength: 255 },
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
