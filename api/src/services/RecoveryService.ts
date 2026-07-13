import { db } from "../db/db";
import toMoney from "../utils/money";
import { AppLogger } from "../logger/AppLogger";
import { notificationQueue } from "../queues";

const CHECKOUT_BASE = "https://checkout.academiatreesix.com/cart";

export class RecoveryService {
  static async stats(start?: string, end?: string) {
    const s =
      start ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const e = end ?? new Date().toISOString().slice(0, 10);

    // Funil de encomendas
    const [funnelRows]: any = await db.execute(
      `SELECT
               COUNT(*)                      AS total,
               SUM(status = 'completed')     AS completed,
               SUM(status = 'canceled')      AS canceled,
               SUM(status = 'pending')       AS pending,
               SUM(status = 'refunded')      AS refunded
             FROM orders
             WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`,
      [s, e],
    );
    const f = funnelRows[0] ?? {};
    const total = Number(f.total ?? 0);
    const completed = Number(f.completed ?? 0);
    const canceled = Number(f.canceled ?? 0);
    const pending = Number(f.pending ?? 0);
    const refunded = Number(f.refunded ?? 0);
    const conversionRate =
      total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

    // Recuperação via painel admin (orders.recovery_notified_at)
    const [recSentRows]: any = await db.execute(
      `SELECT COUNT(*) AS total FROM orders
             WHERE DATE(recovery_notified_at) >= ? AND DATE(recovery_notified_at) <= ?`,
      [s, e],
    );
    const [recRecovRows]: any = await db.execute(
      `SELECT COUNT(*) AS total, COALESCE(SUM(subtotal), 0) AS value
             FROM orders
             WHERE DATE(recovery_notified_at) >= ? AND DATE(recovery_notified_at) <= ?
               AND status = 'completed'`,
      [s, e],
    );
    const recoverySent = Number(recSentRows[0]?.total ?? 0);
    const recoveryRecovered = Number(recRecovRows[0]?.total ?? 0);
    const recoveryValue = Number(recRecovRows[0]?.value ?? 0);
    const recoveryRate =
      recoverySent > 0
        ? parseFloat(((recoveryRecovered / recoverySent) * 100).toFixed(1))
        : 0;

    // Recuperação de carrinhos abandonados (orders.abandoned_notified_at)
    const [abSentRows]: any = await db.execute(
      `SELECT COUNT(*) AS total FROM orders
             WHERE DATE(abandoned_notified_at) >= ? AND DATE(abandoned_notified_at) <= ?`,
      [s, e],
    );
    const [abRecovRows]: any = await db.execute(
      `SELECT COUNT(*) AS total, COALESCE(SUM(subtotal), 0) AS value
             FROM orders
             WHERE DATE(abandoned_notified_at) >= ? AND DATE(abandoned_notified_at) <= ?
               AND status = 'completed'`,
      [s, e],
    );
    const abandonedSent = Number(abSentRows[0]?.total ?? 0);
    const abandonedRecovered = Number(abRecovRows[0]?.total ?? 0);
    const abandonedValue = Number(abRecovRows[0]?.value ?? 0);
    const abandonedRate =
      abandonedSent > 0
        ? parseFloat(((abandonedRecovered / abandonedSent) * 100).toFixed(1))
        : 0;

    // Por recuperar (canceladas/pendentes sem notificação no período)
    const [pendingRecovRows]: any = await db.execute(
      `SELECT COUNT(*) AS total FROM orders
             WHERE status IN ('canceled', 'pending')
               AND DATE(created_at) >= ? AND DATE(created_at) <= ?
               AND recovery_notified_at IS NULL`,
      [s, e],
    );
    const pendingRecovery = Number(pendingRecovRows[0]?.total ?? 0);

    return {
      total,
      completed,
      canceled,
      pending,
      refunded,
      conversionRate,
      recoverySent,
      recoveryRecovered,
      recoveryRate,
      recoveryValue,
      abandonedSent,
      abandonedRecovered,
      abandonedRate,
      abandonedValue,
      pendingRecovery,
    };
  }

  static async recoverableOrders(filters: {
    start?: string;
    end?: string;
    status?: string;
    search?: string;
    page?: number;
    perPage?: number;
  }) {
    const { start, end, status, search } = filters;
    const page = Math.max(1, Number(filters.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(filters.perPage ?? 20)));
    const offset = (page - 1) * perPage;

    const conditions: string[] = ["o.status IN ('canceled','pending')"];
    const params: any[] = [];

    if (start) {
      conditions.push("DATE(o.created_at) >= ?");
      params.push(start);
    }
    if (end) {
      conditions.push("DATE(o.created_at) <= ?");
      params.push(end);
    }
    if (status && ["canceled", "pending"].includes(status)) {
      conditions.push("o.status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push("(o.code LIKE ? OR oc.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = "WHERE " + conditions.join(" AND ");

    const [countRows]: any = await db.execute(
      `SELECT COUNT(*) AS total
             FROM orders o
             LEFT JOIN order_customers oc ON oc.order_id = o.id
             ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows]: any = await db.execute(
      `SELECT o.id, o.code, o.status, o.subtotal, o.amount_due,
                    o.created_at, o.recovery_notified_at, o.abandoned_notified_at,
                    oc.name AS customer_name, oc.phone AS customer_phone,
                    c.name AS course_name
             FROM orders o
             LEFT JOIN order_customers oc ON oc.order_id = o.id
             LEFT JOIN courses c ON c.id = o.course_id
             ${where}
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
      [...params, perPage, offset],
    );

    return { data: rows, total, page, perPage };
  }

  static async sendRecovery(orderIds: number[], messageTemplate: string) {
    await this.ensureColumn();

    let sent = 0;
    let failed = 0;

    for (const id of orderIds) {
      try {
        const [orderRows]: any = await db.execute(
          `SELECT o.id, o.code, o.subtotal,
                            oc.name AS customer_name, oc.phone AS customer_phone
                     FROM orders o
                     LEFT JOIN order_customers oc ON oc.order_id = o.id
                     WHERE o.id = ?
                     LIMIT 1`,
          [id],
        );
        const order = orderRows[0];
        if (!order?.customer_phone) {
          failed++;
          continue;
        }

        const firstName = (order.customer_name || "Cliente").split(" ")[0];
        const link = `${CHECKOUT_BASE}/${order.code}`;
        const valor = `${toMoney(order.subtotal ?? 0)} Kz`;

        const message = messageTemplate
          .replace(/\{nome\}/g, firstName)
          .replace(/\{codigo\}/g, order.code)
          .replace(/\{link\}/g, link)
          .replace(/\{valor\}/g, valor);

        const phone = String(order.customer_phone)
          .replace(/\s/g, "")
          .replace(/^00/, "");
        const smsPhone = phone.startsWith("244") ? phone : `244${phone}`;

        await notificationQueue.add("notification", { to: smsPhone, message, eventType: "CartRecovery", orderCode: order.code });

        await db.execute(
          `UPDATE orders SET recovery_notified_at = NOW() WHERE id = ?`,
          [id],
        );
        sent++;
      } catch (err) {
        AppLogger.error(`RecoveryService.sendRecovery order ${id}`, err);
        failed++;
      }
    }

    return { sent, failed };
  }
}
