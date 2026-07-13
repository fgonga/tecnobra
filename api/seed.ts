/**
 * seed.ts — Geração de dados aleatórios para testes
 *
 * Gera:
 *   - Cupões
 *   - Influenciadores (ligados a cupões)
 *   - Pedidos com clientes e pagamentos
 *   - Devoluções (refunds) para alguns pedidos completados
 *   - Acertos (settlements) para alguns influenciadores
 *   - Transações de wallet coerentes com todos os movimentos acima
 *
 * Pré-requisito: base de dados já inicializada via `bun run fresh.ts`
 *
 * Uso:
 *   bun run seed.ts              (valores padrão)
 *   bun run seed.ts --orders 200 --influencers 10
 *
 * Opções:
 *   --orders       N   Número de pedidos a criar  (padrão: 100)
 *   --influencers  N   Número de influenciadores  (padrão: 5)
 *   --refund-rate  F   Fracção de pedidos completos a reembolsar (padrão: 0.1)
 */

import "dotenv/config";
import mysql from "mysql2/promise";

// ─── CLI args ─────────────────────────────────────────────────────────────────

function arg(name: string, fallback: number): number {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return Number(process.argv[idx + 1]);
  return fallback;
}

const TARGET_ORDERS      = arg("orders",      100);
const TARGET_INFLUENCERS = arg("influencers",   5);
const REFUND_RATE        = arg("refund-rate", 0.1);
const PLATFORM_FEE_RATE  = 0.02;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function step(msg: string) { console.log(`\n▶ ${msg}`); }
function ok(msg: string)   { console.log(`  ✔ ${msg}`); }

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybe(prob = 0.5): boolean {
  return Math.random() < prob;
}

