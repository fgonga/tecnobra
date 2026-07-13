/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Faturação eletrónica via Cegid Vendus (Fase 1: emissão manual pela UI).
 *  Fluxo: encomenda paga/concluída -> admin emite (FR/FT) OU conecta um documento
 *  já emitido no Vendus/outro software. Cada documento é persistido em `invoices`
 *  e a encomenda aponta para o documento ativo via `orders.invoice_id`.
 */

import { db } from "../db/db";
import { config } from "../config/env";
import { createVendusClient, type VendusClient } from "../lib/vendus";
import { configCache } from "./ConfigCache";
import { InvoiceModel } from "../models/invoice.model";
import { OrderModel } from "../models/order.model";
import { CourseModel } from "../models/course.model";
import type { Config } from "../models/config.model";
import { ValidationError } from "../exceptions/ValidationError";

// Só estes tipos de documento podem ser conectados a uma venda (fatura / fatura-recibo).
const CONNECTABLE_TYPES = ["FR", "FT"];

// Documentos pagos "no ato" — o Vendus exige o array `payments` (erro A001 se faltar).
const PAID_ON_SPOT_TYPES = ["FR", "RG", "FS"];

/**
 * Compõe as Observações (campo `notes`) do documento fiscal com o contexto da
 * encomenda: curso, quantidade e a lista de estudantes (nome + email/telefone).
 * Mantemos `external_reference` para o código da encomenda (curto, indexável) e
 * usamos as Observações para a informação descritiva que o cliente vê no PDF.
 */
const PAYMENT_TYPE_LABELS: Record<string, string> = {
  express: "Express",
  aexpress: "Express",
  qr: "QR Code",
  ref: "Referência",
};

function composeInvoiceNotes(
  order: any,
  course: any,
  customers: any[],
  payment?: any,
  extra?: string,
): string {
  const lines: string[] = [];
  lines.push(`Encomenda: ${order.code}`);
  if (course?.name) lines.push(`Curso: ${course.name}`);
  lines.push(`Quantidade: ${order.quantity || 1}`);

  if (payment?.code) {
    const label = PAYMENT_TYPE_LABELS[payment.payment_type] || "Pagamento";
    lines.push(`Pagamento: ${payment.code} (${label})`);
  }

  const students = (customers || []).filter((c) => c?.name || c?.email);
  if (students.length) {
    lines.push(students.length > 1 ? "Estudantes:" : "Estudante:");
    for (const s of students) {
      const contact = [s.email, s.phone].filter(Boolean).join(" · ");
      lines.push(`  - ${s.name || "—"}${contact ? ` (${contact})` : ""}`);
    }
  }

  const note = (extra || "").trim();
  if (note) lines.push("", note);

  return lines.join("\n");
}

interface EmitOptions {
  type?: string; // FR, FT, ... (default da config)
  client?: {
    // dados do cliente (novo ou avulso)
    fiscal_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    id?: number; // cliente Vendus existente
  };
  notes?: string;
  send_email?: boolean;
}

export class InvoiceService {
  /** Cliente Vendus com o modo (tests/normal) vindo das settings fiscais (DB). */
  private static async vendus(): Promise<{
    client: VendusClient;
    cfg: Config;
  }> {
    const cfg = (await configCache.get()) as Config;
    const client = createVendusClient({
      apiKey: config.vendus.apiKey,
      baseUrl: config.vendus.apiUrl,
      registerId: config.vendus.registerId || undefined,
      mode: cfg.invoice_mode === "tests" ? "tests" : "normal",
    });
    return { client, cfg };
  }

