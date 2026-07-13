/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Resolve um evento de notificação: carrega o template ATIVO de cada canal,
 *  monta as variáveis a partir do contexto, renderiza e envia.
 *
 *  Política: o template é a única fonte de verdade — se não houver template
 *  ativo para o canal, nada é enviado nesse canal (o operador controla via UI).
 */

import { NotificationTemplateModel, NotificationChannel } from "../../models/notification_template.model";
import { TemplateRenderer } from "./TemplateRenderer";
import { VariablePayloadBuilder, NotificationContext } from "./VariablePayloadBuilder";
import { SmsService, Envelope } from "../SmsService";
import { WhatsappService } from "../WhatsappService";
import { MessageLogService } from "./MessageLogService";

export type DispatchResult = { channel: NotificationChannel; sent: boolean; reason?: string };

export class NotificationService {
  private static readonly CHANNELS: NotificationChannel[] = ["sms", "whatsapp"];

  /**
   * Dispara um evento — envia por cada canal que tenha template ativo.
   * @param eventType ex.: "PaymentReceived", "EnrolmentCompleted", "CartRecovery"
   * @param ctx       contexto mínimo: { paymentCode } ou { orderCode } (+ phone opcional)
   */
  static async dispatch(eventType: string, ctx: NotificationContext): Promise<DispatchResult[]> {
    const { vars, phone: builtPhone } = await VariablePayloadBuilder.build(ctx);
    const to = ctx.phone || builtPhone;
    const results: DispatchResult[] = [];

    for (const channel of this.CHANNELS) {
      const tpl = await NotificationTemplateModel.findActive(eventType, channel);
      if (!tpl) {
        results.push({ channel, sent: false, reason: "sem-template-ativo" });
        continue;
      }
      if (!to) {
        results.push({ channel, sent: false, reason: "sem-destinatario" });
        continue;
      }
      const body = TemplateRenderer.render(tpl.body, vars).trim();
      if (!body) {
        results.push({ channel, sent: false, reason: "corpo-vazio" });
        continue;
      }
      const orderCode = (vars as any)?.order?.code ?? null;
      try {
        let providerId: string | null = null;
        if (channel === "sms") {
          const res: any = await SmsService.send({ to, message: body, type: "sms" } as Envelope);
          providerId = res?.id ?? res?.message?.id ?? null;
        } else {
          const res: any = await WhatsappService.send(to, body);
          providerId = res?.id ?? null;
        }
        await MessageLogService.record({ eventType, channel, to, body, status: "sent", providerId, orderCode });
        results.push({ channel, sent: true });
      } catch (e: any) {
        await MessageLogService.record({ eventType, channel, to, body, status: "failed", error: e?.message ?? String(e), orderCode });
        results.push({ channel, sent: false, reason: e?.message ?? String(e) });
      }
    }

    return results;
  }
}
