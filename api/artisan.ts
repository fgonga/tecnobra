#!/usr/bin/env bun
/**
 * artisan.ts — CLI central da aplicação (inspirado no php artisan)
 *
 * Uso:
 *   bun artisan.ts <comando> [opções]
 *   bun run artisan <comando> [opções]
 *
 * Exemplos:
 *   bun artisan.ts db:fresh
 *   bun artisan.ts db:seed --orders 200
 *   bun artisan.ts user:reset-password admin 12345
 *   bun artisan.ts payments:recover --start 2026-01-01 --end 2026-03-31
 */

import { Command } from "commander";
import { updatePendingOrders } from "./src/schedules/tasks/updatePendingOrders.ts";
import { abandonedRemember }   from "./src/schedules/tasks/abandonedRemember.ts";
import { sendDayResume }       from "./src/schedules/tasks/sendDayResume.ts";

const program = new Command();

program
  .name("artisan")
  .description("CLI de gestão da aplicação")
  .version("1.0.0");

// ─── DB ───────────────────────────────────────────────────────────────────────

program
  .command("db:fresh")
  .description("Reset completo: recria a BD, corre migrations, setup e seed mock")
  .action(() => run("fresh.ts"));

program
  .command("db:migrate")
  .description("RESET TOTAL: dropa e recria a BD e corre TODAS as migrations")
  .action(() => run("migration.ts"));

program
  .command("migrate <alvo>")
  .alias("migration")
  .description("Corre migração(ões) na BD existente, sem dropar. Ex.: migrate 17 | migrate 1-5")
  .action((alvo) => run("migrate-one.ts", [alvo]));

program
  .command("db:setup")
  .description("Cria utilizador admin e configuração base")
  .action(() => run("setup.ts"));

program
  .command("db:seed")
  .description("Gera dados de teste aleatórios")
  .option("--orders <n>",      "Número de pedidos a criar",        "100")
  .option("--influencers <n>", "Número de influenciadores a criar", "5")
  .action((opts) => run("seed.ts", ["--orders", opts.orders, "--influencers", opts.influencers]));

program
  .command("db:seed:wallet")
  .description("Seed inicial do sistema de wallet")
  .action(() => run("migrate-wallet.ts"));

// ─── Utilizadores ─────────────────────────────────────────────────────────────

program
  .command("user:reset-password <identifier> <password>")
  .description("Redefine a senha de um utilizador (username, email ou telefone)")
  .action((identifier, password) => run("reset-password.ts", [identifier, password]));

// ─── Pagamentos ───────────────────────────────────────────────────────────────

program
  .command("payments:recover")
  .description("Envia WhatsApp a clientes com pagamentos falhados no período")
  .requiredOption("--start <YYYY-MM-DD>", "Data de início")
  .requiredOption("--end <YYYY-MM-DD>",   "Data de fim")
  .option("--dry", "Simula sem enviar mensagens nem gravar")
  .action((opts) => {
    const extra = ["--start", opts.start, "--end", opts.end];
    if (opts.dry) extra.push("--dry");
    run("recover-payments.ts", extra);
  });

// ─── Schedules / Jobs ─────────────────────────────────────────────────────────

program
  .command("order:update-pending")
  .description("Atualiza o estado de pedidos pendentes")
  .action(async () => { await updatePendingOrders(); process.exit(0); });

program
  .command("order:abandoned-remember")
  .description("Lembra clientes com pedidos abandonados")
  .action(async () => { await abandonedRemember(); process.exit(0); });

program
  .command("resume:send-day")
  .description("Envia o resumo diário")
  .action(async () => { await sendDayResume(); process.exit(0); });

// ─── helpers ─────────────────────────────────────────────────────────────────

function run(script: string, args: string[] = []) {
  const result = Bun.spawnSync(["bun", "run", script, ...args], {
    cwd: import.meta.dir,
    stdio: ["inherit", "inherit", "inherit"],
  });
  process.exit(result.exitCode ?? 0);
}

// ─── parse ────────────────────────────────────────────────────────────────────

program.parse();