  /** Encomendas elegíveis para faturar: pagas/concluídas e ainda sem documento. */
  static async pendingOrders(query: any = {}) {
    const page = parseInt(String(query.page || 1), 10) || 1;
    const paid_at_from = query.paid_at_from || null;
    const paid_at_to = query.paid_at_to || null;
    const perPage = parseInt(String(query.perPage || 10), 10) || 10;
    const offset = (page - 1) * perPage;
    const search = query.search ? `%${query.search}%` : null;

    const where = [`o.status IN ('paid','completed')`, `o.invoice_id IS NULL`];
    const params: any[] = [];
    if (search) {
      where.push(
        `(o.code LIKE ? OR EXISTS (SELECT 1 FROM order_customers oc WHERE oc.order_id = o.id AND oc.name LIKE ?))`,
      );
      params.push(search, search);
    }
    if (paid_at_from) {
      where.push("DATE(o.paid_at) >= ? and DATE(o.paid_at) <= ?");
      params.push(paid_at_from, paid_at_to);
    }
    const whereSQL = `WHERE ${where.join(" AND ")}`;

    const [[{ total }]]: any = await db.query(
      `SELECT COUNT(*) AS total FROM orders o ${whereSQL}`,
      params,
    );
    const [rows]: any = await db.query(
      `SELECT o.id, o.code, o.status, o.amount_due, o.amount_paid, o.quantity,
                    o.paid_at, o.course_id,
                    c.name AS course_name,
                    c.price AS course_price,
                    (SELECT oc.name  FROM order_customers oc WHERE oc.order_id = o.id LIMIT 1) AS customer_name,
                    (SELECT oc.email FROM order_customers oc WHERE oc.order_id = o.id LIMIT 1) AS customer_email,
                    (SELECT oc.phone FROM order_customers oc WHERE oc.order_id = o.id LIMIT 1) AS customer_phone,
                    (SELECT p.payment_type FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS payment_type,
                    (SELECT p.code FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS payment_code
             FROM orders o
             LEFT JOIN courses c ON c.id = o.course_id
             ${whereSQL}
             ORDER BY o.paid_at DESC, o.id DESC
             LIMIT ? OFFSET ?`,
      [...params, perPage, offset],
    );
    return {
      success: true,
      data: rows,
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.ceil(total / perPage),
    };
  }

  /** Listagem paginada de documentos emitidos/conectados, com dados do pedido e pagamento. */
  static async list(query: any = {}) {
    const result: any = await InvoiceModel.paginate({
      ...query,
      searchable: ["number", "external_id", "external_reference", "type"],
      with: ["order"],
    });

    const rows: any[] = result.data || [];
    const orderIds = [...new Set(rows.map((r) => r.order?.id).filter(Boolean))];
    if (orderIds.length) {
      // Curso de cada encomenda
      const [courses]: any = await db.query(
        `SELECT o.id AS order_id, c.name AS course_name
                   FROM orders o LEFT JOIN courses c ON c.id = o.course_id
                  WHERE o.id IN (?)`,
        [orderIds],
      );
      const courseByOrder = new Map(
        courses.map((c: any) => [c.order_id, c.course_name]),
      );

      // Último pagamento de cada encomenda
      const [payments]: any = await db.query(
        `SELECT p.order_id, p.code, p.payment_type, p.amount, p.paid_at, p.status
                   FROM payments p
                  WHERE p.id IN (SELECT MAX(id) FROM payments WHERE order_id IN (?) GROUP BY order_id)`,
        [orderIds],
      );
      const payByOrder = new Map(payments.map((p: any) => [p.order_id, p]));

      // Nota de crédito ativa por encomenda (para mostrar na tab Faturas)
      const [creditNotes]: any = await db.query(
        `SELECT id, order_id, number, external_id, status, amount
                   FROM invoices
                  WHERE type = 'NC' AND status <> 'A' AND order_id IN (?)`,
        [orderIds],
      );
      const ncByOrder = new Map(creditNotes.map((n: any) => [n.order_id, n]));

      for (const inv of rows) {
        if (!inv.order) continue;
        inv.order.course_name = courseByOrder.get(inv.order.id) ?? null;
        inv.order.payment = payByOrder.get(inv.order.id) ?? null;
        if (inv.type !== "NC")
          inv.credit_note = ncByOrder.get(inv.order.id) ?? null;
      }
    }
    return result;
  }

