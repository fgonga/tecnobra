/**
 * migrate-wallet.ts — Processa transações de carteira para o período
 * 2026-03-16 → 2026-03-21 (seed inicial do sistema de wallet).
 *
 * Executar APÓS as migrations e o setup:
 *   bun migration.ts && bun setup.ts && bun migrate-wallet.ts
 */
import { db } from "./src/db/db";

const SEED_START = "2026-03-16";
const SEED_END   = "2026-03-22";

async function transfer(
  conn: any,
  params: {
    amount: number;
    fromAccount: string;
    toAccount: string;
    influencer_id?: number | null;
    description: string;
    referenceType?: string | null;
    referenceId?: number | null;
  }
): Promise<void> {
  await conn.execute(
    `UPDATE wallet_accounts SET balance = balance - ? WHERE name = ?`,
    [params.amount, params.fromAccount]
  );
  const [[fromRow]]: any = await conn.execute(
    `SELECT balance FROM wallet_accounts WHERE name = ?`,
    [params.fromAccount]
  );
  const fromBalance = parseFloat(fromRow?.balance ?? 0);

  await conn.execute(
    `UPDATE wallet_accounts SET balance = balance + ? WHERE name = ?`,
    [params.amount, params.toAccount]
  );
  const [[toRow]]: any = await conn.execute(
    `SELECT balance FROM wallet_accounts WHERE name = ?`,
    [params.toAccount]
  );
  const toBalance = parseFloat(toRow?.balance ?? 0);

  if (params.fromAccount === "clients") {
    await conn.execute(
      `UPDATE wallet SET balance = balance + ?, total_in = total_in + ?, updated_at = NOW() WHERE id = 1`,
      [params.amount, params.amount]
    );
  } else if (params.toAccount === "clients") {
    await conn.execute(
      `UPDATE wallet SET balance = balance - ?, total_out = total_out + ?, total_refunds_out = total_refunds_out + ?, updated_at = NOW() WHERE id = 1`,
      [params.amount, params.amount, params.amount]
    );
  } else if (params.toAccount === "settled") {
    await conn.execute(
      `UPDATE wallet SET balance = balance - ?, total_out = total_out + ?, total_settlements_out = total_settlements_out + ?, updated_at = NOW() WHERE id = 1`,
      [params.amount, params.amount, params.amount]
    );
  }

  await conn.execute(
    `INSERT INTO wallet_transactions (type, account, influencer_id, reference_type, reference_id, amount, balance_after, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["transfer_out", params.fromAccount, params.influencer_id ?? null, params.referenceType ?? null, params.referenceId ?? null, -params.amount, fromBalance, params.description]
  );

  await conn.execute(
    `INSERT INTO wallet_transactions (type, account, influencer_id, reference_type, reference_id, amount, balance_after, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["transfer_in", params.toAccount, params.influencer_id ?? null, params.referenceType ?? null, params.referenceId ?? null, params.amount, toBalance, params.description]
  );
}

async function main() {
  console.log(`\n💰 Seeding wallet transactions (${SEED_START} → ${SEED_END})...\n`);

  const [[configRow]]: any = await db.query(
    `SELECT platform_fee_rate FROM parametrization WHERE id = 1 LIMIT 1`
  );
  const feeRate = parseFloat(configRow?.platform_fee_rate ?? 0.02);
  console.log(`  Fee rate: ${(feeRate * 100).toFixed(2)}%`);

  // ── Pagamentos pagos no período ───────────────────────────────────
  const [payments]: any = await db.query(
    `SELECT p.id, p.code, p.amount, o.coupon_id, o.subtotal
     FROM payments p
     LEFT JOIN orders o ON o.id = p.order_id
     WHERE p.status IN ('paid', 'refunded')
       AND DATE(p.paid_at) >= ? AND DATE(p.paid_at) <= ?
     ORDER BY p.paid_at ASC, p.id ASC`,
    [SEED_START, SEED_END]
  );

  console.log(`  ${payments.length} pagamento(s)`);

  for (const pay of payments) {
    const amount = parseFloat(pay.amount);

    await transfer(db, {
      amount,
      fromAccount: "clients",
      toAccount: "treesix",
      referenceType: "payment",
      referenceId: pay.id,
      description: `Pagamento recebido: ${pay.code}`,
    });

    const platformFee = parseFloat((amount * feeRate).toFixed(2));
    if (platformFee > 0) {
      await transfer(db, {
        amount: platformFee,
        fromAccount: "treesix",
        toAccount: "commissions",
        referenceType: "payment",
        referenceId: pay.id,
        description: `Encargo plataforma ${(feeRate * 100).toFixed(2)}% — ${pay.code}`,
      });
    }

    if (pay.coupon_id) {
      const [[influencer]]: any = await db.query(
        `SELECT id, commission FROM influencers WHERE coupon_id = ? LIMIT 1`,
        [pay.coupon_id]
      );
      if (influencer) {
        const commission = parseFloat((parseFloat(pay.subtotal) * (influencer.commission / 100)).toFixed(2));
        if (commission > 0) {
          await transfer(db, {
            amount: commission,
            fromAccount: "treesix",
            toAccount: "partners",
            influencer_id: influencer.id,
            referenceType: "payment",
            referenceId: pay.id,
            description: `Comissão ${influencer.commission}% — ${pay.code}`,
          });
        }
      }
    }

    console.log(`    ✓ ${pay.code} (${amount} Kz)`);
  }

  // ── Devoluções aprovadas no período ───────────────────────────────
  const [refunds]: any = await db.query(
    `SELECT r.id, r.amount, r.payment_id
     FROM refunds r
     WHERE r.status = 'approved'
       AND DATE(COALESCE(r.processed_at, r.updated_at)) >= ?
       AND DATE(COALESCE(r.processed_at, r.updated_at)) <= ?
     ORDER BY r.id ASC`,
    [SEED_START, SEED_END]
  );

  console.log(`\n  ${refunds.length} devolução(ões)`);

  for (const ref of refunds) {
    if (!ref.payment_id) continue;

    const [txns]: any = await db.query(
      `SELECT type, account, influencer_id, amount
       FROM wallet_transactions
       WHERE reference_type = 'payment' AND reference_id = ?`,
      [ref.payment_id]
    );

    const commissionIn = txns.find((t: any) => t.type === "transfer_in" && t.account === "commissions");
    if (commissionIn) {
      await transfer(db, {
        amount: Math.abs(Number(commissionIn.amount)),
        fromAccount: "commissions",
        toAccount: "treesix",
        referenceType: "refund",
        referenceId: ref.id,
        description: `Estorno encargo plataforma – devolução #${ref.id}`,
      });
    }

    const partnerIn = txns.find((t: any) => t.type === "transfer_in" && t.account === "partners");
    if (partnerIn) {
      await transfer(db, {
        amount: Math.abs(Number(partnerIn.amount)),
        fromAccount: "partners",
        toAccount: "treesix",
        influencer_id: partnerIn.influencer_id,
        referenceType: "refund",
        referenceId: ref.id,
        description: `Estorno comissão parceiro – devolução #${ref.id}`,
      });
    }

    const originalIn = txns.find((t: any) => t.type === "transfer_in" && t.account === "treesix");
    if (originalIn) {
      await transfer(db, {
        amount: Number(ref.amount),
        fromAccount: "treesix",
        toAccount: "clients",
        referenceType: "refund",
        referenceId: ref.id,
        description: `Devolução aprovada: refund #${ref.id}`,
      });
    }

    console.log(`    ✓ Refund #${ref.id} (${ref.amount} Kz)`);
  }

  // ── Settlements pagos no período ──────────────────────────────────
  const [settlements]: any = await db.query(
    `SELECT id, type, influencer_id, amount, total_fees
     FROM settlements
     WHERE status = 'paid'
       AND DATE(paid_at) >= ? AND DATE(paid_at) <= ?
     ORDER BY id ASC`,
    [SEED_START, SEED_END]
  );

  console.log(`\n  ${settlements.length} repasse(s)`);

  for (const s of settlements) {
    const fromAccount = s.type === "general" ? "treesix" : "partners";
    await transfer(db, {
      amount: parseFloat(s.amount),
      fromAccount,
      toAccount: "settled",
      referenceType: "settlement",
      referenceId: s.id,
      description: `Repasse pago: settlement #${s.id}`,
      influencer_id: s.type === "influencer" ? s.influencer_id : null,
    });

    if (s.type === "general") {
      const totalFees = parseFloat(s.total_fees ?? 0);
      if (totalFees > 0) {
        await transfer(db, {
          amount: totalFees,
          fromAccount: "commissions",
          toAccount: "settled",
          referenceType: "settlement",
          referenceId: s.id,
          description: `Encargos plataforma liquidados: settlement #${s.id}`,
        });
      }
    }

    console.log(`    ✓ Settlement #${s.id} (${s.amount} Kz)`);
  }

  // ── Resumo ────────────────────────────────────────────────────────
  const [[wallet]]: any = await db.query(`SELECT * FROM wallet WHERE id = 1`);
  const [accounts]: any = await db.query(`SELECT name, balance FROM wallet_accounts ORDER BY name`);

  console.log(`\n══════════════════════════════════════════`);
  console.log(`  Wallet seed completo!`);
  console.log(`══════════════════════════════════════════`);
  console.log(`  Wallet global:`);
  console.log(`    Balance:     ${wallet.balance} Kz`);
  console.log(`    Total in:    ${wallet.total_in} Kz`);
  console.log(`    Total out:   ${wallet.total_out} Kz`);
  console.log(`  Contas:`);
  for (const acc of accounts) {
    console.log(`    ${acc.name.padEnd(14)} ${acc.balance} Kz`);
  }
  console.log(`══════════════════════════════════════════\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Wallet seed failed:", err);
  process.exit(1);
});
