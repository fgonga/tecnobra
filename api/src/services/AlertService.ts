/*
 *  Tecnobra — Criação de alertas + notificação de supervisores.
 *
 *  Supervisores = responsável da obra (users.id em obras.responsavel_user_id)
 *  e, na falta dele, os superadmins. A notificação segue pela fila
 *  "notification" com o telefone/email explícitos no contexto.
 */

import { db } from "../db/db";
import { notificationQueue } from "../queues";

export type AlertTipo = "ferramenta_nao_devolvida" | "stock_baixo" | "visitante_nao_saiu" | "outro";

export class AlertService {
  static async create(input: {
    obra_id: number;
    tipo: AlertTipo;
    mensagem: string;
    referencia_tipo?: string | null;
    referencia_id?: number | null;
  }): Promise<number> {
    const [result]: any = await db.execute(
      `INSERT INTO alertas (obra_id, tipo, referencia_tipo, referencia_id, mensagem)
       VALUES (?, ?, ?, ?, ?)`,
      [input.obra_id, input.tipo, input.referencia_tipo ?? null, input.referencia_id ?? null, input.mensagem]
    );
    return result.insertId;
  }

  /** Evita alertas duplicados abertos para a mesma referência. */
  static async existsOpen(obraId: number, tipo: AlertTipo, referenciaTipo: string, referenciaId: number): Promise<boolean> {
    const [rows]: any = await db.execute(
      `SELECT id FROM alertas
       WHERE obra_id = ? AND tipo = ? AND referencia_tipo = ? AND referencia_id = ? AND estado = 'aberto'
       LIMIT 1`,
      [obraId, tipo, referenciaTipo, referenciaId]
    );
    return rows.length > 0;
  }

  static async supervisors(obraId: number): Promise<{ id: number; phone: string | null; email: string | null }[]> {
    const [resp]: any = await db.execute(
      `SELECT u.id, u.phone, u.email FROM obras o
       INNER JOIN users u ON u.id = o.responsavel_user_id
       WHERE o.id = ? AND u.status = 1`,
      [obraId]
    );
    if (resp.length) return resp;
    const [admins]: any = await db.execute(
      `SELECT id, phone, email FROM users WHERE role = 'superadmin' AND status = 1`
    );
    return admins;
  }

  /** Notifica os supervisores da obra através dos templates do evento. */
  static async notifySupervisors(eventType: string, obraId: number, context: Record<string, any>): Promise<void> {
    const supervisors = await this.supervisors(obraId);
    for (const s of supervisors) {
      await notificationQueue.add("notification", {
        notify: eventType,
        context: { ...context, obraId, phone: s.phone ?? undefined, email: s.email ?? undefined },
      });
    }
  }
}