  /** Emite um documento fiscal no Vendus para uma encomenda. */
  static async emitForOrder(
    orderId: number,
    opts: EmitOptions = {},
    userId?: number,
  ) {
    const order = await OrderModel.findOneBy("id", orderId);
    if (!order) throw new ValidationError("Encomenda não encontrada.", 404);
    if (!["paid", "completed"].includes(order.status))
      throw new ValidationError(
        "Só é possível faturar encomendas pagas ou concluídas.",
        422,
      );
    if (order.invoice_id)
      throw new ValidationError(
        "Esta encomenda já tem um documento associado.",
        422,
      );

    const { client, cfg } = await this.vendus();
    const customers = await OrderModel.customers(order, db);
    const course = order.course_id
      ? await CourseModel.findOneBy("id", order.course_id)
      : null;
    const cust = customers?.[0] || {};
    const [[payment]]: any = await db.query(
      `SELECT code, payment_type FROM payments
             WHERE order_id = ? AND (status = 'paid' OR is_paid = 1)
             ORDER BY id DESC LIMIT 1`,
      [order.id],
    );

    const type = opts.type || cfg.invoice_default_type || "FR";
    const qty = order.quantity || 1;
    const grossPrice = Number(course?.price ?? order.amount_due);
    const grossTotal = Number((grossPrice * qty).toFixed(2));
    // Valor efetivamente pago (já com cupão/promoção/cartão). O documento tem
    // de bater certo com o que o cliente pagou.
    const amountPaid = Number(order.amount_paid ?? grossTotal);
    // Desconto a aplicar na LINHA para que o líquido iguale o valor pago.
    const discountValue = Number((grossTotal - amountPaid).toFixed(2));

    const item: any = {
      qty,
      title: course?.name || `Encomenda ${order.code}`,
      gross_price: grossPrice,
      tax_id: cfg.invoice_tax_id || "NOR",
    };
    // Reflete o desconto na linha (percentual), de modo a que o total do
    // documento Vendus = valor efetivamente pago pelo cliente.
    if (discountValue > 0 && grossTotal > 0) {
      item.discount_percentage = ((discountValue / grossTotal) * 100).toFixed(
        2,
      );
    }
    if (course?.vendus_product_id) item.reference = course.vendus_product_id;
    if (cfg.invoice_tax_id === "ISE" && cfg.invoice_tax_exemption)
      item.tax_exemption = cfg.invoice_tax_exemption;

    const clientInfo: any = {
      name: opts.client?.name || cust.name || "Consumidor Final",
      country: opts.client?.country || "AO",
    };
    if (opts.client?.id) clientInfo.id = opts.client.id;
    if (opts.client?.fiscal_id) clientInfo.fiscal_id = opts.client.fiscal_id;
    const email = opts.client?.email || cust.email;
    if (email) clientInfo.email = email;
    const phone = opts.client?.phone || cust.phone;
    if (phone) clientInfo.phone = phone;
    const sendEmail = opts.send_email ?? !!cfg.invoice_auto_send_email;
    if (sendEmail && email) clientInfo.send_email = "yes";

    const docInput: any = {
      type: type as any,
      external_reference: order.code,
      notes: composeInvoiceNotes(order, course, customers, payment, opts.notes),
      client: clientInfo,
      items: [item],
    };

    // Documentos pagos no ato (FR/RG/FS) exigem o pagamento registado. Usa o
    // método Vendus mapeado ao tipo de pagamento da encomenda (ou o default).
    if (PAID_ON_SPOT_TYPES.includes(type)) {
      const methodId = await this.resolveVendusPaymentMethod(
        payment?.payment_type,
        client,
      );
      if (methodId) {
        // Paga-se o valor efetivamente pago (com desconto), não o bruto.
        docInput.payments = [{ id: methodId, amount: amountPaid }];
      }
    }

    const doc: any = await client.documents.create(docInput);

    const invoice = await this.persistDocument(order, doc, {
      connected: false,
      userId,
      mode: cfg.invoice_mode,
    });
    return invoice;
  }

  /**
   * Conecta um documento JÁ EXISTENTE a uma encomenda.
   * - provider 'vendus' + vendusId: busca os detalhes no Vendus e persiste.
   * - provider 'other': liga por referência manual (id/número de outro software).
   */
  static async connectExisting(
    orderId: number,
    payload: {
      provider?: string;
      vendusId?: number;
      external_id?: string;
      number?: string;
      type?: string;
      amount?: number;
    },
    userId?: number,
  ) {
    const order = await OrderModel.findOneBy("id", orderId);
    if (!order) throw new ValidationError("Encomenda não encontrada.", 404);
    if (order.invoice_id)
      throw new ValidationError(
        "Esta encomenda já tem um documento associado.",
        422,
      );

    const provider = payload.provider || "vendus";
    let invoice;

    if (provider === "vendus") {
      if (!payload.vendusId)
        throw new ValidationError(
          "Indique o documento do Vendus a conectar.",
          422,
        );
      const { client, cfg } = await this.vendus();
      const doc: any = await client.documents.get(payload.vendusId);
      if (doc?.type && !CONNECTABLE_TYPES.includes(doc.type))
        throw new ValidationError(
          "Só é possível conectar Faturas (FT) ou Faturas-Recibo (FR).",
          422,
        );
      invoice = await this.persistDocument(order, doc, {
        connected: true,
        userId,
        mode: cfg.invoice_mode,
      });
    } else {
      // Documento de outro software — sem busca, ligação manual
      const localId = (
        await InvoiceModel.create({
          order_id: order.id,
          provider,
          external_id: payload.external_id || null,
          type: payload.type || "FT",
          number: payload.number || null,
          amount: Number(payload.amount ?? order.amount_due),
          status: "N",
          mode: "normal",
          external_reference: order.code,
          connected: 1,
          created_by: userId ?? null,
        })
      ).id;
      await OrderModel.update(order.id, { invoice_id: localId });
      invoice = await InvoiceModel.findOneBy("id", localId);
    }
    return invoice;
  }

