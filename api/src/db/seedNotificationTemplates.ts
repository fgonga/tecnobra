/*
 *  Tecnobra — Seed idempotente dos templates de notificação default
 *  (SMS / WhatsApp / E-mail). Reutilizado por fresh.ts e setup.ts.
 */

import { NOTIFICATION_TEMPLATE_DEFAULTS } from "../services/notification/NotificationTemplateDefaults";

type Execable = { execute: (sql: string, params?: any[]) => Promise<any> };

export async function seedNotificationTemplates(conn: Execable): Promise<number> {
  let inserted = 0;
  for (const t of NOTIFICATION_TEMPLATE_DEFAULTS) {
    const [rows]: any = await conn.execute(
      "SELECT id FROM notification_templates WHERE event_type = ? AND channel = ? AND language = 'pt' LIMIT 1",
      [t.event_type, t.channel]
    );
    if (rows.length) continue;
    await conn.execute(
      "INSERT INTO notification_templates (event_type, channel, language, offset_days, subject, body, enabled) VALUES (?, ?, 'pt', NULL, ?, ?, ?)",
      [t.event_type, t.channel, t.subject ?? null, t.body, t.enabled]
    );
    inserted++;
  }
  return inserted;
}