function randDecimal(min: number, max: number, decimals = 2): string {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function randDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function sqlDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function payCode(): string {
  return Math.random().toString(36).slice(2, 12).toUpperCase().padStart(10, "0");
}

function orderCode(): string {
  return "ORD-" + Date.now().toString(36).toUpperCase() + rand(100, 999);
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

type WalletAccount = "clients" | "treesix" | "partners" | "commissions" | "settled";

/**
 * Replica exacta de WalletModel.transfer para uso no seed.
 * Opera na mesma ligação para manter consistência.
 */
async function walletTransfer(
  conn: mysql.PoolConnection,
  params: {
    amount: number;
    fromAccount: WalletAccount;
    toAccount: WalletAccount;
    influencer_id?: number | null;
    description: string;
    referenceType?: "payment" | "settlement" | "refund" | null;
    referenceId?: number | null;
  }
): Promise<void> {
  const { amount, fromAccount, toAccount, influencer_id, description, referenceType, referenceId } = params;

  // 1. Debitar conta de origem
  await conn.execute(
    `UPDATE wallet_accounts SET balance = balance - ? WHERE name = ?`,
    [amount, fromAccount]
  );
  const [[fromRow]]: any = await conn.execute(
    `SELECT balance FROM wallet_accounts WHERE name = ?`, [fromAccount]
  );
  const fromBalance = parseFloat(fromRow.balance);

  // 2. Creditar conta de destino
  await conn.execute(
    `UPDATE wallet_accounts SET balance = balance + ? WHERE name = ?`,
    [amount, toAccount]
  );
  const [[toRow]]: any = await conn.execute(
    `SELECT balance FROM wallet_accounts WHERE name = ?`, [toAccount]
  );
  const toBalance = parseFloat(toRow.balance);

  // 3. Actualizar KPIs globais (wallet)
  if (fromAccount === "clients") {
    await conn.execute(
      `UPDATE wallet SET balance = balance + ?, total_in = total_in + ?, updated_at = NOW() WHERE id = 1`,
      [amount, amount]
    );
  } else if (toAccount === "clients") {
    await conn.execute(
      `UPDATE wallet SET balance = balance - ?, total_out = total_out + ?, total_refunds_out = total_refunds_out + ?, updated_at = NOW() WHERE id = 1`,
      [amount, amount, amount]
    );
  } else if (toAccount === "settled") {
    await conn.execute(
      `UPDATE wallet SET balance = balance - ?, total_out = total_out + ?, total_settlements_out = total_settlements_out + ?, updated_at = NOW() WHERE id = 1`,
      [amount, amount, amount]
    );
  }

  // 4. Linha de saída (transfer_out)
  await conn.execute(
    `INSERT INTO wallet_transactions
       (type, account, influencer_id, reference_type, reference_id, amount, balance_after, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["transfer_out", fromAccount, influencer_id ?? null,
     referenceType ?? null, referenceId ?? null, -amount, fromBalance, description]
  );

  // 5. Linha de entrada (transfer_in)
  await conn.execute(
    `INSERT INTO wallet_transactions
       (type, account, influencer_id, reference_type, reference_id, amount, balance_after, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["transfer_in", toAccount, influencer_id ?? null,
     referenceType ?? null, referenceId ?? null, amount, toBalance, description]
  );
}

// ─── Dados de exemplo ─────────────────────────────────────────────────────────

const FIRST_NAMES = ["Ana","Carlos","Filipa","João","Maria","Pedro","Sofia","Tiago","Luísa","Rafael",
                     "Beatriz","André","Inês","Diogo","Marta","Bruno","Catarina","Hugo","Vera","Nuno"];
const LAST_NAMES  = ["Silva","Santos","Ferreira","Costa","Oliveira","Pereira","Rodrigues","Alves",
                     "Martins","Carvalho","Lopes","Araújo","Nascimento","Cardoso","Pinto","Gomes"];
const DOMAINS     = ["gmail.com","outlook.com","hotmail.com","sapo.pt","yahoo.com","mail.com"];
const PHONES      = () => "9" + pick(["1","2","3","6"]) + Array.from({length:7}, () => rand(0,9)).join("");
const REASONS     = [
  "Não recebi o acesso ao curso",
  "Conteúdo diferente do esperado",
  "Compra duplicada por erro",
  "Problema técnico no pagamento",
  "Desistência dentro do prazo",
  "Produto não corresponde à descrição",
];

function randomName(): string {
  return pick(FIRST_NAMES) + " " + pick(LAST_NAMES);
}

function randomEmail(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    + rand(1, 99) + "@" + pick(DOMAINS);
}

// ─── 1. Cupões ────────────────────────────────────────────────────────────────

async function seedCoupons(conn: mysql.PoolConnection): Promise<number[]> {
  step("Cupões");

  const now = new Date();
  const ids: number[] = [];

  const coupons = [
    { name: "Desconto 10%",   code: "DESC10",   percentage: 10.00, amount: 0,    active: 1 },
    { name: "Desconto 20%",   code: "DESC20",   percentage: 20.00, amount: 0,    active: 1 },
    { name: "Desconto 5%",    code: "DESC5",    percentage:  5.00, amount: 0,    active: 1 },
    { name: "Promo -500 KZ",  code: "PROMO500", percentage:  0.00, amount: 500,  active: 1 },
    { name: "Promo -1000 KZ", code: "PROMO1K",  percentage:  0.00, amount: 1000, active: 1 },
    { name: "Cupão Expirado", code: "EXPIRED",  percentage: 15.00, amount: 0,    active: 0,
      expire_at: new Date(now.getTime() - 30 * 86400_000) },
  ];

  for (const c of coupons) {
    try {
      const [r]: any = await conn.execute(
        `INSERT INTO coupons (name, code, active, amount, percentage, expire_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [c.name, c.code, c.active, c.amount, c.percentage,
         (c as any).expire_at ? sqlDatetime((c as any).expire_at) : null]
      );
      ids.push(r.insertId);
      ok(`${c.code} (id ${r.insertId})`);
    } catch {
      const [rows]: any = await conn.execute(`SELECT id FROM coupons WHERE code = ?`, [c.code]);
      if (rows.length) ids.push(rows[0].id);
    }
  }

  return ids;
}

// ─── 2. Influenciadores ───────────────────────────────────────────────────────

interface InfluencerInfo { id: number; commission: number }

async function seedInfluencers(
  conn: mysql.PoolConnection,
  couponIds: number[]
): Promise<{ ids: number[]; byCoupon: Map<number, InfluencerInfo> }> {
  step(`Influenciadores (${TARGET_INFLUENCERS})`);

  const ids: number[] = [];
  const byCoupon = new Map<number, InfluencerInfo>();
  const usedCoupons = new Set<number>();

  for (let i = 0; i < TARGET_INFLUENCERS; i++) {
    const name = randomName();

    let couponId: number | null = null;
    const available = couponIds.filter(id => !usedCoupons.has(id));
    if (available.length) {
      couponId = pick(available);
      usedCoupons.add(couponId);
    }

    const commission = parseFloat(randDecimal(5, 25));
    const [r]: any = await conn.execute(
      `INSERT INTO influencers (name, phone, email, status, commission, coupon_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, PHONES(), randomEmail(name), 1, commission, couponId]
    );
    ids.push(r.insertId);
    if (couponId !== null) byCoupon.set(couponId, { id: r.insertId, commission });
    ok(`${name} (id ${r.insertId})`);
  }

  return { ids, byCoupon };
}

// ─── 3. Pedidos, clientes e pagamentos + wallet ───────────────────────────────

interface CreatedOrder {
  id: number;
  status: string;
  subtotal: number;
  paymentId: number | null;
  couponId: number | null;
  influencer: InfluencerInfo | null;
}

async function seedOrders(
  conn: mysql.PoolConnection,
  couponIds: number[],
  courseIds: number[],
  byCoupon: Map<number, InfluencerInfo>
): Promise<CreatedOrder[]> {
  step(`Pedidos (${TARGET_ORDERS})`);

  const start = new Date(Date.now() - 180 * 86400_000);
  const now   = new Date();
  const created: CreatedOrder[] = [];

  for (let i = 0; i < TARGET_ORDERS; i++) {
    const courseId  = pick(courseIds);
    const status    = pick(["pending","completed","completed","completed","canceled","refunded"]);
    const couponId  = maybe(0.25) ? pick(couponIds) : null;
    const amountDue = parseFloat(randDecimal(5000, 25000));
    const discountCoupon = couponId ? parseFloat(randDecimal(200, 2000)) : 0;
    const discountPromo  = maybe(0.15) ? parseFloat(randDecimal(100, 1000)) : 0;
    const discountCard   = maybe(0.1)  ? parseFloat(randDecimal(100, 500))  : 0;
    const discountTotal  = discountCoupon + discountPromo + discountCard;
    const subtotal       = Math.max(0, parseFloat((amountDue - discountTotal).toFixed(2)));
    const amountPaid     = status === "pending" ? 0 : subtotal;
    const createdAt      = randDate(start, now);
    const completedAt    = status === "completed" ? randDate(createdAt, now) : null;
    const canceledAt     = status === "canceled"  ? randDate(createdAt, now) : null;
    const influencer     = couponId ? (byCoupon.get(couponId) ?? null) : null;

    const [orderRes]: any = await conn.execute(
      `INSERT INTO orders
         (code, quantity, status, amount_due, discount_promotion, discount_coupon,
          discount_card, discount_total, subtotal, amount_paid, coupon_id, course_id,
          pending_at, completed_at, canceled_at, created_at)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderCode(), status, amountDue, discountPromo, discountCoupon,
       discountCard, discountTotal, subtotal, amountPaid, couponId, courseId,
       sqlDatetime(createdAt),
       completedAt ? sqlDatetime(completedAt) : null,
       canceledAt  ? sqlDatetime(canceledAt)  : null,
       sqlDatetime(createdAt)]
    );
    const orderId = orderRes.insertId;

    // Cliente
    const customerName = randomName();
    const custStatus = status === "pending" ? "pending" : status === "canceled" ? "canceled" : "completed";
    await conn.execute(
      `INSERT INTO order_customers (order_id, name, email, phone, status) VALUES (?, ?, ?, ?, ?)`,
      [orderId, customerName, randomEmail(customerName), PHONES(), custStatus]
    );

    // Pagamento
    const payType   = pick(["express","qr","ref","aexpress"]);
    const payStatus = status === "pending"   ? pick(["pending","failed"]) :
                      status === "completed" ? "paid" :
                      status === "refunded"  ? "refunded" : "failed";
    const paidAt    = (payStatus === "paid" || payStatus === "refunded")
      ? (completedAt ?? createdAt) : null;

    const [payRes]: any = await conn.execute(
      `INSERT INTO payments
         (order_id, code, amount, status, payment_type, pending_at, paid_at, is_paid, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, payCode(), subtotal, payStatus, payType,
       sqlDatetime(createdAt),
       paidAt ? sqlDatetime(paidAt) : null,
       payStatus === "paid" ? 1 : 0,
       sqlDatetime(createdAt)]
    );
    const paymentId = payRes.insertId;

    // Wallet — apenas para pagamentos efectivos
    if (payStatus === "paid" && subtotal > 0) {
      const fee        = parseFloat((subtotal * PLATFORM_FEE_RATE).toFixed(2));
      const commission = influencer
        ? parseFloat((subtotal * influencer.commission / 100).toFixed(2))
        : 0;

      // 1. Clientes → Treesix (recebimento)
      await walletTransfer(conn, {
        amount: subtotal, fromAccount: "clients", toAccount: "treesix",
        referenceType: "payment", referenceId: paymentId,
        description: `Pagamento recebido: ${orderId}`,
      });

      // 2. Treesix → Comissões (taxa de plataforma)
      if (fee > 0) {
        await walletTransfer(conn, {
          amount: fee, fromAccount: "treesix", toAccount: "commissions",
          referenceType: "payment", referenceId: paymentId,
          description: `Taxa de plataforma: pedido ${orderId}`,
        });
      }

      // 3. Treesix → Parceiros (comissão de influenciador)
      if (influencer && commission > 0) {
        await walletTransfer(conn, {
          amount: commission, fromAccount: "treesix", toAccount: "partners",
          influencer_id: influencer.id,
          referenceType: "payment", referenceId: paymentId,
          description: `Comissão influenciador: pedido ${orderId}`,
        });
      }
    }

    created.push({ id: orderId, status, subtotal, paymentId, couponId, influencer });
  }

  ok(`${TARGET_ORDERS} pedidos criados`);
  return created;
}

// ─── 4. Devoluções + wallet ───────────────────────────────────────────────────

async function seedRefunds(conn: mysql.PoolConnection, orders: CreatedOrder[]) {
  step("Devoluções (refunds)");

  const eligible = orders.filter(o => o.status === "completed" || o.status === "refunded");
  const toRefund = eligible.filter(() => maybe(REFUND_RATE));
  const now      = new Date();
  let count      = 0;

  for (const o of toRefund) {
    if (!o.paymentId || o.subtotal <= 0) continue;

    const refundAmount = parseFloat((o.subtotal * rand(50, 100) / 100).toFixed(2));
    const refStatus    = pick(["pending","approved","rejected","approved"]);
    const createdAt    = randDate(new Date(now.getTime() - 60 * 86400_000), now);
    const processedAt  = refStatus !== "pending" ? randDate(createdAt, now) : null;

    const [r]: any = await conn.execute(
      `INSERT INTO refunds
         (order_id, payment_id, amount, reason, requested_by, status,
          notes, approved_by, processed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.id, o.paymentId, refundAmount, pick(REASONS), "system_seed", refStatus,
       maybe(0.4) ? "Processado via seed de teste" : null,
       refStatus === "approved" ? "admin" : null,
       processedAt ? sqlDatetime(processedAt) : null,
       sqlDatetime(createdAt)]
    );
    const refundId = r.insertId;

    // Wallet — apenas para devoluções aprovadas
    if (refStatus === "approved") {
      const fee        = parseFloat((o.subtotal * PLATFORM_FEE_RATE).toFixed(2));
      const commission = o.influencer
        ? parseFloat((o.subtotal * o.influencer.commission / 100).toFixed(2))
        : 0;

      // Reverter taxa de plataforma: Comissões → Treesix
      if (fee > 0) {
        await walletTransfer(conn, {
          amount: fee, fromAccount: "commissions", toAccount: "treesix",
          referenceType: "refund", referenceId: refundId,
          description: `Estorno taxa plataforma — devolução #${refundId}`,
        });
      }

      // Reverter comissão de influenciador: Parceiros → Treesix
      if (o.influencer && commission > 0) {
        await walletTransfer(conn, {
          amount: commission, fromAccount: "partners", toAccount: "treesix",
          influencer_id: o.influencer.id,
          referenceType: "refund", referenceId: refundId,
          description: `Estorno comissão parceiro — devolução #${refundId}`,
        });
      }

      // Devolver ao cliente: Treesix → Clientes
      await walletTransfer(conn, {
        amount: refundAmount, fromAccount: "treesix", toAccount: "clients",
        referenceType: "refund", referenceId: refundId,
        description: `Devolução aprovada #${refundId}`,
      });
    }

    count++;
  }

  ok(`${count} devoluções criadas`);
}

// ─── 5. Acertos + wallet ──────────────────────────────────────────────────────

async function seedSettlements(conn: mysql.PoolConnection, influencerIds: number[]) {
  step("Acertos (settlements)");

  const now   = new Date();
  let count   = 0;

  // 1 acerto geral por mês nos últimos 3 meses
  for (let m = 0; m < 3; m++) {
    const periodEnd   = new Date(now.getFullYear(), now.getMonth() - m, 0);
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    const totalSales  = parseFloat(randDecimal(100_000, 500_000));
    const totalFees   = parseFloat((totalSales * PLATFORM_FEE_RATE).toFixed(2));
    const netSales    = parseFloat((totalSales - totalFees).toFixed(2));
    const status      = m === 0 ? "pending" : "paid";
    const paidAt      = status === "paid" ? randDate(periodEnd, now) : null;

    const [r]: any = await conn.execute(
      `INSERT INTO settlements
         (type, period_start, period_end, total_sales, total_fees, total_commissions,
          total_refunds_count, total_refunds_amount, net_sales, amount,
          status, paid_at, notes)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      ["general",
       periodStart.toISOString().slice(0, 10), periodEnd.toISOString().slice(0, 10),
       totalSales, totalFees, rand(0, 5), parseFloat(randDecimal(0, 5000)),
       netSales, netSales, status,
       paidAt ? sqlDatetime(paidAt) : null, "Gerado por seed.ts"]
    );

    // Wallet — Treesix → Settled
    if (status === "paid" && netSales > 0) {
      await walletTransfer(conn, {
        amount: netSales, fromAccount: "treesix", toAccount: "settled",
        referenceType: "settlement", referenceId: r.insertId,
        description: `Repasse geral pago: settlement #${r.insertId}`,
      });
    }

    count++;
  }

  // 1-2 acertos por influenciador
  for (const infId of influencerIds) {
    const n = rand(1, 2);
    for (let s = 0; s < n; s++) {
      const daysAgo     = rand(10, 150);
      const periodEnd   = new Date(now.getTime() - daysAgo * 86400_000);
      const periodStart = new Date(periodEnd.getTime() - 30 * 86400_000);
      const commission  = parseFloat(randDecimal(2000, 15000));
      const status      = maybe(0.6) ? "paid" : "pending";
      const paidAt      = status === "paid" ? randDate(periodEnd, now) : null;

      const [r]: any = await conn.execute(
        `INSERT INTO settlements
           (type, influencer_id, period_start, period_end, total_sales, total_fees,
            total_commissions, total_refunds_count, total_refunds_amount,
            net_sales, amount, status, paid_at, notes)
         VALUES (?, ?, ?, ?, ?, 0, ?, 0, 0, ?, ?, ?, ?, ?)`,
        ["influencer", infId,
         periodStart.toISOString().slice(0, 10), periodEnd.toISOString().slice(0, 10),
         parseFloat(randDecimal(20_000, 100_000)), commission,
         commission, commission, status,
         paidAt ? sqlDatetime(paidAt) : null, "Gerado por seed.ts"]
      );

      // Wallet — Parceiros → Settled
      if (status === "paid" && commission > 0) {
        await walletTransfer(conn, {
          amount: commission, fromAccount: "partners", toAccount: "settled",
          influencer_id: infId,
          referenceType: "settlement", referenceId: r.insertId,
          description: `Repasse influenciador pago: settlement #${r.insertId}`,
        });
      }

      count++;
    }
  }

  ok(`${count} acertos criados`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  console.log("═══════════════════════════════════════════");
  console.log("  seed.ts — dados aleatórios para testes");
  console.log("═══════════════════════════════════════════");
  console.log(`  pedidos: ${TARGET_ORDERS}  |  influenciadores: ${TARGET_INFLUENCERS}  |  taxa de reembolso: ${(REFUND_RATE * 100).toFixed(0)}%`);

  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT ?? 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();
  try {
    const [courseRows]: any = await conn.execute(`SELECT id FROM courses`);
    if (!courseRows.length) {
      console.error("\n✘ Nenhum curso encontrado. Corre primeiro: bun run fresh.ts");
      process.exit(1);
    }
    const courseIds: number[] = courseRows.map((r: any) => r.id);

    const couponIds              = await seedCoupons(conn);
    const { ids: influencerIds,
            byCoupon }           = await seedInfluencers(conn, couponIds);
    const orders                 = await seedOrders(conn, couponIds, courseIds, byCoupon);
    await seedRefunds(conn, orders);
    await seedSettlements(conn, influencerIds);
  } finally {
    conn.release();
  }

  await pool.end();

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✔ Seed concluído.");
  console.log("═══════════════════════════════════════════\n");
}

main().catch(err => {
  console.error("\n✘ Erro fatal:", err);
  process.exit(1);
});