  /** Persiste um VendusDocument na tabela invoices e liga à encomenda. */
  private static async persistDocument(
    order: any,
    doc: any,
    opts: { connected: boolean; userId?: number; mode?: string },
  ) {
    const localId = (
      await InvoiceModel.create({
        order_id: order.id,
        provider: "vendus",
        external_id: String(doc.id),
        type: doc.type || "FR",
        number: doc.number || null,
        atcud: doc.atcud || null,
        hash: doc.hash || null,
        amount: Number(doc.amount_gross ?? order.amount_due),
        status: doc.status || "N",
        mode: opts.mode || "normal",
        external_reference: order.code,
        connected: opts.connected ? 1 : 0,
        created_by: opts.userId ?? null,
      })
    ).id;

    await OrderModel.update(order.id, { invoice_id: localId });
    return await InvoiceModel.findOneBy("id", localId);
  }

  /**
   * Emite uma Nota de Crédito (NC) no Vendus para uma encomenda devolvida,
   * referenciando o documento original (FR/FT). Persiste como invoice tipo NC
   * ligada à encomenda (sem alterar o invoice_id principal). Idempotente: se já
   * houver NC ativa para a encomenda, devolve-a. Devolve null se não houver
   * documento original para creditar (ex.: encomenda nunca faturada).
   */
  static async emitCreditNoteForOrder(
    orderId: number,
    opts: { reason?: string; userId?: number } = {},
  ) {
    // Documento original ativo a creditar (fatura / fatura-recibo emitida por nós)
    const [[orig]]: any = await db.query(
      `SELECT * FROM invoices
              WHERE order_id = ? AND provider = 'vendus' AND type IN ('FR','FT')
                AND status <> 'A' AND external_id IS NOT NULL
              ORDER BY id DESC LIMIT 1`,
      [orderId],
    );
    if (!orig || !orig.number) return null;
    return await this.emitCreditNoteForInvoice(orig, opts);
  }

  /**
   * Emite uma NC no Vendus referenciando um documento original específico (FR/FT)
   * e persiste-a ligada à mesma encomenda. Idempotente por encomenda.
   */
  static async emitCreditNoteForInvoice(
    orig: any,
    opts: { reason?: string; userId?: number } = {},
  ) {
    if (!orig?.number)
      throw new ValidationError(
        "Documento original sem número para creditar.",
        422,
      );
    const order = await OrderModel.findOneBy("id", orig.order_id);
    if (!order) throw new ValidationError("Encomenda não encontrada.", 404);

    // Idempotência: NC já existente para a encomenda
    const [[existingNC]]: any = await db.query(
      `SELECT * FROM invoices WHERE order_id = ? AND type = 'NC' AND status <> 'A' ORDER BY id DESC LIMIT 1`,
      [order.id],
    );
    if (existingNC) return existingNC;

    const { client, cfg } = await this.vendus();
    const customers = await OrderModel.customers(order, db);
    const cust = customers?.[0] || {};

    // A NC tem de referenciar as linhas do documento original pelo seu `id`.
    // Buscamos os items reais do documento no Vendus (não os ad-hoc da emissão).
    const original: any = await client.documents.get(Number(orig.external_id));
    const origItems: any[] = Array.isArray(original?.items)
      ? original.items
      : [];
    if (!origItems.length)
      throw new ValidationError(
        "Não foi possível obter as linhas do documento original para creditar.",
        422,
      );

    const items = origItems.map((it: any, i: number) => {
      const line: any = {
        id: it.id,
        qty: it.qty_nc ?? it.qty ?? 1,
        reference_document: {
          document_number: orig.number,
          document_row: i + 1,
        },
      };
      if (it.tax?.id) line.tax_id = it.tax.id;
      if (it.amounts?.gross_unit != null)
        line.gross_price = Number(it.amounts.gross_unit);
      return line;
    });

    const clientInfo: any = {
      name: cust.name || "Consumidor Final",
      country: "AO",
    };
    if (cust.email) clientInfo.email = cust.email;
    if (cust.phone) clientInfo.phone = cust.phone;

    const doc: any = await client.documents.create({
      type: "NC" as any,
      external_reference: order.code,
      notes: opts.reason
        ? `Nota de crédito — ${order.code}: ${opts.reason}`
        : `Nota de crédito da encomenda ${order.code}`,
      client: clientInfo,
      items,
    });

    const localId = (
      await InvoiceModel.create({
        order_id: order.id,
        provider: "vendus",
        external_id: String(doc.id),
        type: doc.type || "NC",
        number: doc.number || null,
        atcud: doc.atcud || null,
        hash: doc.hash || null,
        amount: Number(doc.amount_gross ?? orig.amount ?? 0),
        status: doc.status || "N",
        mode: cfg.invoice_mode,
        external_reference: order.code,
        connected: 0,
        created_by: opts.userId ?? null,
      })
    ).id;
    return await InvoiceModel.findOneBy("id", localId);
  }

