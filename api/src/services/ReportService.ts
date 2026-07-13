/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. All rights reserved.
 *
 *  This software is protected by copyright and is the exclusive property of
 *  Bantu Internet Technologies, Lda. Any unauthorized copying, distribution,
 *  modification or use of this software, in whole or in part, is strictly
 *  prohibited and subject to applicable legal penalties.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 */

import {BaseModel} from "../models/base.model";

export class ReportService {
  private static async getFeeRate(): Promise<number> {
    const [row] = await BaseModel.query<any>(
      `SELECT platform_fee_rate FROM parametrization WHERE id = 1 LIMIT 1`
    );
    return parseFloat(row?.platform_fee_rate ?? 0.02);
  }

  static async report(data: any): Promise<any> {
    switch (data.type) {
      case "day":
        return await this.day(data);
      case "influencer":
        return await this.influencer(data);
      case "influencer_by_course":
        return await this.influencerByCourse(data);
      case "month":
        return await this.month(data);
      case "course":
        return await this.byCourse(data);
      case "dashboard":
        return await this.getDashboard(data);
      case "custom":
        return await this.custom(data);
      case "general":
        return await this.general(data);
      case "payment-type":
        return await this.paymentTypes(data);
      case "messages":
        return await this.messages(data);
      default:
        return [];
    }
  }

