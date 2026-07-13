/*
 *  Contabilização de mensagens enviadas. Calcula segmentos (161 chars/segmento)
 *  e custo (só SMS; WhatsApp regista com custo 0) e persiste em `sent_messages`.
 *  O custo é congelado no momento do envio. Só envios com sucesso são cobrados.
 */
import { configCache } from "../ConfigCache";
import { SentMessageModel, SentMessageChannel, SentMessageStatus } from "../../models/sent_message.model";
import { smsSegments } from "../../utils/smsSegments";

export interface MessageLogInput {
  eventType?: string | null;
  channel: SentMessageChannel;
  to: string;
  body: string;
  status: SentMessageStatus;
  providerId?: string | null;
  error?: string | null;
  orderCode?: string | null;
}

export class MessageLogService {
  static async record(input: MessageLogInput): Promise<void> {
    try {
      const cfg: any = await configCache.get();
      const body = input.body ?? "";
      const segments = smsSegments(body);
      const unitCost = input.channel === "sms" ? Number(cfg?.message_cost ?? 0) : 0;
      const totalCost = input.status === "sent" ? Number((segments * unitCost).toFixed(2)) : 0;

      await SentMessageModel.create({
        event_type: input.eventType ?? null,
        channel: input.channel,
        recipient: input.to,
        body,
        char_count: body.length,
        segments,
        unit_cost: unitCost,
        total_cost: totalCost,
        status: input.status,
        provider_message_id: input.providerId ?? null,
        error: input.error ? String(input.error).slice(0, 255) : null,
        order_code: input.orderCode ?? null,
      });
    } catch (e) {
      // A contabilização nunca deve quebrar o envio.
      console.error("[MessageLog] falha ao registar mensagem:", e);
    }
  }
}