  /**
   * Anula um documento. Para FR/FT certificadas no Vendus, anular = emitir uma
   * Nota de Crédito (não se "apaga" um documento certificado). Para os restantes
   * (proforma, etc.) faz a anulação direta (status A) no Vendus.
   */
  static async cancel(invoiceId: number, reason?: string, userId?: number) {
    const invoice = await InvoiceModel.findOneBy("id", invoiceId);
    if (!invoice) throw new ValidationError("Documento não encontrado.", 404);
    if (invoice.status === "A")
      throw new ValidationError("Documento já está anulado.", 422);
    if (invoice.type === "NC")
      throw new ValidationError(
        "Uma nota de crédito não pode ser anulada por aqui.",
        422,
      );

    let creditNote: any = null;
    if (
      invoice.provider === "vendus" &&
      invoice.external_id &&
      ["FR", "FT"].includes(invoice.type)
    ) {
      // Documento de venda certificado: a anulação fiscal é a Nota de Crédito.
      creditNote = await this.emitCreditNoteForInvoice(invoice, {
        reason,
        userId,
      });
    } else if (invoice.provider === "vendus" && invoice.external_id) {
      const { client } = await this.vendus();
      await client.documents.cancel(Number(invoice.external_id), reason);
    }

    await InvoiceModel.update(invoiceId, { status: "A" });
    // Liberta a encomenda para nova emissão
    await db.execute(
      `UPDATE orders SET invoice_id = NULL WHERE invoice_id = ?`,
      [invoiceId],
    );
    const updated = await InvoiceModel.findOneBy("id", invoiceId);
    return { ...updated, credit_note: creditNote };
  }

  /**
   * URL do PDF do documento. O PDF é servido pelo backoffice do tenant
   * (ex.: https://acme.vendus.co.ao/app/office/pdf/...), autenticado pela
   * sessão do browser do admin — não pela API key. Por isso devolvemos o
   * link e é o browser que o abre (não há proxy possível pelo servidor).
   */
  static async pdfUrl(invoiceId: number): Promise<string | null> {
    const invoice = await InvoiceModel.findOneBy("id", invoiceId);
    if (!invoice) throw new ValidationError("Documento não encontrado.", 404);
    if (invoice.provider !== "vendus" || !invoice.external_id) return null;
    const office = config.vendus.officeUrl;
    if (!office)
      throw new ValidationError(
        "Backoffice do Vendus não configurado (VENDUS_OFFICE_URL).",
        422,
      );
    const name = String(invoice.number || invoice.external_id).replace(
      /[^\w.-]+/g,
      "_",
    );
    return `${office}/app/office/pdf/id/${invoice.external_id}/name/${name}/save/1/`;
  }

