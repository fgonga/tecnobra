import { SettlementModel } from "../models/settlement.model";
import { WalletModel } from "../models/wallet.model";
import { BaseCrudService } from "./BaseCrudService";
import { ReportService } from "./ReportService";
import { configCache } from "./ConfigCache";
import { ValidationError } from "../exceptions/ValidationError";

export class SettlementService extends BaseCrudService<typeof SettlementModel> {
  constructor() {
    super(SettlementModel);
  }

  static async balance(): Promise<any> {
    const [wallet, pendingRows, settlementPending] = await Promise.all([
      WalletModel.get(),
      SettlementModel.query<any>(
        `SELECT COALESCE(SUM(amount), 0) AS pending_amount, COUNT(*) AS pending_count FROM settlements WHERE status = 'pending'`
      ),
      SettlementModel.query<any>(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'general'    AND status = 'pending' THEN amount ELSE 0 END), 0) AS treesix_pending,
          COALESCE(SUM(CASE WHEN type = 'influencer' AND status = 'pending' THEN amount ELSE 0 END), 0) AS partners_pending
        FROM settlements`
      ),
    ]);

    const accounts           = wallet?.accounts ?? { treesix: 0, partners: 0, commissions: 0, clients: 0, settled: 0 };
    const total_collected    = parseFloat(String(wallet?.total_in ?? 0));
    const total_repassed     = parseFloat(String(wallet?.total_settlements_out ?? 0));
    const total_refunds      = parseFloat(String(wallet?.total_refunds_out ?? 0));
    const pending_amount     = parseFloat(pendingRows[0]?.pending_amount ?? 0);
    const pending_count      = parseInt(pendingRows[0]?.pending_count ?? 0, 10);
    const treesix_pending    = parseFloat(settlementPending[0]?.treesix_pending ?? 0);
    const partners_pending   = parseFloat(settlementPending[0]?.partners_pending ?? 0);

    return {
      total_collected,
      total_fees_earned: accounts.commissions,
      total_repassed,
      total_refunds,
      pending_amount,
      pending_count,
      available_to_repass: accounts.treesix,
      treesix_paid: accounts.treesix,
      partners_paid: accounts.partners,
      commissions_paid: accounts.commissions,
      treesix_pending,
      partners_pending,
    };
  }

  static async transactions(params: {
    page?: number;
    perPage?: number;
    account?: string;
    influencer_id?: number | string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    from_account?: string;
    to_account?: string;
    amountMin?: number | string;
    amountMax?: number | string;
    description?: string;
    balanceMin?: number | string;
    balanceMax?: number | string;
  }): Promise<any> {
    const page = Number(params.page ?? 1);
    const perPage = Number(params.perPage ?? 20);
    const offset = (page - 1) * perPage;

    // Validação de account contra allowlist (previne SQL injection)
    const ALLOWED_ACCOUNTS = new Set(['treesix', 'partners', 'commissions', 'clients', 'settled']);
    if (params.account && !ALLOWED_ACCOUNTS.has(params.account)) {
      params.account = undefined;
    }
    if (params.from_account && !ALLOWED_ACCOUNTS.has(params.from_account)) {
      params.from_account = undefined;
    }
    if (params.to_account && !ALLOWED_ACCOUNTS.has(params.to_account)) {
      params.to_account = undefined;
    }

    // Filtros para as queries
    const transferHaving:  string[] = [];
    const transferParams:  any[]    = [];
    const otherConditions: string[] = [];
    const otherParams:     any[]    = [];

    if (params.account) {
      transferHaving.push('(from_account = ? OR to_account = ?)');
      transferParams.push(params.account, params.account);
      otherConditions.push('wt.account = ?');
      otherParams.push(params.account);
    }
    if (params.influencer_id) {
      transferHaving.push('influencer_id = ?');   transferParams.push(params.influencer_id);
      otherConditions.push('wt.influencer_id = ?'); otherParams.push(params.influencer_id);
    }
    if (params.dateFrom) {
      transferHaving.push('DATE(created_at) >= ?');   transferParams.push(params.dateFrom);
      otherConditions.push('DATE(wt.created_at) >= ?'); otherParams.push(params.dateFrom);
    }
    if (params.dateTo) {
      transferHaving.push('DATE(created_at) <= ?');   transferParams.push(params.dateTo);
      otherConditions.push('DATE(wt.created_at) <= ?'); otherParams.push(params.dateTo);
    }
    if (params.type) {
      transferHaving.push('reference_type = ?');          transferParams.push(params.type);
      otherConditions.push('wt.reference_type = ?');      otherParams.push(params.type);
    }
    if (params.from_account) {
      transferHaving.push("MAX(CASE WHEN wt.type = 'transfer_out' THEN wt.account END) = ?");
      transferParams.push(params.from_account);
    }
    if (params.to_account) {
      transferHaving.push("MAX(CASE WHEN wt.type = 'transfer_in' THEN wt.account END) = ?");
      transferParams.push(params.to_account);
      otherConditions.push('wt.account = ?');
      otherParams.push(params.to_account);
    }
    if (params.amountMin !== undefined && params.amountMin !== '') {
      transferHaving.push('MAX(ABS(wt.amount)) >= ?');  transferParams.push(Number(params.amountMin));
      otherConditions.push('ABS(wt.amount) >= ?');      otherParams.push(Number(params.amountMin));
    }
    if (params.amountMax !== undefined && params.amountMax !== '') {
      transferHaving.push('MAX(ABS(wt.amount)) <= ?');  transferParams.push(Number(params.amountMax));
      otherConditions.push('ABS(wt.amount) <= ?');      otherParams.push(Number(params.amountMax));
    }
    if (params.description) {
      transferHaving.push('wt.description LIKE ?');     transferParams.push(`%${params.description}%`);
      otherConditions.push('wt.description LIKE ?');    otherParams.push(`%${params.description}%`);
    }
    if (params.balanceMin !== undefined && params.balanceMin !== '') {
      transferHaving.push(`${params.account ? `MAX(CASE WHEN wt.account = '${params.account}' THEN wt.balance_after END)` : "MAX(CASE WHEN wt.type = 'transfer_in' THEN wt.balance_after END)"} >= ?`);
      transferParams.push(Number(params.balanceMin));
      otherConditions.push('wt.balance_after >= ?'); otherParams.push(Number(params.balanceMin));
    }
    if (params.balanceMax !== undefined && params.balanceMax !== '') {
      transferHaving.push(`${params.account ? `MAX(CASE WHEN wt.account = '${params.account}' THEN wt.balance_after END)` : "MAX(CASE WHEN wt.type = 'transfer_in' THEN wt.balance_after END)"} <= ?`);
      transferParams.push(Number(params.balanceMax));
      otherConditions.push('wt.balance_after <= ?'); otherParams.push(Number(params.balanceMax));
    }

    const havingClause = transferHaving.length  ? `HAVING ${transferHaving.join(' AND ')}`  : '';
    const otherWhere   = otherConditions.length ? `AND ${otherConditions.join(' AND ')}`     : '';

    // balance_after: quando há filtro de conta mostramos o saldo dessa conta;
    // sem filtro mostramos o saldo da conta de destino (transfer_in).
    const balanceAfterExpr = params.account
      ? `MAX(CASE WHEN wt.account = '${params.account}' THEN wt.balance_after END)`
      : `MAX(CASE WHEN wt.type = 'transfer_in' THEN wt.balance_after END)`;

    // Cada transfer é formado por 2 linhas (transfer_out + transfer_in).
    // Agrupamos por (reference_type, reference_id, description) para obter 1 movimento por linha.
    const transferQuery = `
      SELECT
        MIN(wt.id)                                                        AS id,
        MAX(CASE WHEN wt.type = 'transfer_out' THEN wt.account END)      AS from_account,
        MAX(CASE WHEN wt.type = 'transfer_in'  THEN wt.account END)      AS to_account,
        MAX(ABS(wt.amount))                                               AS amount,
        ${balanceAfterExpr}                                               AS balance_after,
        wt.description,
        wt.reference_type,
        wt.reference_id,
        MIN(wt.created_at)                                                AS created_at,
        MAX(wt.influencer_id)                                             AS influencer_id,
        MAX(CASE WHEN wt.reference_type = 'settlement' THEN s.type          END) AS settlement_type,
        MAX(CASE WHEN wt.reference_type = 'settlement' THEN s.period_start  END) AS settlement_period_start,
        MAX(CASE WHEN wt.reference_type = 'settlement' THEN s.period_end    END) AS settlement_period_end
      FROM wallet_transactions wt
      LEFT JOIN settlements s ON wt.reference_type = 'settlement' AND wt.reference_id = s.id
      WHERE wt.type IN ('transfer_out', 'transfer_in')
      GROUP BY wt.reference_type, wt.reference_id, wt.description
      ${havingClause}`;

    // Transações não-transfer (manual_in, manual_out, seeds legados)
    const otherQuery = `
      SELECT
        wt.id,
        NULL          AS from_account,
        wt.account    AS to_account,
        ABS(wt.amount) AS amount,
        wt.balance_after,
        wt.description,
        wt.reference_type,
        wt.reference_id,
        wt.created_at,
        wt.influencer_id,
        NULL AS settlement_type,
        NULL AS settlement_period_start,
        NULL AS settlement_period_end
      FROM wallet_transactions wt
      WHERE wt.type NOT IN ('transfer_out', 'transfer_in')
      ${otherWhere}`;

    const allParams = [...transferParams, ...otherParams];

    const [countRow] = await SettlementModel.query<any>(
      `SELECT COUNT(*) AS total FROM (${transferQuery} UNION ALL ${otherQuery}) AS movements`,
      allParams
    );

    const rows = await SettlementModel.query<any>(
      `${transferQuery} UNION ALL ${otherQuery} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...allParams, perPage, offset]
    );

