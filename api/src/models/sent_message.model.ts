import { BaseModel } from "./base.model";

export type SentMessageChannel = "sms" | "whatsapp";
export type SentMessageStatus = "sent" | "failed";

export interface ISentMessage {
  id?: number;
  event_type: string | null;
  channel: SentMessageChannel;
  recipient: string;
  body: string;
  char_count: number;
  segments: number;
  unit_cost: number;
  total_cost: number;
  status: SentMessageStatus;
  provider_message_id?: string | null;
  error?: string | null;
  order_code?: string | null;
  created_at?: string;
}

export class SentMessageModel extends BaseModel {
  static tableName = "sent_messages";
  static allowedColumns = [
    "id",
    "event_type",
    "channel",
    "recipient",
    "body",
    "char_count",
    "segments",
    "unit_cost",
    "total_cost",
    "status",
    "provider_message_id",
    "error",
    "order_code",
    "created_at",
  ];
  static allowedRelations: string[] = [];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }
}
