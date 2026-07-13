/*
 *  Tecnobra — Resolve um evento de notificação: carrega o template ATIVO de
 *  cada canal, monta as variáveis a partir do contexto, renderiza e envia.
 *
 *  Política: o template é a única fonte de verdade — se não houver template
 *  ativo para o canal, nada é enviado nesse canal (o operador controla via UI).
 */

import { NotificationTemplateModel, NotificationChannel } from "../../models/notification_template.model";
import { TemplateRenderer } from "./TemplateRenderer";
import { VariablePayloadBuilder, NotificationContext } from "./VariablePayloadBuilder";
import { SmsService, Envelope } from "../SmsService";
import { WhatsappService } from "../WhatsappService";
import { EmailService, EmailAttachment } from "../EmailService";
import { MessageLogService } from "./MessageLogService";

export type DispatchResult = { channel: NotificationChannel; sent: boolean; reason?: string };

export type DispatchOptions = {
  /** Anexos apenas para o canal email (ex.: PNG do cartão QR). */
  attachments?: EmailAttachment[];
};

export class NotificationService {
  private static readonly CHANNELS: NotificationChannel[] = ["sms", "whatsapp", "email"];

  /**
   * Dispara um evento — envia por cada canal que tenha template ativo.
   * @param eventType ex.: "WorkerCardIssued", "UnreturnedToolAlert"
   * @param ctx       contexto mínimo: ids das entidades (+ phone/email opcionais)
   */
  static async dispatch(eventType: string, ctx: NotificationContext, opts?: DispatchOptions): Promise<DispatchResult[]> {
    const { vars, phone: builtPhone, email: builtEmail } = await VariablePayloadBuilder.build(ctx);
    const phone = ctx.phone || builtPhone;
    const email = ctx.email || builtEmail;
    const results: DispatchResult[] = [];

    for (const channel of this.CHANNELS) {
      const tpl = await NotificationTemplateModel.findActive(eventType, channel);
      if (!tpl) {
        results.push({ channel, sent: false, reason: "sem-template-ativo" });
        continue;
      }
      const to = channel === "email" ? email : phone;
      if (!to) {
        results.push({ channel, sent: false, reason: "sem-destinatario" });
        continue;
      }
      const body = TemplateRenderer.render(tpl.body, vars).trim();
      if (!body) {
        results.push({ channel, sent: false, reason: "corpo-vazio" });
        continue;
      }
      try {
        let providerId: string | null = null;
        if (channel === "sms") {
          const res: any = await SmsService.send({ to, message: body, type: "sms" } as Envelope);
          providerId = res?.id ?? res?.message?.id ?? null;
        } else if (channel === "whatsapp") {
          const res: any = await WhatsappService.send(to, body);
          providerId = res?.id ?? null;
        } else {
          const subject = TemplateRenderer.render(tpl.subject ?? eventType, vars).trim();
          const res = await EmailService.send({
            to,
            subject,
            text: body,
            attachments: opts?.attachments,
          });
          providerId = res?.id ?? null;
        }
        await MessageLogService.record({ eventType, channel, to, body, status: "sent", providerId });
        results.push({ channel, sent: true });
      } catch (e: any) {
        await MessageLogService.record({ eventType, channel, to, body, status: "failed", error: e?.message ?? String(e) });
        results.push({ channel, sent: false, reason: e?.message ?? String(e) });
      }
    }

    return results;
  }
}