    const total = parseInt(String(countRow?.total ?? 0), 10);
    return {
      data: rows,
      total,
      current_page: page,
      per_page: perPage,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      from: total > 0 ? offset + 1 : 0,
      to: Math.min(offset + perPage, total),
    };
  }

  /**
   * Saldo disponível por influencer — fonte de verdade.
   *
   * Lógica baseada em vendas reais (não depende de influencer_id em wallet_transactions):
   *   total_earned  = SUM(o.subtotal * inf.commission/100) das ordens pagas de todos os tempos
   *   total_refunds = SUM(r.amount) das devoluções aprovadas das ordens do influencer
   *   total_paid    = SUM(settlements.amount WHERE status = 'paid')
   *   total_pending = SUM(settlements.amount WHERE status IN ('pending','processing'))
   *   available     = MAX(0, total_earned - total_refunds - total_paid - total_pending)
   *
   * Retorna Map: influencer_id → available (number)
   */
  static async influencerAvailableBalances(): Promise<Map<number, number>> {
    // 1. Total ganho de todos os tempos por influencer (comissão sobre vendas brutas pagas)
    const earnedRows = await SettlementModel.query<any>(
      `SELECT inf.id AS influencer_id,
              COALESCE(SUM(o.subtotal * (inf.commission / 100)), 0) AS total_earned
       FROM influencers inf
       JOIN coupons c ON c.id = inf.coupon_id
       JOIN orders o ON o.coupon_id = c.id
       JOIN payments p ON p.order_id = o.id AND p.status = 'paid'
       WHERE inf.status = 1
       GROUP BY inf.id`
    );

    // 2. Total de devoluções aprovadas por influencer (de todos os tempos)
    const refundRows = await SettlementModel.query<any>(
      `SELECT inf.id AS influencer_id,
              COALESCE(SUM(r.amount), 0) AS total_refunds
       FROM influencers inf
       JOIN coupons c ON c.id = inf.coupon_id
       JOIN orders o ON o.coupon_id = c.id
       JOIN refunds r ON r.order_id = o.id AND r.status = 'approved'
       WHERE inf.status = 1
       GROUP BY inf.id`
    );

    // 3. Repasses já pagos + pendentes/em processamento por influencer
    const settlementRows = await SettlementModel.query<any>(
      `SELECT influencer_id,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)                    AS total_paid,
              COALESCE(SUM(CASE WHEN status IN ('pending','processing') THEN amount ELSE 0 END), 0) AS total_pending
       FROM settlements
       WHERE type = 'influencer' AND influencer_id IS NOT NULL
       GROUP BY influencer_id`
    );

    const refundMap = new Map<number, number>();
    for (const r of refundRows) {
      refundMap.set(Number(r.influencer_id), parseFloat(r.total_refunds));
    }

    const settlementMap = new Map<number, { paid: number; pending: number }>();
    for (const r of settlementRows) {
      settlementMap.set(Number(r.influencer_id), {
        paid: parseFloat(r.total_paid),
        pending: parseFloat(r.total_pending),
      });
    }

    const result = new Map<number, number>();
    for (const r of earnedRows) {
      const id           = Number(r.influencer_id);
      const totalEarned  = parseFloat(r.total_earned);
      const totalRefunds = refundMap.get(id) ?? 0;
      const s            = settlementMap.get(id) ?? { paid: 0, pending: 0 };
      const available    = Math.max(0, totalEarned - totalRefunds - s.paid - s.pending);
      result.set(id, parseFloat(available.toFixed(2)));
    }
    return result;
  }

  static async bulkCreateInfluencer(data: {
    period_start: string;
    period_end: string;
    items: Array<{
      influencer_id: number;
      total_sales: number;
      total_refunds_count: number;
      total_refunds_amount: number;
      net_sales: number;
      total_fees: number;
      total_commissions: number;
      amount: number;
    }>;
  }): Promise<any[]> {
    // Saldo real disponível por influencer (baseado em vendas totais - devoluções - repasses)
    const balances = await this.influencerAvailableBalances();

    const created = [];
    for (const item of data.items) {
      const available = balances.get(item.influencer_id) ?? 0;

      // Parceiro sem saldo disponível — ignorar
      if (available <= 0) continue;

      // Limitar o valor ao saldo real disponível (nunca pagar mais do que o parceiro tem)
      const safeAmount = parseFloat(Math.min(item.amount, available).toFixed(2));

      if (safeAmount <= 0) continue;

      const record = await SettlementModel.create({
        type: "influencer",
        influencer_id: item.influencer_id,
        period_start: data.period_start,
        period_end: data.period_end,
        total_sales: item.total_sales,
        total_refunds_count: item.total_refunds_count,
        total_refunds_amount: item.total_refunds_amount,
        net_sales: item.net_sales,
        total_fees: item.total_fees,
        total_commissions: item.total_commissions,
        amount: safeAmount,
        status: "pending",
      });
      created.push(record);
    }

    if (created.length === 0) {
      throw new ValidationError(
        "Nenhum parceiro com saldo disponível para repassar.",
        400, "Danger"
      );
    }

    return created;
  }

  static async addManualTransaction(data: {
    direction: 'in' | 'out';
    account: 'treesix' | 'partners';
    amount: number;
    description: string;
  }): Promise<void> {
    await WalletModel.manual({
      amount: data.amount,
      type: data.direction === 'in' ? 'manual_in' : 'manual_out',
      account: data.account,
      description: data.description,
    });
  }

  static async calculate(data: {
    type: "general" | "influencer";
    period_start: string;
    period_end: string;
    influencer_id?: number | null;
  }): Promise<any> {
    const { type, period_start, period_end, influencer_id } = data;

    // Calcular todos os influenciadores de uma vez (sem influencer_id específico)
    if (type === "influencer" && !influencer_id) {
      const influencers = await SettlementModel.query<any>(
        `SELECT id, name FROM influencers WHERE status = 1`
      );

      // Saldo real disponível por influencer (fonte de verdade)
      const balances = await this.influencerAvailableBalances();

      const results = [];
      for (const inf of influencers) {
        const available = balances.get(inf.id) ?? 0;

        // Sem saldo disponível — não aparece na lista
        if (available <= 0) continue;

        const result = await this.calculate({ type: "influencer", period_start, period_end, influencer_id: inf.id });

        // Usar o menor entre: comissão calculada no período e saldo real disponível
        const safeAmount = parseFloat(Math.min(result.amount, available).toFixed(2));
        if (safeAmount <= 0) continue;

        results.push({
          ...result,
          amount: safeAmount,
          available_balance: available,
          influencer_id: inf.id,
          influencer_name: inf.name,
        });
      }
      return results;
    }

    if (type === "general") {
      // Fonte única da verdade: o relatório (ReportService.day).
      // O repasse geral é, por definição, o "líquido final" do relatório do
      // período — portanto deriva dos mesmos totais, em vez de recalcular com
      // queries paralelas que podiam divergir (ex.: contar pagamentos pagos
      // e ainda assim subtrair devoluções já excluídas → dupla subtracção).
      const { total } = await ReportService.day({ start: period_start, end: period_end });

      // Taxa de plataforma configurável — só para expor fee_rate no retorno.
      const [configRow] = await SettlementModel.query<any>(
        `SELECT platform_fee_rate FROM parametrization WHERE id = 1 LIMIT 1`
      );
      const feeRate = parseFloat(configRow?.platform_fee_rate ?? 0.02);

      const round2 = (v: any) => parseFloat(Number(v ?? 0).toFixed(2));

      return {
        total_sales:          round2(total.revenue),          // bruto recebido (inclui depois devolvidos)
        total_refunds_count:  Number(total.refunds_count ?? 0),
        total_refunds_amount: round2(total.refunds_amount),
        net_sales:            round2(total.result_iliquido),   // bruto − devoluções
        total_fees:           round2(total.fees),              // encargos sobre o ilíquido
        total_commissions:    round2(total.commissions),
        amount:               round2(total.result_final),      // líquido final = repasse
        fee_rate:             feeRate,
      };
    }

    // type === 'influencer'
    if (!influencer_id) {
      return { total_sales: 0, total_refunds_count: 0, total_refunds_amount: 0, net_sales: 0, total_fees: 0, total_commissions: 0, amount: 0 };
    }

    // Vendas do influencer no período — bruto (subtotal) e líquido (amount_paid)
    const salesRows = await SettlementModel.query<any>(
      `SELECT COALESCE(SUM(o.subtotal), 0) AS total_sales, inf.commission AS commission_pct
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         JOIN coupons c ON c.id = o.coupon_id
         JOIN influencers inf ON inf.coupon_id = c.id
         WHERE p.status = 'paid'
           AND inf.id = ?
           AND DATE(p.paid_at) BETWEEN ? AND ?
         GROUP BY inf.commission`,
      [influencer_id, period_start, period_end]
    );

    // Devoluções aprovadas das ordens deste influencer no período
    const refundRows = await SettlementModel.query<any>(
      `SELECT COUNT(*) AS total_refunds_count, COALESCE(SUM(r.amount), 0) AS total_refunds_amount
         FROM refunds r
         JOIN orders o ON o.id = r.order_id
         JOIN coupons c ON c.id = o.coupon_id
         JOIN influencers inf ON inf.coupon_id = c.id
         WHERE r.status = 'approved'
           AND inf.id = ?
           AND DATE(r.created_at) BETWEEN ? AND ?`,
      [influencer_id, period_start, period_end]
    );

    // Taxa de plataforma configurável
    const [configRow] = await SettlementModel.query<any>(
      `SELECT platform_fee_rate FROM parametrization WHERE id = 1 LIMIT 1`
    );
    const feeRate = parseFloat(configRow?.platform_fee_rate ?? 0.02);

    const total_sales = parseFloat(salesRows[0]?.total_sales ?? 0);
    const commission_pct = parseFloat(salesRows[0]?.commission_pct ?? 0);
    const total_refunds_count = parseInt(refundRows[0]?.total_refunds_count ?? 0, 10);
    const total_refunds_amount = parseFloat(refundRows[0]?.total_refunds_amount ?? 0);
    const net_sales = total_sales - total_refunds_amount;
    const total_fees = parseFloat((net_sales * feeRate).toFixed(2));
    // Comissão calculada sobre as vendas líquidas (após devoluções)
    const total_commissions = parseFloat((net_sales * (commission_pct / 100)).toFixed(2));
    // Influencer recebe a sua comissão sobre vendas líquidas
    const amount = total_commissions;

    return { total_sales, total_refunds_count, total_refunds_amount, net_sales, total_fees, total_commissions, amount, fee_rate: feeRate };
  }

  /**
   * Gera automaticamente o repasse geral (treesix) para a semana anterior.
   * Período: segunda-feira anterior → domingo anterior.
   * Idempotente: não cria se já existir para o mesmo período.
   */
  static async autoGenerateGeneral(refDate: Date = new Date()): Promise<any | null> {
    // Calcular segunda-feira anterior e domingo anterior
    const dow = refDate.getDay() // 0=dom, 1=seg, ...
    const daysToLastMonday = dow === 0 ? 6 : dow - 1
    const lastMonday = new Date(refDate)
    lastMonday.setDate(refDate.getDate() - daysToLastMonday - 7)
    lastMonday.setHours(0, 0, 0, 0)
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)

    const period_start = lastMonday.toISOString().slice(0, 10)
    const period_end   = lastSunday.toISOString().slice(0, 10)

    // Idempotência
    const existing = await SettlementModel.query<any>(
      `SELECT id FROM settlements WHERE type = 'general' AND period_start = ? AND period_end = ? LIMIT 1`,
      [period_start, period_end]
    )
    if (existing.length > 0) return null

    const calc = await this.calculate({ type: "general", period_start, period_end })
    if (calc.amount <= 0) return null

    return SettlementModel.create({
      type: "general",
      period_start,
      period_end,
      total_sales:          calc.total_sales,
      total_refunds_count:  calc.total_refunds_count,
      total_refunds_amount: calc.total_refunds_amount,
      net_sales:            calc.net_sales,
      total_fees:           calc.total_fees,
      total_commissions:    calc.total_commissions,
      amount:               calc.amount,
      status:               "pending",
    })
  }

  /**
   * Gera automaticamente os repasses de parceiros para a janela do dia actual (6 ou 20).
   * Respeita o mínimo de pagamento por influencer (ou o global).
   * Idempotente por (influencer_id, period_start, period_end).
   */
  static async autoGeneratePartnerSettlements(refDate: Date = new Date()): Promise<any[]> {
    const cfg = await configCache.get()
    const day1 = cfg.settlement_day_1 ?? 6
    const day2 = cfg.settlement_day_2 ?? 20
    const globalMin = parseFloat(String(cfg.default_min_payout_kz ?? 10000))

    const dom = refDate.getDate()
    const month = refDate.getMonth() // 0-based
    const year  = refDate.getFullYear()

    let period_start: string
    let period_end: string

    if (dom === day1) {
      // Janela: dia_2 do mês anterior → dia (day1-1) do mês actual
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear  = month === 0 ? year - 1 : year
      const lastDayPrev = new Date(year, month, 0).getDate()
      const startDay = Math.min(day2, lastDayPrev)
      period_start = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`
      period_end   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day1 - 1).padStart(2, "0")}`
    } else if (dom === day2) {
      // Janela: dia_1 → dia (day2-1) do mês actual
      period_start = `${year}-${String(month + 1).padStart(2, "0")}-${String(day1).padStart(2, "0")}`
      period_end   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day2 - 1).padStart(2, "0")}`
    } else {
      return [] // Não é dia de repasse
    }

    const influencers = await SettlementModel.query<any>(
      `SELECT id, name, min_payout_kz FROM influencers WHERE status = 1`
    )

    const created: any[] = []

    for (const inf of influencers) {
      // Idempotência
      const existing = await SettlementModel.query<any>(
        `SELECT id FROM settlements WHERE type = 'influencer' AND influencer_id = ? AND period_start = ? AND period_end = ? LIMIT 1`,
        [inf.id, period_start, period_end]
      )
      if (existing.length > 0) continue

      const calc = await this.calculate({ type: "influencer", period_start, period_end, influencer_id: inf.id })
      if (calc.amount <= 0) continue

      const minPayout = inf.min_payout_kz != null ? parseFloat(String(inf.min_payout_kz)) : globalMin
      if (calc.amount < minPayout) continue // Não atingiu o mínimo — acumula para próxima janela

      const record = await SettlementModel.create({
        type:                 "influencer",
        influencer_id:        inf.id,
        period_start,
        period_end,
        total_sales:          calc.total_sales,
        total_refunds_count:  calc.total_refunds_count,
        total_refunds_amount: calc.total_refunds_amount,
        net_sales:            calc.net_sales,
        total_fees:           calc.total_fees,
        total_commissions:    calc.total_commissions,
        amount:               calc.amount,
        status:               "pending",
      })
      created.push(record)
    }

    return created
  }
}
