/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Monta a árvore de variáveis ({{customer.*}}, {{order.*}}, {{payment.*}},
 *  {{course.*}}, {{checkout.*}}, {{brand.*}}) a partir de um contexto mínimo
 *  (código de pagamento ou de encomenda), juntando payments → orders →
 *  order_customers → courses.
 */

import dayjs from "dayjs";
import { db } from "../../db/db";
import toMoney from "../../utils/money";

const BRAND = {
  name: "Academia Treesix",
  phone: "",
  email: "",
  website: "https://www.academiatreesix.com",
};

const CHECKOUT_BASE = "https://checkout.academiatreesix.com/cart";
const COURSE_LOGIN_URL = "https://www.academiatreesix.com/users/sign_in";

export type NotificationContext = {
  paymentCode?: string;
  orderCode?: string;
  phone?: string;
};

export class VariablePayloadBuilder {
  static async build(ctx: NotificationContext): Promise<{ vars: Record<string, any>; phone: string | null }> {
    let order: any = null;
    let payment: any = null;

    if (ctx.paymentCode) {
      const [pr]: any = await db.execute("SELECT * FROM payments WHERE code = ? LIMIT 1", [ctx.paymentCode]);
      payment = pr[0] || null;
      if (payment) {
        const [or]: any = await db.execute("SELECT * FROM orders WHERE id = ? LIMIT 1", [payment.order_id]);
        order = or[0] || null;
      }
    } else if (ctx.orderCode) {
      const [or]: any = await db.execute("SELECT * FROM orders WHERE code = ? LIMIT 1", [ctx.orderCode]);
      order = or[0] || null;
      if (order) {
        const [pr]: any = await db.execute(
          "SELECT * FROM payments WHERE order_id = ? ORDER BY id ASC LIMIT 1",
          [order.id]
        );
        payment = pr[0] || null;
      }
    }

    let customer: any = null;
    let course: any = null;
    if (order) {
      const [cr]: any = await db.execute(
        "SELECT name, email, phone FROM order_customers WHERE order_id = ? ORDER BY id ASC LIMIT 1",
        [order.id]
      );
      customer = cr[0] || null;
      if (order.course_id) {
        const [crs]: any = await db.execute("SELECT name FROM courses WHERE id = ? LIMIT 1", [order.course_id]);
        course = crs[0] || null;
      }
    }

    const phone = ctx.phone || customer?.phone || payment?.phone || null;
    const firstName = (customer?.name || "").trim().split(/\s+/)[0] || "";

    // Dados da referência Multicaixa (guardados em payments.response como JSON).
    let refEntity = "";
    if (payment?.response) {
      try {
        const parsed = typeof payment.response === "string" ? JSON.parse(payment.response) : payment.response;
        refEntity = parsed?.reference?.entity ?? "";
      } catch { /* response inválido/ausente — ignora */ }
    }

    const vars = {
      brand: BRAND,
      customer: {
        name: customer?.name || "",
        first_name: firstName,
        email: customer?.email || "",
        phone: customer?.phone || "",
      },
      order: {
        code: order?.code || "",
        amount: order ? toMoney(order.subtotal ?? order.amount_due ?? 0) : "",
      },
      payment: {
        amount: payment ? toMoney(payment.amount ?? 0) : "",
        method: payment?.payment_type || "",
        reference: payment?.code || "",
        // Referência Multicaixa (número pesquisável + entidade + validade)
        reference_number: payment?.reference || "",
        entity: refEntity,
        expiry: payment?.expired_at ? dayjs(payment.expired_at).format("DD/MM/YYYY HH:mm") : "",
        date: payment?.paid_at || "",
      },
      course: {
        name: course?.name || "",
        url: COURSE_LOGIN_URL,
      },
      checkout: {
        url: order?.code ? `${CHECKOUT_BASE}/${order.code}` : CHECKOUT_BASE,
      },
    };

    return { vars, phone };
  }
}
