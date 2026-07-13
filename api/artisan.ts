#!/usr/bin/env bun
/**
 * artisan.ts — CLI central da aplicação Tecnobra (inspirado no php artisan)
 *
 * Uso:
 *   bun artisan.ts <comando> [opções]
 *   bun run artisan <comando> [opções]
 *
 * Exemplos:
 *   bun artisan.ts db:fresh
 *   bun artisan.ts db:seed
 *   bun artisan.ts user:reset-password admin 12345
 */

import { Command } from "commander";

const program = new Command();

program
  .name("artisan")
  .description("CLI de gestão da aplicação Tecnobra")
  .version("1.0.0");

// ─── DB ───────────────────────────────────────────────────────────────────────

program
  .command("db:fresh")
  .description("Reset completo: recria a BD, corre migrations, setup e seed demo")
  .action(() => run("fresh.ts"));

program
  .command("db:migrate")
  .description("RESET TOTAL: dropa e recria a BD e corre TODAS as migrations")
  .action(() => run("migration.ts"));

program
  .command("migrate <alvo>")
  .alias("migration")
  .description("Corre migração(ões) na BD existente, sem dropar. Ex.: migrate 1 | migrate 1-5")
  .action((alvo) => run("migrate-one.ts", [alvo]));

program
  .command("db:setup")
  .description("Cria utilizador admin, perfis e configuração base")
  .action(() => run("setup.ts"));

program
  .command("db:seed")
  .description("Gera dados demo (obras, empresas, trabalhadores, equipamentos, materiais)")
  .action(() => run("seed.ts"));

// ─── Utilizadores ─────────────────────────────────────────────────────────────

program
  .command("user:reset-password <identifier> <password>")
  .description("Redefine a palavra-passe de um utilizador (username ou telefone)")
  .action((identifier, password) => run("reset-password.ts", [identifier, password]));

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
