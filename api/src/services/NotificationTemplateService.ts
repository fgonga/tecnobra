/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Gestão de templates de notificação (SMS / WhatsApp).
 *  CRUD herdado de BaseCrudService + preview/sendTest + validação de variáveis.
 */

import { BaseCrudService } from "./BaseCrudService";
import { NotificationTemplateModel } from "../models/notification_template.model";
import { SmsService, Envelope } from "./SmsService";
import { WhatsappService } from "./WhatsappService";
import { EmailService } from "./EmailService";
import { TemplateRenderer } from "./notification/TemplateRenderer";
import { EventVariableRegistry } from "./notification/EventVariableRegistry";
import { ValidationError } from "../exceptions/ValidationError";

type PreviewPayload = { event_type: string; channel: string; body: string };
type TestPayload = {
  event_type: string;
  channel: string;
  to: string;
  body?: string | null;
  template_id?: number | null;
};
type WritePayload = {
  event_type: string;
  channel: string;
  body: string;
  subject?: string | null;
  language?: string;
  offset_days?: number | null;
  enabled?: boolean | number;
};

export class NotificationTemplateService extends BaseCrudService<typeof NotificationTemplateModel> {
  constructor() {
    super(NotificationTemplateModel);
  }

  async store(data: WritePayload): Promise<any> {
    this.validate(data);
    return super.store(this.normalize(data));
  }

  async update(id: number, data: WritePayload): Promise<boolean> {
    this.validate(data);
    return super.update(id, this.normalize(data));
  }

  /** Renderiza o body com dados de exemplo do event_type. */
  preview(payload: PreviewPayload): { body: string } {
    const vars = EventVariableRegistry.sampleTree(payload.event_type);
    return { body: TemplateRenderer.render(String(payload.body ?? ""), vars) };
  }

  /** Envia um teste real para o destinatário indicado. */
  async sendTest(payload: TestPayload): Promise<any> {
    let body = payload.body ?? "";
    if (!body && payload.template_id) {
      const tpl = await NotificationTemplateModel.findOneBy("id", payload.template_id);
      body = tpl?.body ?? "";
    }
    if (String(body).trim() === "") {
      throw new ValidationError("Corpo do template vazio.", 422);
    }

    const rendered = this.preview({
      event_type: payload.event_type,
      channel: payload.channel,
      body,
    });

    const to = String(payload.to ?? "").trim();
    if (to === "") throw new ValidationError("Destinatário em falta.", 422);

    const text = rendered.body.trim();
    try {
      if (payload.channel === "sms") {
        await SmsService.send({ to, message: text, type: "sms" } as Envelope);
      } else if (payload.channel === "whatsapp") {
        await WhatsappService.send(to, text);
      } else if (payload.channel === "email") {
        await EmailService.send({ to, subject: `[Teste] ${payload.event_type}`, text });
      } else {
        throw new Error(`Canal desconhecido: ${payload.channel}`);
      }
    } catch (e: any) {
      return { ok: false, message: `Falha ao enviar: ${e?.message ?? e}` };
    }

    return { ok: true, rendered, sent_to: to, channel: payload.channel };
  }

  /** Validação de payload — espelha o StoreNotificationTemplateRequest. */
  private validate(data: WritePayload): void {
    if (!EventVariableRegistry.isValidEvent(String(data.event_type))) {
      throw new ValidationError("Evento inválido.", 422);
    }
    if (!NotificationTemplateModel.CHANNELS.includes(data.channel as any)) {
      throw new ValidationError("Canal inválido.", 422);
    }
    const allowed = EventVariableRegistry.keys(String(data.event_type));
    const unknown = TemplateRenderer.unknownVariables(String(data.body ?? ""), allowed);
    if (unknown.length) {
      throw new ValidationError(`Variáveis desconhecidas: ${unknown.join(", ")}`, 422);
    }
  }

  private normalize(data: WritePayload): Record<string, any> {
    return {
      event_type: data.event_type,
      channel: data.channel,
      language: data.language ?? "pt",
      offset_days: data.offset_days ?? null,
      subject: data.subject ?? null,
      body: data.body,
      enabled: data.enabled === undefined ? 1 : data.enabled ? 1 : 0,
    };
  }
}