  /**
   * Pesquisa documentos já emitidos no Vendus (modal "Conectar").
   * `q` é texto livre — cobre o código do documento (ex: "FT 01P2026/21") e o
   * nome do cliente. `view: "detailed"` traz os dados do cliente para a tabela.
   */
  static async searchVendus(params: any = {}) {
    const { client } = await this.vendus();
    return await client.documents.list({
      q: params.q || params.number || undefined,
      client_fiscal_id: params.fiscal_id || undefined,
      // Só faturas (FT) e faturas-recibo (FR) podem ser conectadas a uma venda.
      type: params.type || CONNECTABLE_TYPES.join(","),
      view: "detailed",
    } as any);
  }

  /** Pesquisa clientes no Vendus (para o picker de cliente). */
  static async searchClients(params: any = {}) {
    const { client } = await this.vendus();
    if (params.fiscal_id) {
      const found = await client.clients.findByFiscalId(params.fiscal_id);
      return found ? [found] : [];
    }
    return await client.clients.list({ q: params.q } as any);
  }

  /** Pesquisa produtos no Vendus (para a tab "Cursos"). */
  static async searchProducts(params: any = {}) {
    const { client } = await this.vendus();
    return await client.products.list({ q: params.q } as any);
  }

  /** Liga um curso a um produto do catálogo Vendus (guarda id + nome do produto). */
  static async connectCourseProduct(
    courseId: number,
    vendusProductId: string | null,
    vendusProductName: string | null = null,
  ) {
    const course = await CourseModel.findOneBy("id", courseId);
    if (!course) throw new ValidationError("Curso não encontrado.", 404);
    await CourseModel.update(courseId, {
      vendus_product_id: vendusProductId,
      vendus_product_name: vendusProductId ? vendusProductName : null,
    });
    return await CourseModel.findOneBy("id", courseId);
  }

  /** Lista cursos com o estado de ligação ao Vendus (para a tab "Cursos"). */
  static async coursesForMapping() {
    const [rows]: any = await db.query(
      `SELECT id, name, slug, price, product_id, vendus_product_id, vendus_product_name FROM courses ORDER BY name ASC`,
    );
    return rows;
  }

  /** Lista os métodos de pagamento locais + estado de ligação ao Vendus (tab "Métodos de pagamento"). */
  static async paymentMethodsForMapping() {
    const [rows]: any = await db.query(
      `SELECT id, local_key, label, vendus_id, vendus_name FROM payment_method_maps ORDER BY id ASC`,
    );
    return rows;
  }

  /** Métodos de pagamento configurados na conta Vendus (para o picker). */
  static async vendusPaymentMethods() {
    const { client } = await this.vendus();
    return await client.paymentMethods.list();
  }

  /** Cria um método de pagamento na conta Vendus. */
  static async createVendusPaymentMethod(input: {
    title?: string;
    type?: string;
  }) {
    const title = (input.title || "").trim();
    const type = (input.type || "").trim();
    if (!title)
      throw new ValidationError("Indique o nome do método de pagamento.", 422);
    if (!type)
      throw new ValidationError("Indique o tipo do método de pagamento.", 422);
    const { client } = await this.vendus();
    return await client.paymentMethods.create({ title, type: type as any });
  }

  /** Liga um método local a um método de pagamento do Vendus (guarda id + nome). */
  static async connectPaymentMethod(
    localKey: string,
    vendusId: string | null,
    vendusName: string | null = null,
  ) {
    const [res]: any = await db.execute(
      `UPDATE payment_method_maps SET vendus_id = ?, vendus_name = ? WHERE local_key = ?`,
      [vendusId, vendusId ? vendusName : null, localKey],
    );
    if (!res.affectedRows)
      throw new ValidationError("Método de pagamento desconhecido.", 404);
    const [[row]]: any = await db.query(
      `SELECT id, local_key, label, vendus_id, vendus_name FROM payment_method_maps WHERE local_key = ?`,
      [localKey],
    );
    return row;
  }

  /**
   * Resolve o id do método de pagamento Vendus para uma encomenda:
   * 1) método mapeado ao tipo de pagamento local; senão 2) o default da conta Vendus.
   */
  private static async resolveVendusPaymentMethod(
    localKey?: string,
    client?: VendusClient,
  ): Promise<string | number | null> {
    if (localKey) {
      const [[row]]: any = await db.query(
        `SELECT vendus_id FROM payment_method_maps WHERE local_key = ? AND vendus_id IS NOT NULL`,
        [localKey],
      );
      if (row?.vendus_id) return row.vendus_id;
    }
    const c = client || (await this.vendus()).client;
    const def = await c.paymentMethods.getDefault();
    return def?.id ?? null;
  }
}
