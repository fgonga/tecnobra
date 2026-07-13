import { BaseModel } from "./base.model";
import { db } from "../db/db";

export type NotificationChannel = "sms" | "whatsapp" | "email";

export interface INotificationTemplate {
  id?: number;
  event_type: string;
  channel: NotificationChannel;
  language: string;
  offset_days: number | null;
  subject?: string | null;
  body: string;
  enabled: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export class NotificationTemplateModel extends BaseModel {
  static tableName = "notification_templates";
  static allowedColumns = [
    "id",
    "event_type",
    "channel",
    "language",
    "offset_days",
    "subject",
    "body",
    "enabled",
    "created_at",
    "updated_at",
  ];
  static allowedRelations: string[] = [];

  static readonly CHANNELS: NotificationChannel[] = ["sms", "whatsapp", "email"];

  static async create(data: Record<string, any>, connection?: any): Promise<any> {
    return this.genericCreate(data, connection);
  }

  /** Template ATIVO para um evento+canal (idioma pt). null se não existir ou estiver desativado. */
  static async findActive(
    eventType: string,
    channel: NotificationChannel,
    language = "pt"
  ): Promise<INotificationTemplate | null> {
    const [rows]: any = await db.execute(
      `SELECT * FROM ${this.tableName} WHERE event_type = ? AND channel = ? AND language = ? AND enabled = 1 LIMIT 1`,
      [eventType, channel, language]
    );
    return (rows as INotificationTemplate[])[0] || null;
  }
}