  static async custom(data: any): Promise<any> {
    const { start, end, includes = [] } = data || {}

    const filters: string[] = []
    const params: any[] = []

    if (start) {
      filters.push("DATE(paid_at) >= ?")
      params.push(start)
    }

    if (end) {
      filters.push("DATE(paid_at) <= ?")
      params.push(end)
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

    const result: any = {}
    if (includes.includes("resume")) {
      result.resume = await this.day(data)
    }
    /* ===================== ORDERS STATUS ===================== */
    if (includes.includes("ordersStatus")) {
      const orderFilters: string[] = []
      const orderParams: any[] = []

      if (start) {
        orderFilters.push("DATE(created_at) >= ?")
        orderParams.push(start)
      }
      if (end) {
        orderFilters.push("DATE(created_at) <= ?")
        orderParams.push(end)
      }

      const orderWhere = orderFilters.length ? `WHERE ${orderFilters.join(" AND ")}` : ""

      const rows = await BaseModel.query(
          `
      SELECT status, COUNT(*) AS total
      FROM orders
      ${orderWhere}
      GROUP BY status
      `,
          orderParams
      )

      result.ordersStatus = Object.fromEntries(
          rows.map((r: any) => [r.status, Number(r.total)])
      )
    }

    /* ===================== PAYMENTS STATUS (ALL) ===================== */
    if (includes.includes("paymentsStatus")) {
      const statusFilters: string[] = []
      const statusParams: any[] = []

      if (start) {
        statusFilters.push("DATE(created_at) >= ?")
        statusParams.push(start)
      }
      if (end) {
        statusFilters.push("DATE(created_at) <= ?")
        statusParams.push(end)
      }

      const statusWhere = statusFilters.length
          ? `WHERE ${statusFilters.join(" AND ")}`
          : ""

      const rows = await BaseModel.query(
          `
    SELECT status, COUNT(*) AS total
    FROM payments
    ${statusWhere}
    GROUP BY status
    `,
          statusParams
      )

      result.paymentsStatus = Object.fromEntries(
          rows.map((r: any) => [r.status, Number(r.total)])
      )
    }


    /* ===================== PAYMENTS MONEY (PAID ONLY) ===================== */
    if (includes.includes("paymentsMoney")) {
      const [row] = await BaseModel.query(
          `
      SELECT
        COUNT(*) AS qtd,
        COALESCE(SUM(amount), 0) AS total
      FROM payments
      ${where ? `${where} AND status = 'paid'` : "WHERE status = 'paid'"}
      `,
          params
      )

      result.paymentsMoney = {
        qtd: Number(row?.qtd || 0),
        total: Number(row?.total || 0),
      }
    }
    /* ===================== INFLUENCER COMMISSIONS (PAID ONLY) ===================== */
    if (includes.includes("influencerCommissions")) {
      const iFilters: string[] = ["p.status = 'paid'"]
      const iParams: any[] = []

      if (start) {
        iFilters.push("DATE(p.paid_at) >= ?")
        iParams.push(start)
      }

      if (end) {
        iFilters.push("DATE(p.paid_at) <= ?")
        iParams.push(end)
      }

      const iWhere = `WHERE ${iFilters.join(" AND ")}`

      // comissão total (somente onde existe influencer ligado ao cupom)
      const [row] = await BaseModel.query(
          `
      SELECT
        COALESCE(ROUND(SUM(p.amount * (i.commission / 100)), 2), 0) AS total_commission
      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      INNER JOIN influencers i ON i.coupon_id = o.coupon_id
      ${iWhere}
    `,
          iParams
      )

      const totalCommission = Number(row?.total_commission || 0)

      // total recebido (reaproveita se já foi calculado)
      let paidTotal = Number(result?.paymentsMoney?.total || 0)

      // se não pediu paymentsMoney, calcula aqui só o total paid
      if (!includes.includes("paymentsMoney")) {
        const pFilters: string[] = ["status = 'paid'"]
        const pParams: any[] = []

        if (start) {
          pFilters.push("DATE(paid_at) >= ?")
          pParams.push(start)
        }
        if (end) {
          pFilters.push("DATE(paid_at) <= ?")
          pParams.push(end)
        }

        const pWhere = `WHERE ${pFilters.join(" AND ")}`

        const [pRow] = await BaseModel.query(
            `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        ${pWhere}
      `,
            pParams
        )

        paidTotal = Number(pRow?.total || 0)
      }

      const net = Number((paidTotal - totalCommission).toFixed(2))

      result.influencerCommissions = {
        total: totalCommission,
        net,
      }

      // opcional (aditivo): se já existe paymentsMoney, injeta os campos lá também
      if (result.paymentsMoney) {
        result.paymentsMoney.commissions = totalCommission
        result.paymentsMoney.net = net
      }
    }
    /* ===================== COURSES (PAID ONLY) ===================== */
    if (includes.includes("courses")) {
      // where próprio: junta payments+orders (ambas têm paid_at) → qualificar p.paid_at
      const courseFilters: string[] = ["p.status = 'paid'"]
      const courseParams: any[] = []
      if (start) { courseFilters.push("DATE(p.paid_at) >= ?"); courseParams.push(start) }
      if (end)   { courseFilters.push("DATE(p.paid_at) <= ?"); courseParams.push(end) }
      const rows = await BaseModel.query(
          `
      SELECT
        c.id,
        c.name,
        COUNT(DISTINCT o.id) AS qtd,
        COALESCE(SUM(p.amount), 0) AS total
      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      INNER JOIN courses c ON c.id = o.course_id
      WHERE ${courseFilters.join(" AND ")}
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
      `,
          courseParams
      )

      result.courses = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        qtd: Number(r.qtd || 0),
        total: Number(r.total || 0),
      }))
    }

    return result
  }

  static async reportDashboard(data: any): Promise<any> {
    return await this.getDashboard(data);
  }
  static diffInDays(start?: string, end?: string) {
    if (!start || !end) return 0
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24))
  }
  static async evolutionByDay(start?: string, end?: string): Promise<any[]> {

    const days = this.diffInDays(start, end)

    let groupBy = "DATE(p.created_at)"
    let selectLabel = "DATE(p.created_at) AS label"
    let orderBy = "DATE(p.created_at)"

    // Dia único → agrupar por hora para ter múltiplos pontos no gráfico
    if (days === 0) {
      groupBy = "HOUR(p.created_at)"
      selectLabel = "HOUR(p.created_at) AS label"
      orderBy = "HOUR(p.created_at)"
    } else if (days > 90 && days <= 730) {
      groupBy = "DATE_FORMAT(p.created_at, '%Y-%m')"
      selectLabel = `DATE_FORMAT(p.created_at, '%Y-%m') AS label`
      orderBy = "DATE_FORMAT(p.created_at, '%Y-%m')"
    } else if (days > 730) {
      groupBy = "YEAR(p.created_at)"
      selectLabel = "YEAR(p.created_at) AS label"
      orderBy = "YEAR(p.created_at)"
    }

    const filters: string[] = []
    const params: any[] = []

    if (start) {
      filters.push("DATE(p.created_at) >= ?")
      params.push(start)
    }

    if (end) {
      filters.push("DATE(p.created_at) <= ?")
      params.push(end)
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

    const rows = await BaseModel.query(
        `
    SELECT
      ${selectLabel},
      p.status,
      COUNT(*) AS total,
      COALESCE(SUM(p.amount), 0) AS revenue
    FROM payments p
    ${where}
    GROUP BY ${groupBy}, p.status
    ORDER BY ${orderBy} ASC
    `,
        params
    )

    // Refunds aprovadas no mesmo período (agrupadas pela mesma granularidade)
    const refundGroupBy    = groupBy.replace(/p\./g, "r.")
    const refundSelectLabel = selectLabel.replace(/p\./g, "r.")
    const refundOrderBy    = orderBy.replace(/p\./g, "r.")
    const refundFilters: string[] = ["r.status = 'approved'"]
    const refundParams: any[] = []
    if (start) { refundFilters.push("DATE(r.created_at) >= ?"); refundParams.push(start) }
    if (end)   { refundFilters.push("DATE(r.created_at) <= ?"); refundParams.push(end) }
    const refundWhere = `WHERE ${refundFilters.join(" AND ")}`

    const refundRows = await BaseModel.query(
      `SELECT ${refundSelectLabel}, COUNT(*) AS total, COALESCE(SUM(r.amount), 0) AS revenue
       FROM refunds r ${refundWhere}
       GROUP BY ${refundGroupBy}
       ORDER BY ${refundOrderBy} ASC`,
      refundParams
    )

    // Pivotar resultado
    const map: Record<string, any> = {}

    for (const r of rows) {
      if (!map[r.label]) {
        map[r.label] = {
          label: r.label,
          paid: 0,
          pending: 0,
          failed: 0,
          paidRevenue: 0,
          refunded: 0,
          refundedRevenue: 0,
        }
      }

      map[r.label][r.status] = Number(r.total)

      if (r.status === "paid") {
        map[r.label].paidRevenue = Number(r.revenue)
      }
    }

    for (const r of refundRows) {
      if (!map[r.label]) {
        map[r.label] = { label: r.label, paid: 0, pending: 0, failed: 0, paidRevenue: 0, refunded: 0, refundedRevenue: 0 }
      }
      map[r.label].refunded        = Number(r.total)
      map[r.label].refundedRevenue = Number(r.revenue)
    }

    return Object.values(map)
  }
  static async getDashboard(data: any): Promise<any> {
    const { start, end } = data || {};
    const filters: string[] = [];
    const params: any[] = [];

    if (start) {
      filters.push("DATE(created_at) >= ?");
      params.push(start);
    }
    if (end) {
      filters.push("DATE(created_at) <= ?");
      params.push(end);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // Filters prefixed with table alias for JOIN queries
    const joinFilters = filters.map(f => f.replace("created_at", "o.created_at"));
    const joinWhere = joinFilters.length ? `WHERE ${joinFilters.join(" AND ")}` : "";

    // Totais base
    const [ordersTotal]   = await BaseModel.query(`SELECT COUNT(*) AS total FROM orders ${where}`, params);
    const [paymentsTotal] = await BaseModel.query(`SELECT COUNT(*) AS total FROM payments ${where}`, params);
    // users não tem created_at — conta o total sem filtro de período
    const [usersTotal]    = await BaseModel.query(`SELECT COUNT(*) AS total FROM users`);

    // Receita bruta = todos os pagamentos que foram pagos (incluindo os depois devolvidos)
    const revenueFilters = [...filters, "status IN ('paid', 'refunded')"];
    const [revenueResult] = await BaseModel.query(
      `SELECT COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS paid_count FROM payments WHERE ${revenueFilters.join(" AND ")}`,
      params
    );
    const approvedRefundFilters = [...filters.map(f => f.replace("created_at", "r.created_at")), "r.status = 'approved'"];
    const approvedRefundWhere = `WHERE ${approvedRefundFilters.join(" AND ")}`;
    const [approvedRefundsResult] = await BaseModel.query(
      `SELECT COALESCE(SUM(r.amount), 0) AS amount FROM refunds r ${approvedRefundWhere}`,
      params
    );

    // Cursos vs Bundles (por pedidos no período)
    const courseTypeWhere = joinFilters.length
      ? `${joinWhere} AND LOWER(c.thinkific_type) = 'course'`
      : `WHERE LOWER(c.thinkific_type) = 'course'`;
    const bundleTypeWhere = joinFilters.length
      ? `${joinWhere} AND LOWER(c.thinkific_type) = 'bundle'`
      : `WHERE LOWER(c.thinkific_type) = 'bundle'`;

    const [coursesTotal] = await BaseModel.query(
      `SELECT COUNT(*) AS total FROM orders o INNER JOIN courses c ON o.course_id = c.id ${courseTypeWhere}`,
      params
    );
    const [bundlesTotal] = await BaseModel.query(
      `SELECT COUNT(*) AS total FROM orders o INNER JOIN courses c ON o.course_id = c.id ${bundleTypeWhere}`,
      params
    );

    // Parceiros breakdown (status 1 = activo, 0 = inactivo)
    const [activePartners] = await BaseModel.query(`SELECT COUNT(*) AS total FROM influencers WHERE status = 1`);
    const [inactivePartners] = await BaseModel.query(`SELECT COUNT(*) AS total FROM influencers WHERE status = 0`);

    // Receita por tipo de produto (paid payments no período)
    const courseTypeRevenue = await BaseModel.query(`
      SELECT LOWER(c.thinkific_type) AS type,
             COALESCE(SUM(p.amount), 0) AS revenue,
             COUNT(DISTINCT o.id) AS orders
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.id
      INNER JOIN courses c ON o.course_id = c.id
      WHERE p.status = 'paid'
      ${filters.length ? 'AND ' + filters.map(f => f.replace('created_at', 'p.created_at')).join(' AND ') : ''}
      GROUP BY LOWER(c.thinkific_type)
    `, params);

    // Período anterior (mesma duração, imediatamente antes)
    let previousTotals = { orders: 0, payments: 0, revenue: 0 }
    if (start && end) {
      const daysDiff = Math.max(1,
        Math.ceil((new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()) / 86400000) + 1
      )
      const prevEndDate = new Date(start + 'T00:00:00')
      prevEndDate.setDate(prevEndDate.getDate() - 1)
      const prevStartDate = new Date(prevEndDate)
      prevStartDate.setDate(prevStartDate.getDate() - (daysDiff - 1))
      const prevEnd   = prevEndDate.toISOString().split('T')[0]
      const prevStart = prevStartDate.toISOString().split('T')[0]
      const pp = [prevStart, prevEnd]
      const pw = `WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`
      const [pOrders]   = await BaseModel.query(`SELECT COUNT(*) AS total FROM orders ${pw}`, pp)
      const [pPayments] = await BaseModel.query(`SELECT COUNT(*) AS total FROM payments ${pw}`, pp)
      const [pRevenue]  = await BaseModel.query(
        `SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND status = 'paid'`,
        pp
      )
      const [pApprovedRefunds] = await BaseModel.query(
        `SELECT COALESCE(SUM(amount), 0) AS amount FROM refunds WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND status = 'approved'`,
        pp
      )
      previousTotals = {
        orders:   Number(pOrders.total),
        payments: Number(pPayments.total),
        revenue:  Number(pRevenue.revenue) - Number(pApprovedRefunds.amount),
      }
    }

    // Agrupamentos por status
    const ordersStatus = await BaseModel.query(`
      SELECT status, COUNT(*) as total
      FROM orders ${where}
      GROUP BY status
    `, params);

    const paymentsStatus = await BaseModel.query(`
      SELECT status, COUNT(*) as total, COALESCE(SUM(amount), 0) AS revenue
      FROM payments ${where}
      GROUP BY status
    `, params);

    // Devoluções no período
    const refundFilters = filters.map(f => f.replace("created_at", "r.created_at"));
    const refundWhere = refundFilters.length ? `WHERE ${refundFilters.join(" AND ")}` : "";
    const [refundsTotal] = await BaseModel.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(r.amount), 0) AS amount FROM refunds r ${refundWhere}`,
      params
    );
    const refundsStatus = await BaseModel.query(
      `SELECT r.status, COUNT(*) AS total, COALESCE(SUM(r.amount), 0) AS amount
       FROM refunds r ${refundWhere}
       GROUP BY r.status`,
      params
    );

    // Últimos registos
    const latestOrders = await BaseModel.query(`
      SELECT o.id, o.code, o.status, o.amount_due AS amount, o.created_at,
             c.name AS course_name, LOWER(c.thinkific_type) AS course_type
      FROM orders o
      LEFT JOIN courses c ON o.course_id = c.id
      ${joinWhere}
      ORDER BY o.id DESC
      LIMIT 8
    `, params);

    const latestPayments = await BaseModel.query(`
      SELECT p.id, p.code, p.status, p.amount, p.phone, p.payment_type, p.created_at
      FROM payments p
      ${where}
      ORDER BY p.id DESC
      LIMIT 8
    `, params);

    return {
      totals: {
        orders:         Number(ordersTotal.total),
        payments:       Number(paymentsTotal.total),
        courses:        Number(coursesTotal.total),
        bundles:        Number(bundlesTotal.total),
        users:          Number(usersTotal.total),
        paidPayments:   Number(revenueResult.paid_count),
        revenue:        Number(revenueResult.revenue) - Number(approvedRefundsResult.amount),
        grossRevenue:   Number(revenueResult.revenue),
        activePartners: Number(activePartners.total),
        refunds:        Number(refundsTotal.total),
        refundsAmount:  Number(refundsTotal.amount),
      },
      partnersBreakdown: {
        active:   Number(activePartners.total),
        disabled: Number(inactivePartners.total),
      },
      courseTypeRevenue: Object.fromEntries(
        courseTypeRevenue.map((r: any) => [r.type, { revenue: Number(r.revenue), orders: Number(r.orders) }])
      ),
      ordersStatus: Object.fromEntries(
        ordersStatus.map((r: any) => [r.status, Number(r.total)])
      ),
      paymentsStatus: Object.fromEntries(
        paymentsStatus.map((r: any) => [r.status, Number(r.total)])
      ),
      paymentsRevenue: Object.fromEntries(
        paymentsStatus.map((r: any) => [r.status, Number(r.revenue)])
      ),
      previousTotals,
      refundsStatus: Object.fromEntries(
        refundsStatus.map((r: any) => [r.status, { total: Number(r.total), amount: Number(r.amount) }])
      ),
      evolution: await this.evolutionByDay(start, end),
      latestOrders,
      latestPayments,
    };
  }
  static async influencer(data: any): Promise<any> {
    const { start, end, influencer } = data
    const feeRate = await this.getFeeRate()

    const filters: string[] = ["p.status IN ('paid', 'refunded')"]
    const params: any[] = []

    if (start) {
      filters.push("DATE(p.paid_at) >= ?")
      params.push(start)
    }

    if (end) {
      filters.push("DATE(p.paid_at) <= ?")
      params.push(end)
    }

    if (influencer) {
      filters.push("i.id = ?")
      params.push(influencer)
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

    const rows = await BaseModel.query(
        `
    SELECT
      i.id AS influencer_id,
      i.name AS influencer_name,
      i.commission AS influencerCommission,

      COUNT(DISTINCT o.id) AS sales,

      COALESCE(SUM(o.amount_due), 0) AS gross,

      COALESCE(SUM(o.discount_promotion), 0) AS discount_promotion,
      COALESCE(SUM(o.discount_coupon), 0) AS discount_coupon,
      COALESCE(SUM(o.discount_total), 0) AS discounts,

      COALESCE(SUM(o.amount_paid), 0) AS revenue,

      ROUND(COALESCE(SUM(o.amount_paid), 0), 2) AS result,

      ROUND(
        (COALESCE(SUM(CASE WHEN p.status = 'paid' THEN o.subtotal ELSE 0 END), 0) * (i.commission / 100)),
        2
      ) AS influencerCommissionReceiver,

      ROUND(
        (COALESCE(SUM(o.amount_paid), 0) -
         (COALESCE(SUM(CASE WHEN p.status = 'paid' THEN o.subtotal ELSE 0 END), 0) * (i.commission / 100))),
        2
      ) AS result_final

    FROM payments p
    INNER JOIN orders o ON o.id = p.order_id
    INNER JOIN influencers i ON i.coupon_id = o.coupon_id
    ${where}
    GROUP BY i.id, i.name, i.commission
    ORDER BY i.name ASC
    `,
        params
    )

    // Refunds per influencer (approved)
    const refInflParams: any[] = ["approved"]
    const refInflFilters: string[] = ["r.status = ?"]
    if (start) { refInflFilters.push("DATE(r.created_at) >= ?"); refInflParams.push(start) }
    if (end)   { refInflFilters.push("DATE(r.created_at) <= ?"); refInflParams.push(end) }
    if (influencer) { refInflFilters.push("i.id = ?"); refInflParams.push(influencer) }
    const refInflRows = await BaseModel.query(
      `SELECT i.id AS influencer_id, COUNT(*) AS refunds_count, COALESCE(SUM(r.amount), 0) AS refunds_amount
       FROM refunds r INNER JOIN orders o ON o.id = r.order_id
       INNER JOIN influencers i ON i.coupon_id = o.coupon_id
       WHERE ${refInflFilters.join(" AND ")} GROUP BY i.id`,
      refInflParams
    )
    const refInflMap: Record<number, any> = Object.fromEntries(
      refInflRows.map((r: any) => [r.influencer_id, r])
    )

    const total = {
      influencer_id: null,
      influencer_name: "TOTAL",
      sales: 0,
      gross: 0,
      discount_coupon: 0,
      discount_promotion: 0,
      discounts: 0,
      revenue: 0,
      result_iliquido: 0,
      fees: 0,
      result: 0,
      result_final: 0,
      influencerCommissionReceiver: 0,
      refunds_count: 0,
      refunds_amount: 0,
    }

    const enrichedInflRows = rows.map((r: any) => {
      const ref             = refInflMap[r.influencer_id] || {}
      const revenue         = Number(r.revenue || 0)
      const refunds_count   = Number(ref.refunds_count || 0)
      const refunds_amount  = Number(ref.refunds_amount || 0)
      const commissions     = Number(r.influencerCommissionReceiver || 0)
      const result_iliquido = parseFloat((revenue - refunds_amount).toFixed(2))
      const fees            = parseFloat((result_iliquido * feeRate).toFixed(2))
      const result          = parseFloat((result_iliquido - fees).toFixed(2))
      const result_final    = parseFloat((result - commissions).toFixed(2))
      return { ...r, revenue, refunds_count, refunds_amount, result_iliquido, fees, result, result_final }
    })

    for (const r of enrichedInflRows) {
      total.sales += Number(r.sales || 0)
      total.gross += Number(r.gross || 0)
      total.discount_coupon += Number(r.discount_coupon || 0)
      total.discount_promotion += Number(r.discount_promotion || 0)
      total.discounts += Number(r.discounts || 0)
      total.revenue += r.revenue
      total.result_iliquido += r.result_iliquido
      total.fees += r.fees
      total.result += r.result
      total.result_final += r.result_final
      total.influencerCommissionReceiver += Number(r.influencerCommissionReceiver || 0)
      total.refunds_count += r.refunds_count
      total.refunds_amount += r.refunds_amount
    }

    total.gross = Number(total.gross.toFixed(2))
    total.discount_coupon = Number(total.discount_coupon.toFixed(2))
    total.discount_promotion = Number(total.discount_promotion.toFixed(2))
    total.discounts = Number(total.discounts.toFixed(2))
    total.revenue = Number(total.revenue.toFixed(2))
    total.result_iliquido = Number(total.result_iliquido.toFixed(2))
    total.fees = Number(total.fees.toFixed(2))
    total.result = Number(total.result.toFixed(2))
    total.result_final = Number(total.result_final.toFixed(2))
    total.influencerCommissionReceiver = Number(total.influencerCommissionReceiver.toFixed(2))

    return { report: enrichedInflRows, total }
  }

  static async influencerByCourse(data: any): Promise<any> {
    const { start, end, influencer } = data;

    const filters: string[] = ["p.status IN ('paid', 'refunded')"];
    const params: any[] = [];
    if (start)      { filters.push("DATE(p.paid_at) >= ?"); params.push(start); }
    if (end)        { filters.push("DATE(p.paid_at) <= ?"); params.push(end); }
    if (influencer) { filters.push("i.id = ?");             params.push(influencer); }
    const where = `WHERE ${filters.join(" AND ")}`;

    // Rows: influencer × course
    const rows = await BaseModel.query(`
      SELECT
        i.id         AS influencer_id,
        i.name       AS influencer_name,
        i.commission AS commission_pct,
        c.id         AS course_id,
        c.name       AS course_name,
        COUNT(DISTINCT o.id)               AS sales,
        COALESCE(SUM(o.amount_due),  0)    AS gross,
        COALESCE(SUM(o.discount_total), 0) AS discounts,
        COALESCE(SUM(o.amount_paid), 0)    AS revenue,
        ROUND(COALESCE(SUM(CASE WHEN p.status = 'paid' THEN o.subtotal ELSE 0 END), 0) * (i.commission / 100), 2) AS commission_value
      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      INNER JOIN courses c ON c.id = o.course_id
      INNER JOIN influencers i ON i.coupon_id = o.coupon_id
      ${where}
      GROUP BY i.id, i.name, i.commission, c.id, c.name
      ORDER BY i.name ASC, revenue DESC
    `, params);

    // Refunds per influencer × course (approved)
    const refParams: any[] = ["approved"];
    const refFilters: string[] = ["r.status = ?"];
    if (start)      { refFilters.push("DATE(r.created_at) >= ?"); refParams.push(start); }
    if (end)        { refFilters.push("DATE(r.created_at) <= ?"); refParams.push(end); }
    if (influencer) { refFilters.push("i.id = ?");                refParams.push(influencer); }
    const refRows = await BaseModel.query(`
      SELECT
        i.id         AS influencer_id,
        o.course_id  AS course_id,
        COUNT(*)                          AS refunds_count,
        COALESCE(SUM(r.amount), 0)        AS refunds_amount
      FROM refunds r
      INNER JOIN orders o ON o.id = r.order_id
      INNER JOIN influencers i ON i.coupon_id = o.coupon_id
      WHERE ${refFilters.join(" AND ")}
      GROUP BY i.id, o.course_id
    `, refParams);
    // Build lookup: influencer_id → course_id → refund data
    const refMap: Record<number, Record<number, any>> = {};
    for (const r of refRows) {
      if (!refMap[r.influencer_id]) refMap[r.influencer_id] = {};
      refMap[r.influencer_id][r.course_id] = { refunds_count: Number(r.refunds_count), refunds_amount: Number(r.refunds_amount) };
    }

    // Group rows by influencer
    const map: Record<number, any> = {};
    for (const row of rows) {
      if (!map[row.influencer_id]) {
        map[row.influencer_id] = {
          influencer_id:    row.influencer_id,
          influencer_name:  row.influencer_name,
          commission_pct:   Number(row.commission_pct),
          total_sales:      0,
          total_gross:      0,
          total_revenue:    0,
          total_commission: 0,
          total_refunds_count:  0,
          total_refunds_amount: 0,
          courses: [],
        };
      }
      const inf = map[row.influencer_id];
      const refData = refMap[row.influencer_id]?.[row.course_id] || { refunds_count: 0, refunds_amount: 0 };
      const course = {
        course_id:        row.course_id,
        course_name:      row.course_name,
        sales:            Number(row.sales),
        gross:            Number(row.gross),
        discounts:        Number(row.discounts),
        revenue:          Number(row.revenue),
        commission_value: Number(row.commission_value),
        refunds_count:    refData.refunds_count,
        refunds_amount:   refData.refunds_amount,
      };
      inf.courses.push(course);
      inf.total_sales            += course.sales;
      inf.total_gross            += course.gross;
      inf.total_revenue          += course.revenue;
      inf.total_commission       += course.commission_value;
      inf.total_refunds_count    += course.refunds_count;
      inf.total_refunds_amount   += course.refunds_amount;
    }

    const influencers = Object.values(map).map((inf: any) => ({
      ...inf,
      total_gross:          Number(inf.total_gross.toFixed(2)),
      total_revenue:        Number(inf.total_revenue.toFixed(2)),
      total_commission:     Number(inf.total_commission.toFixed(2)),
      total_refunds_amount: Number(inf.total_refunds_amount.toFixed(2)),
    }));

    const totals = {
      total_influencers:    influencers.length,
      total_sales:          influencers.reduce((s: number, i: any) => s + i.total_sales, 0),
      total_gross:          Number(influencers.reduce((s: number, i: any) => s + i.total_gross, 0).toFixed(2)),
      total_revenue:        Number(influencers.reduce((s: number, i: any) => s + i.total_revenue, 0).toFixed(2)),
      total_commission:     Number(influencers.reduce((s: number, i: any) => s + i.total_commission, 0).toFixed(2)),
      total_refunds_count:  influencers.reduce((s: number, i: any) => s + i.total_refunds_count, 0),
      total_refunds_amount: Number(influencers.reduce((s: number, i: any) => s + i.total_refunds_amount, 0).toFixed(2)),
    };

    return { influencers, totals };
  }

  static async day(data: any): Promise<any[]> {
    const { start, end, course } = data;
    const feeRate = await this.getFeeRate();
    const filters: string[] = ["p.status IN ('paid', 'refunded')"];
    const params: any[] = [];
    if (start) { filters.push("DATE(p.paid_at) >= ?"); params.push(start); }
    if (end)   { filters.push("DATE(p.paid_at) <= ?"); params.push(end); }
    if (course){ filters.push("o.course_id = ?");      params.push(course); }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const rows = await BaseModel.query(
      `SELECT
        DATE(p.paid_at) AS day,
        COUNT(DISTINCT o.id) AS sales,
        SUM(o.amount_due) AS gross,
        SUM(o.discount_total) AS discounts,
        SUM(o.amount_paid) AS revenue,
        COALESCE(ROUND(SUM(CASE WHEN inf.id IS NOT NULL AND p.status = 'paid' THEN o.subtotal * (inf.commission / 100.0) ELSE 0 END), 2), 0) AS commissions
       FROM payments p
       INNER JOIN orders o ON o.id = p.order_id
       LEFT JOIN influencers inf ON inf.coupon_id = o.coupon_id
       ${where}
       GROUP BY DATE(p.paid_at)
       ORDER BY DATE(p.paid_at) ASC`,
      params
    );

    // Refunds per day (approved)
    const refundParams: any[] = [];
    const refundFilters: string[] = ["r.status = 'approved'"];
    if (start) { refundFilters.push("DATE(r.created_at) >= ?"); refundParams.push(start); }
    if (end)   { refundFilters.push("DATE(r.created_at) <= ?"); refundParams.push(end); }
    const refundRows = await BaseModel.query(
      `SELECT DATE(r.created_at) AS day, COUNT(*) AS refunds_count, COALESCE(SUM(r.amount), 0) AS refunds_amount
       FROM refunds r WHERE ${refundFilters.join(" AND ")} GROUP BY DATE(r.created_at)`,
      refundParams
    );
    const refundMap: Record<string, any> = Object.fromEntries(refundRows.map((r: any) => [r.day, r]));

    const total = { day: "TOTAL", sales: 0, gross: 0, discounts: 0, revenue: 0, refunds_count: 0, refunds_amount: 0, result_iliquido: 0, fees: 0, result: 0, commissions: 0, result_final: 0 };

    const enrichedRows = rows.map((r: any) => {
      const ref             = refundMap[r.day] || {};
      const revenue         = Number(r.revenue || 0);
      const refunds_count   = Number(ref.refunds_count || 0);
      const refunds_amount  = Number(ref.refunds_amount || 0);
      const commissions     = Number(r.commissions || 0);
      const result_iliquido = parseFloat((revenue - refunds_amount).toFixed(2));
      const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
      const result          = parseFloat((result_iliquido - fees).toFixed(2));
      const result_final    = parseFloat((result - commissions).toFixed(2));
      return { ...r, revenue, refunds_count, refunds_amount, commissions, result_iliquido, fees, result, result_final };
    });
    for (const r of enrichedRows) {
      total.sales           += Number(r.sales || 0);
      total.gross           += Number(r.gross || 0);
      total.discounts       += Number(r.discounts || 0);
      total.revenue         += r.revenue;
      total.refunds_count   += r.refunds_count;
      total.refunds_amount  += r.refunds_amount;
      total.result_iliquido += r.result_iliquido;
      total.fees            += r.fees;
      total.result          += r.result;
      total.commissions     += r.commissions;
      total.result_final    += r.result_final;
    }
    // Inclui devoluções em dias sem vendas como linhas próprias na tabela
    const paymentDays = new Set(enrichedRows.map((r: any) => String(r.day)));
    const orphanRows: any[] = [];
    for (const [day, ref] of Object.entries(refundMap) as any[]) {
      if (!paymentDays.has(String(day))) {
        const refunds_count   = Number((ref as any).refunds_count || 0);
        const refunds_amount  = Number((ref as any).refunds_amount || 0);
        const result_iliquido = parseFloat((-refunds_amount).toFixed(2));
        const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
        const result          = parseFloat((result_iliquido - fees).toFixed(2));
        orphanRows.push({ day, sales: 0, gross: 0, discounts: 0, revenue: 0, commissions: 0, refunds_count, refunds_amount, result_iliquido, fees, result, result_final: result });
        total.refunds_count   += refunds_count;
        total.refunds_amount  += refunds_amount;
        total.result_iliquido += result_iliquido;
        total.fees            += fees;
        total.result          += result;
        total.result_final    += result;
      }
    }
    const allRows = [...enrichedRows, ...orphanRows].sort((a: any, b: any) => String(a.day) < String(b.day) ? -1 : 1);
    return { report: allRows, total };
  }
  static async month(data: any): Promise<any[]> {
    const { year, course } = data;
    const feeRate = await this.getFeeRate();
    const filters: string[] = ["p.status IN ('paid', 'refunded')"];
    const params: any[] = [];
    if (year)  { filters.push("YEAR(p.paid_at) = ?"); params.push(year); }
    if (course){ filters.push("o.course_id = ?");     params.push(course); }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const rows = await BaseModel.query(
      `SELECT
        YEAR(p.paid_at) AS year,
        MONTH(p.paid_at) AS month_number,
        MONTHNAME(p.paid_at) AS month,
        COUNT(DISTINCT o.id) AS sales,
        SUM(o.amount_due) AS gross,
        SUM(o.discount_total) AS discounts,
        SUM(o.amount_paid) AS revenue,
        COALESCE(ROUND(SUM(CASE WHEN inf.id IS NOT NULL AND p.status = 'paid' THEN o.subtotal * (inf.commission / 100.0) ELSE 0 END), 2), 0) AS commissions
       FROM payments p
       INNER JOIN orders o ON o.id = p.order_id
       LEFT JOIN influencers inf ON inf.coupon_id = o.coupon_id
       ${where}
       GROUP BY YEAR(p.paid_at), MONTH(p.paid_at), MONTHNAME(p.paid_at)
       ORDER BY YEAR(p.paid_at), MONTH(p.paid_at)`,
      params
    );

    // Refunds per month (approved)
    const refMonthParams: any[] = ["approved"];
    const refMonthFilters: string[] = ["r.status = ?"];
    if (year) { refMonthFilters.push("YEAR(r.created_at) = ?"); refMonthParams.push(year); }
    const refMonthRows = await BaseModel.query(
      `SELECT YEAR(r.created_at) AS year, MONTH(r.created_at) AS month_number,
              COUNT(*) AS refunds_count, COALESCE(SUM(r.amount), 0) AS refunds_amount
       FROM refunds r WHERE ${refMonthFilters.join(" AND ")} GROUP BY YEAR(r.created_at), MONTH(r.created_at)`,
      refMonthParams
    );
    const refMonthMap: Record<string, any> = Object.fromEntries(
      refMonthRows.map((r: any) => [`${r.year}-${r.month_number}`, r])
    );

    const total = { year: year || "TOTAL", month: "TOTAL", sales: 0, gross: 0, discounts: 0, revenue: 0, refunds_count: 0, refunds_amount: 0, result_iliquido: 0, fees: 0, result: 0, commissions: 0, result_final: 0 };

    const enrichedMonthRows = rows.map((r: any) => {
      const ref             = refMonthMap[`${r.year}-${r.month_number}`] || {};
      const revenue         = Number(r.revenue || 0);
      const refunds_count   = Number(ref.refunds_count || 0);
      const refunds_amount  = Number(ref.refunds_amount || 0);
      const commissions     = Number(r.commissions || 0);
      const result_iliquido = parseFloat((revenue - refunds_amount).toFixed(2));
      const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
      const result          = parseFloat((result_iliquido - fees).toFixed(2));
      const result_final    = parseFloat((result - commissions).toFixed(2));
      return { ...r, revenue, refunds_count, refunds_amount, commissions, result_iliquido, fees, result, result_final };
    });
    for (const r of enrichedMonthRows) {
      total.sales           += Number(r.sales || 0);
      total.gross           += Number(r.gross || 0);
      total.discounts       += Number(r.discounts || 0);
      total.revenue         += r.revenue;
      total.refunds_count   += r.refunds_count;
      total.refunds_amount  += r.refunds_amount;
      total.result_iliquido += r.result_iliquido;
      total.fees            += r.fees;
      total.result          += r.result;
      total.commissions     += r.commissions;
      total.result_final    += r.result_final;
    }
    // Meses com só devoluções (sem vendas)
    const paymentMonths = new Set(enrichedMonthRows.map((r: any) => `${r.year}-${r.month_number}`));
    const orphanMonthRows: any[] = [];
    for (const [key, ref] of Object.entries(refMonthMap) as any[]) {
      if (!paymentMonths.has(key)) {
        const refunds_count   = Number(ref.refunds_count || 0);
        const refunds_amount  = Number(ref.refunds_amount || 0);
        const result_iliquido = parseFloat((-refunds_amount).toFixed(2));
        const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
        const result          = parseFloat((result_iliquido - fees).toFixed(2));
        const [y, m] = key.split('-');
        const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
        orphanMonthRows.push({ year: Number(y), month_number: Number(m), month: monthNames[Number(m)] || m, sales: 0, gross: 0, discounts: 0, revenue: 0, commissions: 0, refunds_count, refunds_amount, result_iliquido, fees, result, result_final: result });
        total.refunds_count   += refunds_count;
        total.refunds_amount  += refunds_amount;
        total.result_iliquido += result_iliquido;
        total.fees            += fees;
        total.result          += result;
        total.result_final    += result;
      }
    }
    const allMonthRows = [...enrichedMonthRows, ...orphanMonthRows].sort((a: any, b: any) => a.year !== b.year ? a.year - b.year : a.month_number - b.month_number);
    return { report: allMonthRows, total };
  }
  static async byCourse(data: any): Promise<any[]> {
    const { start, end } = data;
    const feeRate = await this.getFeeRate();
    const filters: string[] = ["p.status IN ('paid', 'refunded')"];
    const params: any[] = [];
    if (start) { filters.push("DATE(p.paid_at) >= ?"); params.push(start); }
    if (end)   { filters.push("DATE(p.paid_at) <= ?"); params.push(end); }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const rows = await BaseModel.query(
      `SELECT
        o.course_id AS course_id,
        c.name AS course_name,
        COUNT(DISTINCT o.id) AS sales,
        SUM(o.amount_due) AS gross,
        SUM(o.discount_total) AS discounts,
        SUM(o.amount_paid) AS revenue,
        COALESCE(ROUND(SUM(CASE WHEN inf.id IS NOT NULL AND p.status = 'paid' THEN o.subtotal * (inf.commission / 100.0) ELSE 0 END), 2), 0) AS commissions
       FROM payments p
       INNER JOIN orders o ON o.id = p.order_id
       LEFT JOIN courses c ON c.id = o.course_id
       LEFT JOIN influencers inf ON inf.coupon_id = o.coupon_id
       ${where}
       GROUP BY o.course_id, c.name
       ORDER BY c.name ASC`,
      params
    );

    // Refunds per course (approved)
    const refCourseParams: any[] = ["approved"];
    const refCourseFilters: string[] = ["r.status = ?"];
    if (start) { refCourseFilters.push("DATE(r.created_at) >= ?"); refCourseParams.push(start); }
    if (end)   { refCourseFilters.push("DATE(r.created_at) <= ?"); refCourseParams.push(end); }
    const refCourseRows = await BaseModel.query(
      `SELECT o.course_id, COUNT(*) AS refunds_count, COALESCE(SUM(r.amount), 0) AS refunds_amount
       FROM refunds r INNER JOIN orders o ON o.id = r.order_id
       WHERE ${refCourseFilters.join(" AND ")} GROUP BY o.course_id`,
      refCourseParams
    );
    const refCourseMap: Record<number, any> = Object.fromEntries(
      refCourseRows.map((r: any) => [r.course_id, r])
    );

    const total = { course_id: null, course_name: "TOTAL", sales: 0, gross: 0, discounts: 0, revenue: 0, refunds_count: 0, refunds_amount: 0, result_iliquido: 0, fees: 0, result: 0, commissions: 0, result_final: 0 };

    const enrichedCourseRows = rows.map((r: any) => {
      const ref             = refCourseMap[r.course_id] || {};
      const revenue         = Number(r.revenue || 0);
      const refunds_count   = Number(ref.refunds_count || 0);
      const refunds_amount  = Number(ref.refunds_amount || 0);
      const commissions     = Number(r.commissions || 0);
      const result_iliquido = parseFloat((revenue - refunds_amount).toFixed(2));
      const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
      const result          = parseFloat((result_iliquido - fees).toFixed(2));
      const result_final    = parseFloat((result - commissions).toFixed(2));
      return { ...r, revenue, refunds_count, refunds_amount, commissions, result_iliquido, fees, result, result_final };
    });
    for (const r of enrichedCourseRows) {
      total.sales           += Number(r.sales || 0);
      total.gross           += Number(r.gross || 0);
      total.discounts       += Number(r.discounts || 0);
      total.revenue         += r.revenue;
      total.refunds_count   += r.refunds_count;
      total.refunds_amount  += r.refunds_amount;
      total.result_iliquido += r.result_iliquido;
      total.fees            += r.fees;
      total.result          += r.result;
      total.commissions     += r.commissions;
      total.result_final    += r.result_final;
    }
    // Cursos com só devoluções (sem vendas no período)
    const paymentCourses = new Set(enrichedCourseRows.map((r: any) => String(r.course_id)));
    const orphanCourseRows: any[] = [];
    for (const [courseId, ref] of Object.entries(refCourseMap) as any[]) {
      if (!paymentCourses.has(String(courseId))) {
        const refunds_count   = Number(ref.refunds_count || 0);
        const refunds_amount  = Number(ref.refunds_amount || 0);
        const result_iliquido = parseFloat((-refunds_amount).toFixed(2));
        const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
        const result          = parseFloat((result_iliquido - fees).toFixed(2));
        orphanCourseRows.push({ course_id: courseId, course_name: `Curso #${courseId}`, sales: 0, gross: 0, discounts: 0, revenue: 0, commissions: 0, refunds_count, refunds_amount, result_iliquido, fees, result, result_final: result });
        total.refunds_count   += refunds_count;
        total.refunds_amount  += refunds_amount;
        total.result_iliquido += result_iliquido;
        total.fees            += fees;
        total.result          += result;
        total.result_final    += result;
      }
    }
    // Buscar nomes dos cursos órfãos
    if (orphanCourseRows.length > 0) {
      const orphanIds = orphanCourseRows.map((r: any) => r.course_id);
      const placeholders = orphanIds.map(() => '?').join(',');
      const courseNames = await BaseModel.query(`SELECT id, name FROM courses WHERE id IN (${placeholders})`, orphanIds);
      const nameMap: Record<string, string> = Object.fromEntries(courseNames.map((c: any) => [String(c.id), c.name]));
      orphanCourseRows.forEach((r: any) => { r.course_name = nameMap[String(r.course_id)] || r.course_name; });
    }
    const allCourseRows = [...enrichedCourseRows, ...orphanCourseRows].sort((a: any, b: any) => (a.course_name || '').localeCompare(b.course_name || ''));
    return { report: allCourseRows, total };
  }

  /**
   * Normaliza o tipo de pagamento em categorias canónicas (mesma rotulagem da UI):
   * express/aexpress → express · ref/aref → ref · qr → qr · restante → outros.
   * `alias` é o prefixo da coluna payment_type (ex.: "p" ou "pp").
   */
  private static paymentTypeExpr(alias: string): string {
    return `CASE
      WHEN ${alias}.payment_type IN ('express','aexpress') THEN 'express'
      WHEN ${alias}.payment_type IN ('ref','aref') THEN 'ref'
      WHEN ${alias}.payment_type = 'qr' THEN 'qr'
      ELSE 'outros' END`;
  }

  /**
   * Aplica a cascata financeira (result_iliquido → encargos → líquido → comissões → líquido final)
   * a um conjunto de linhas, cruzando as devoluções pelo `keyFn`, e devolve as linhas
   * enriquecidas + o total agregado.
   */
  private static buildCascade(
    rows: any[],
    refMap: Record<string, any>,
    keyFn: (r: any) => string,
    feeRate: number,
    totalSeed: Record<string, any>,
  ): { enriched: any[]; total: any } {
    const total: any = { ...totalSeed, sales: 0, gross: 0, discounts: 0, revenue: 0, refunds_count: 0, refunds_amount: 0, result_iliquido: 0, fees: 0, result: 0, commissions: 0, result_final: 0 };
    const enriched = rows.map((r: any) => {
      const ref             = refMap[keyFn(r)] || {};
      const revenue         = Number(r.revenue || 0);
      const refunds_count   = Number(ref.refunds_count || 0);
      const refunds_amount  = Number(ref.refunds_amount || 0);
      const commissions     = Number(r.commissions || 0);
      const result_iliquido = parseFloat((revenue - refunds_amount).toFixed(2));
      const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
      const result          = parseFloat((result_iliquido - fees).toFixed(2));
      const result_final    = parseFloat((result - commissions).toFixed(2));
      return { ...r, revenue, refunds_count, refunds_amount, commissions, result_iliquido, fees, result, result_final };
    });
    for (const r of enriched) {
      total.sales           += Number(r.sales || 0);
      total.gross           += Number(r.gross || 0);
      total.discounts       += Number(r.discounts || 0);
      total.revenue         += r.revenue;
      total.refunds_count   += r.refunds_count;
      total.refunds_amount  += r.refunds_amount;
      total.result_iliquido += r.result_iliquido;
      total.fees            += r.fees;
      total.result          += r.result;
      total.commissions     += r.commissions;
      total.result_final    += r.result_final;
    }
    return { enriched, total };
  }

  /** Resumo de vendas agrupado por tipo de pagamento (express/referência/qr). */
  static async byPaymentType(data: any): Promise<any> {
    const { start, end } = data;
    const feeRate = await this.getFeeRate();
    const filters: string[] = ["p.status IN ('paid', 'refunded')"];
    const params: any[] = [];
    if (start) { filters.push("DATE(p.paid_at) >= ?"); params.push(start); }
    if (end)   { filters.push("DATE(p.paid_at) <= ?"); params.push(end); }
    const where = `WHERE ${filters.join(" AND ")}`;
    const typeExpr = this.paymentTypeExpr("p");

    const rows = await BaseModel.query(
      `SELECT ${typeExpr} AS payment_type,
        COUNT(DISTINCT o.id) AS sales,
        SUM(o.amount_due) AS gross,
        SUM(o.discount_total) AS discounts,
        SUM(o.amount_paid) AS revenue,
        COALESCE(ROUND(SUM(CASE WHEN inf.id IS NOT NULL AND p.status = 'paid' THEN o.subtotal * (inf.commission / 100.0) ELSE 0 END), 2), 0) AS commissions
       FROM payments p
       INNER JOIN orders o ON o.id = p.order_id
       LEFT JOIN influencers inf ON inf.coupon_id = o.coupon_id
       ${where}
       GROUP BY ${typeExpr}
       ORDER BY revenue DESC`,
      params
    );

    const refMap = await this.refundsByPaymentType({ start, end });
    const { enriched, total } = this.buildCascade(rows, refMap, (r) => String(r.payment_type), feeRate, { payment_type: "TOTAL" });

    // Tipos com devoluções mas sem vendas no período
    const seen = new Set(enriched.map((r: any) => String(r.payment_type)));
    const orphans = this.orphanRefundRows(refMap, seen, feeRate, (k) => ({ payment_type: k }), total);

    const allRows = [...enriched, ...orphans].sort((a: any, b: any) => Number(b.revenue) - Number(a.revenue));
    return { report: allRows, total };
  }

  /** Vendas diárias detalhadas por tipo de pagamento (uma linha por dia × tipo). */
  static async dayByPaymentType(data: any): Promise<any> {
    const { start, end } = data;
    const feeRate = await this.getFeeRate();
    const filters: string[] = ["p.status IN ('paid', 'refunded')"];
    const params: any[] = [];
    if (start) { filters.push("DATE(p.paid_at) >= ?"); params.push(start); }
    if (end)   { filters.push("DATE(p.paid_at) <= ?"); params.push(end); }
    const where = `WHERE ${filters.join(" AND ")}`;
    const typeExpr = this.paymentTypeExpr("p");

    const rows = await BaseModel.query(
      `SELECT DATE(p.paid_at) AS day, ${typeExpr} AS payment_type,
        COUNT(DISTINCT o.id) AS sales,
        SUM(o.amount_due) AS gross,
        SUM(o.discount_total) AS discounts,
        SUM(o.amount_paid) AS revenue,
        COALESCE(ROUND(SUM(CASE WHEN inf.id IS NOT NULL AND p.status = 'paid' THEN o.subtotal * (inf.commission / 100.0) ELSE 0 END), 2), 0) AS commissions
       FROM payments p
       INNER JOIN orders o ON o.id = p.order_id
       LEFT JOIN influencers inf ON inf.coupon_id = o.coupon_id
       ${where}
       GROUP BY DATE(p.paid_at), ${typeExpr}
       ORDER BY day ASC, revenue DESC`,
      params
    );

    const refMap = await this.refundsByPaymentType({ start, end, perDay: true });
    const keyFn = (r: any) => `${String(r.day)}|${String(r.payment_type)}`;
    const { enriched, total } = this.buildCascade(rows, refMap, keyFn, feeRate, { day: "TOTAL", payment_type: "" });

    const seen = new Set(enriched.map(keyFn));
    const orphans = this.orphanRefundRows(refMap, seen, feeRate, (k) => {
      const [day, payment_type] = k.split("|");
      return { day, payment_type };
    }, total);

    const allRows = [...enriched, ...orphans].sort((a: any, b: any) =>
      String(a.day) === String(b.day) ? Number(b.revenue) - Number(a.revenue) : (String(a.day) < String(b.day) ? -1 : 1)
    );
    return { report: allRows, total };
  }

  /**
   * Devoluções aprovadas agrupadas por tipo de pagamento (e opcionalmente por dia).
   * O tipo de pagamento vem do pagamento pago/devolvido da encomenda da devolução.
   * Devolve um mapa: chave `tipo` (ou `dia|tipo`) → { refunds_count, refunds_amount }.
   */
  private static async refundsByPaymentType(data: any): Promise<Record<string, any>> {
    const { start, end, perDay } = data;
    const filters: string[] = ["r.status = 'approved'"];
    const params: any[] = [];
    if (start) { filters.push("DATE(r.created_at) >= ?"); params.push(start); }
    if (end)   { filters.push("DATE(r.created_at) <= ?"); params.push(end); }
    const typeExpr = this.paymentTypeExpr("pp");
    const dayCol = perDay ? "DATE(r.created_at) AS day," : "";
    const groupBy = perDay ? `DATE(r.created_at), ${typeExpr}` : typeExpr;

    const rows = await BaseModel.query(
      `SELECT ${dayCol} ${typeExpr} AS payment_type,
              COUNT(*) AS refunds_count, COALESCE(SUM(r.amount), 0) AS refunds_amount
       FROM refunds r
       INNER JOIN (
         SELECT order_id, MAX(payment_type) AS payment_type
         FROM payments WHERE status IN ('paid', 'refunded') GROUP BY order_id
       ) pp ON pp.order_id = r.order_id
       WHERE ${filters.join(" AND ")}
       GROUP BY ${groupBy}`,
      params
    );
    return Object.fromEntries(
      rows.map((r: any) => [perDay ? `${String(r.day)}|${String(r.payment_type)}` : String(r.payment_type), r])
    );
  }

  /**
   * Constrói linhas para chaves que só têm devoluções (sem vendas) e soma-as ao total.
   * `seed(key)` devolve os campos identificadores da linha (ex.: { payment_type } ou { day, payment_type }).
   */
  private static orphanRefundRows(
    refMap: Record<string, any>,
    seen: Set<string>,
    feeRate: number,
    seed: (key: string) => Record<string, any>,
    total: any,
  ): any[] {
    const orphans: any[] = [];
    for (const [key, ref] of Object.entries(refMap)) {
      if (seen.has(key)) continue;
      const refunds_count   = Number((ref as any).refunds_count || 0);
      const refunds_amount  = Number((ref as any).refunds_amount || 0);
      const result_iliquido = parseFloat((-refunds_amount).toFixed(2));
      const fees            = parseFloat((result_iliquido * feeRate).toFixed(2));
      const result          = parseFloat((result_iliquido - fees).toFixed(2));
      orphans.push({ ...seed(key), sales: 0, gross: 0, discounts: 0, revenue: 0, commissions: 0, refunds_count, refunds_amount, result_iliquido, fees, result, result_final: result });
      total.refunds_count   += refunds_count;
      total.refunds_amount  += refunds_amount;
      total.result_iliquido += result_iliquido;
      total.fees            += fees;
      total.result          += result;
      total.result_final    += result;
    }
    return orphans;
  }

  static async general(data: any): Promise<any> {
    const { start, end } = data || {};
    const [
      dayReport,
      dayPaymentTypeReport,
      paymentTypeReport,
      courseReport,
      influencerReport,
    ] = await Promise.all([
      this.day({ start, end }),
      this.dayByPaymentType({ start, end }),
      this.byPaymentType({ start, end }),
      this.byCourse({ start, end }),
      this.influencer({ start, end }),
    ]);

    // Summary totals — inclui pagamentos devolvidos para receita bruta correcta
    const pFilters: string[] = ["status IN ('paid', 'refunded')"];
    const pParams: any[] = [];
    if (start) { pFilters.push("DATE(paid_at) >= ?"); pParams.push(start); }
    if (end)   { pFilters.push("DATE(paid_at) <= ?"); pParams.push(end); }
    const pWhere = `WHERE ${pFilters.join(" AND ")}`;
    const [paymentsSummary] = await BaseModel.query(
      `SELECT COUNT(*) AS total_payments, COALESCE(SUM(amount), 0) AS total_revenue FROM payments ${pWhere}`,
      pParams
    );

    const oFilters: string[] = [];
    const oParams: any[] = [];
    if (start) { oFilters.push("DATE(created_at) >= ?"); oParams.push(start); }
    if (end)   { oFilters.push("DATE(created_at) <= ?"); oParams.push(end); }
    const oWhere = oFilters.length ? `WHERE ${oFilters.join(" AND ")}` : "";
    const [ordersSummary] = await BaseModel.query(
      `SELECT COUNT(*) AS total_orders FROM orders ${oWhere}`,
      oParams
    );

    const rFilters: string[] = [];
    const rParams: any[] = [];
    if (start) { rFilters.push("DATE(created_at) >= ?"); rParams.push(start); }
    if (end)   { rFilters.push("DATE(created_at) <= ?"); rParams.push(end); }
    const rWhere = rFilters.length ? `WHERE ${rFilters.join(" AND ")}` : "";
    const [refundsSummary] = await BaseModel.query(
      `SELECT COUNT(*) AS total_refunds, COALESCE(SUM(amount), 0) AS total_refunds_amount,
              SUM(CASE WHEN status='approved' THEN amount ELSE 0 END) AS approved_refunds_amount
       FROM refunds ${rWhere}`,
      rParams
    );

    const refundsByStatus = await BaseModel.query(
      `SELECT status, COUNT(*) AS total, COALESCE(SUM(amount), 0) AS amount FROM refunds ${rWhere} GROUP BY status`,
      rParams
    );

    return {
      summary: {
        total_orders: Number(ordersSummary?.total_orders || 0),
        total_payments: Number(paymentsSummary?.total_payments || 0),
        total_revenue: Number(paymentsSummary?.total_revenue || 0),
        total_refunds: Number(refundsSummary?.total_refunds || 0),
        total_refunds_amount: Number(refundsSummary?.total_refunds_amount || 0),
        approved_refunds_amount: Number(refundsSummary?.approved_refunds_amount || 0),
        net_revenue: Number(paymentsSummary?.total_revenue || 0) - Number(refundsSummary?.approved_refunds_amount || 0),
      },
      refundsByStatus: Object.fromEntries(
        refundsByStatus.map((r: any) => [r.status, { total: Number(r.total), amount: Number(r.amount) }])
      ),
      dayReport,
      dayPaymentTypeReport,
      paymentTypeReport,
      courseReport,
      influencerReport,
    };
  }

  /**
   * Relatório dedicado a Tipos de Pagamento: resumo por tipo + detalhe diário por tipo.
   * Inclui devoluções (regra do CLAUDE.md) através da cascata financeira.
   */
  static async paymentTypes(data: any): Promise<any> {
    const { start, end } = data || {};
    const [paymentTypeReport, dayPaymentTypeReport] = await Promise.all([
      this.byPaymentType({ start, end }),
      this.dayByPaymentType({ start, end }),
    ]);
    return { paymentTypeReport, dayPaymentTypeReport };
  }

  /**
   * Relatório de Mensagens (SMS/WhatsApp) enviadas, com segmentos e custos.
   * Relatório OPERACIONAL — não inclui devoluções (regra do CLAUDE.md aplica-se a
   * relatórios de vendas; mensagens não têm relação com reembolsos).
   */
  static async messages(data: any): Promise<any> {
    const { start, end } = data || {};
    const filters: string[] = [];
    const params: any[] = [];
    if (start) { filters.push("DATE(created_at) >= ?"); params.push(start); }
    if (end)   { filters.push("DATE(created_at) <= ?"); params.push(end); }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [summaryRow] = await BaseModel.query(
      `SELECT COUNT(*) AS total_messages,
              COALESCE(SUM(status = 'sent'), 0)   AS total_sent,
              COALESCE(SUM(status = 'failed'), 0) AS total_failed,
              COALESCE(SUM(segments), 0)          AS total_segments,
              COALESCE(SUM(total_cost), 0)        AS total_cost
       FROM sent_messages ${where}`,
      params
    );

    const byType = await BaseModel.query(
      `SELECT event_type, channel,
              COUNT(*) AS total,
              COALESCE(SUM(status = 'sent'), 0)   AS sent,
              COALESCE(SUM(status = 'failed'), 0) AS failed,
              COALESCE(SUM(segments), 0)          AS segments,
              COALESCE(SUM(total_cost), 0)        AS cost
       FROM sent_messages ${where}
       GROUP BY event_type, channel
       ORDER BY cost DESC, total DESC`,
      params
    );

    const byChannel = await BaseModel.query(
      `SELECT channel,
              COUNT(*) AS total,
              COALESCE(SUM(status = 'sent'), 0)   AS sent,
              COALESCE(SUM(segments), 0)          AS segments,
              COALESCE(SUM(total_cost), 0)        AS cost
       FROM sent_messages ${where}
       GROUP BY channel`,
      params
    );

    const daily = await BaseModel.query(
      `SELECT DATE(created_at) AS day,
              COUNT(*) AS total,
              COALESCE(SUM(segments), 0)   AS segments,
              COALESCE(SUM(total_cost), 0) AS cost
       FROM sent_messages ${where}
       GROUP BY DATE(created_at)
       ORDER BY day`,
      params
    );

    const num = (v: any) => Number(v || 0);
    return {
      summary: {
        total_messages: num(summaryRow?.total_messages),
        total_sent: num(summaryRow?.total_sent),
        total_failed: num(summaryRow?.total_failed),
        total_segments: num(summaryRow?.total_segments),
        total_cost: num(summaryRow?.total_cost),
      },
      byType: byType.map((r: any) => ({
        event_type: r.event_type || "—",
        channel: r.channel,
        total: num(r.total),
        sent: num(r.sent),
        failed: num(r.failed),
        segments: num(r.segments),
        cost: num(r.cost),
      })),
      byChannel: byChannel.map((r: any) => ({
        channel: r.channel,
        total: num(r.total),
        sent: num(r.sent),
        segments: num(r.segments),
        cost: num(r.cost),
      })),
      daily: daily.map((r: any) => ({
        day: r.day,
        total: num(r.total),
        segments: num(r.segments),
        cost: num(r.cost),
      })),
    };
  }

  /**
   * Retorna vendas individuais (payments + orders) filtradas por período e/ou
   * influencer_id, course_id, day (YYYY-MM-DD) ou month (YYYY-MM).
   */
  static async sales(params: {
    start?: string;
    end?: string;
    influencer_id?: string | number;
    course_id?: string | number;
    day?: string;
    month?: string;
  }): Promise<any[]> {
    const filters: string[] = ["p.status IN ('paid', 'refunded')"];
    const values: any[] = [];

    if (params.day) {
      filters.push("DATE(p.paid_at) = ?");
      values.push(params.day);
    } else if (params.month) {
      // format: YYYY-MM
      filters.push("DATE_FORMAT(p.paid_at, '%Y-%m') = ?");
      values.push(params.month);
    } else {
      if (params.start) { filters.push("DATE(p.paid_at) >= ?"); values.push(params.start); }
      if (params.end)   { filters.push("DATE(p.paid_at) <= ?"); values.push(params.end); }
    }

    if (params.course_id) {
      filters.push("o.course_id = ?");
      values.push(params.course_id);
    }

    if (params.influencer_id) {
      filters.push("inf.id = ?");
      values.push(params.influencer_id);
    }

    const where = `WHERE ${filters.join(" AND ")}`;

    return BaseModel.query<any>(
      `SELECT
        p.id            AS payment_id,
        p.code          AS payment_code,
        p.paid_at,
        p.amount,
        o.id            AS order_id,
        o.subtotal,
        o.discount_total,
        o.code          AS order_code,
        c.name          AS course_name,
        coup.code       AS coupon_code,
        inf.name        AS influencer_name,
        inf.commission  AS commission_pct,
        oc.name         AS customer_name,
        oc.phone        AS customer_phone
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       LEFT JOIN courses c ON c.id = o.course_id
       LEFT JOIN coupons coup ON coup.id = o.coupon_id
       LEFT JOIN influencers inf ON inf.coupon_id = coup.id
       LEFT JOIN order_customers oc ON oc.order_id = o.id
       ${where}
       ORDER BY p.paid_at DESC`,
      values
    );
  }

}