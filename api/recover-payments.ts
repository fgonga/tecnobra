/**
 * recover-payments.ts — Recuperação de pagamentos falhados
 *
 * Envia mensagem WhatsApp personalizada a todos os clientes que tiveram
 * um pagamento falhado no período indicado, sem terem sido ainda notificados.
 *
 * Uso:
 *   bun run recover-payments.ts --start 2026-03-01 --end 2026-03-26
 *
 * Opções:
 *   --start  YYYY-MM-DD  Data de início (obrigatório)
 *   --end    YYYY-MM-DD  Data de fim    (obrigatório)
 *   --dry    Simula sem enviar mensagens nem gravar
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import axios from "axios";
import { config } from "./src/config/env";

// ─── CLI args ─────────────────────────────────────────────────────────────────

function arg(name: string): string | null {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

const START = arg("start");
const END   = arg("end");
const DRY   = process.argv.includes("--dry");

if (!START || !END) {
  console.error("✘  Uso: bun run recover-payments.ts --start YYYY-MM-DD --end YYYY-MM-DD");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function step(msg: string) { console.log(`\n▶ ${msg}`); }
function ok(msg: string)   { console.log(`  ✔ ${msg}`); }
function skip(msg: string) { console.log(`  ↷ ${msg}`); }
function warn(msg: string) { console.log(`  ⚠ ${msg}`); }

function buildMessage(name: string, orderCode: string): string {
  const firstName = name.split(" ")[0];
  return `Olá ${firstName}! 👋

Notámos que tiveste uma dificuldade com o pagamento da tua inscrição (ref. ${orderCode}).

✅ Já está tudo resolvido — podes tentar novamente agora mesmo:
https://checkout.academiatreesix.com/cart/${orderCode}

Precisas de ajuda? Fala connosco:
https://wa.me/message/TFRDLMMC2L2TG1`;
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({
      phone:   `244${phone.replace(/^244/, "")}@s.whatsapp.net`,
      message,
    });
    await axios.post(
      `${config.wpp.url}/send/message`,
      body,
      {
        auth: { username: config.wpp.user, password: config.wpp.password },
        headers: {
          "X-Device-Id":  config.wpp.deviceId,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10_000,
      }
    );
    return true;
  } catch {
    return false;
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  console.log("═══════════════════════════════════════════════════════");
  console.log("  recover-payments.ts — Recuperação de pagamentos");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  período: ${START} → ${END}${DRY ? "  [DRY RUN]" : ""}`);

  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT ?? 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  // ─── Garantir coluna de tracking ──────────────────────────────────────────
  step("Verificar coluna recovery_notified_at");
  await pool.execute(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS recovery_notified_at DATETIME NULL DEFAULT NULL
  `);
  ok("Coluna garantida");

  // ─── Buscar pagamentos falhados sem notificação prévia ────────────────────
  step("Buscar pagamentos falhados");

  const [rows]: any = await pool.execute(
    `SELECT
       p.id            AS payment_id,
       p.code          AS payment_code,
       p.phone         AS payment_phone,
       p.amount,
       o.id            AS order_id,
       o.code          AS order_code,
       oc.name         AS customer_name,
       COALESCE(oc.phone, p.phone) AS phone
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     LEFT JOIN order_customers oc ON oc.order_id = o.id
     WHERE p.status = 'failed'
       AND DATE(p.created_at) >= ?
       AND DATE(p.created_at) <= ?
       AND p.recovery_notified_at IS NULL
     GROUP BY p.id
     ORDER BY p.created_at ASC`,
    [START, END]
  );

  ok(`${rows.length} pagamento(s) elegível(is)`);

  if (rows.length === 0) {
    console.log("\n  Nenhum pagamento para recuperar no período indicado.");
    await pool.end();
    return;
  }

  // ─── Enviar mensagens ─────────────────────────────────────────────────────
  step(`Enviar mensagens${DRY ? " (DRY RUN)" : ""}`);

  let sent = 0;
  let failed = 0;
  let skippedNoPhone = 0;

  for (const row of rows) {
    const phone = row.phone?.replace(/\s/g, "");
    const name  = row.customer_name || "Cliente";

    if (!phone) {
      skip(`Pedido ${row.order_code} — sem telefone`);
      skippedNoPhone++;
      continue;
    }

    const message = buildMessage(name, row.order_code);

    if (DRY) {
      ok(`[DRY] ${phone} — ${name} (${row.order_code})`);
      sent++;
      continue;
    }

    const success = await sendWhatsApp(phone, message);
    if (success) {
      await pool.execute(
        `UPDATE payments SET recovery_notified_at = NOW() WHERE id = ?`,
        [row.payment_id]
      );
      ok(`Enviado → ${phone} — ${name} (${row.order_code})`);
      sent++;
    } else {
      warn(`Falhou → ${phone} — ${name} (${row.order_code})`);
      failed++;
    }
  }

  // ─── Estatísticas ─────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  ESTATÍSTICAS");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Elegíveis         ${rows.length}`);
  console.log(`  Enviadas          ${sent}`);
  console.log(`  Falhadas          ${failed}`);
  console.log(`  Sem telefone      ${skippedNoPhone}`);
  if (DRY) console.log("\n  ⚠  DRY RUN — nenhuma mensagem foi enviada nem gravada.");

  // ─── Recuperações já confirmadas neste período ────────────────────────────
  const [recoveredRows]: any = await pool.execute(
    `SELECT COUNT(*) AS total, COALESCE(SUM(o.subtotal), 0) AS value
     FROM payments p
     JOIN orders o ON o.id = p.order_id
     WHERE p.recovery_notified_at IS NOT NULL
       AND DATE(p.recovery_notified_at) >= ?
       AND DATE(p.recovery_notified_at) <= ?
       AND o.status = 'completed'`,
    [START, END]
  );
  const recovered      = Number(recoveredRows[0]?.total ?? 0);
  const recoveredValue = Number(recoveredRows[0]?.value ?? 0);
  const rate           = sent > 0 ? ((recovered / sent) * 100).toFixed(1) : "0.0";

  console.log(`\n  Recuperados       ${recovered}`);
  console.log(`  Taxa recuperação  ${rate}%`);
  console.log(`  Valor recuperado  ${recoveredValue.toLocaleString("pt-PT")} Kz`);
  console.log("═══════════════════════════════════════════════════════\n");

  await pool.end();
}

main().catch(err => {
  console.error("\n✘ Erro fatal:", err);
  process.exit(1);
});
