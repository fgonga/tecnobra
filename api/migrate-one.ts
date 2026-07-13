/**
 * migrate-one.ts — corre uma OU várias migrações SQL contra a base de dados
 * existente, sem dropar/recriar nada (ao contrário de migration.ts, que faz
 * reset total). As migrações correm sempre por ordem numérica.
 *
 * Uso:
 *   bun run migrate-one.ts <alvo>
 *   bun run artisan migrate 17          # corre update17.sql
 *   bun run artisan migrate 1-5         # corre update1..update5 (por ordem)
 *   bun run artisan migrate update17    # idem ao 17
 *   bun run artisan migrate init        # corre init.sql
 *
 * Útil em produção, onde só se aplica a(s) migração(ões) nova(s) à mão.
 */

import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import "dotenv/config";

const arg = process.argv[2];
if (!arg) {
  console.error("Uso: bun run migrate-one.ts <alvo>  (ex.: 17, 1-5, update17, update17.sql, init)");
  process.exit(1);
}     

const migrationsDir = path.resolve("./src/db/migrations");
const numOf = (f: string) => parseInt(f.replace(/\D/g, "") || "-1", 10);

function listSql(): string[] {
  return fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
}

/** Resolve um único alvo (número, "updateN", "updateN.sql", "init") → ficheiro. */
function resolveOne(a: string, files: string[]): string | null {
  if (files.includes(a)) return a;
  if (files.includes(`${a}.sql`)) return `${a}.sql`;
  if (/^\d+$/.test(a)) {
    const want = parseInt(a, 10);
    return files.find((f) => /^update/i.test(f) && numOf(f) === want) ?? null;
  }
  return null;
}

/** Devolve a lista ordenada de ficheiros a correr para o alvo dado. */
function filesForArg(a: string): string[] {
  const files = listSql();
  const range = a.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    let lo = parseInt(range[1], 10);
    let hi = parseInt(range[2], 10);
    if (lo > hi) [lo, hi] = [hi, lo];
    return files
      .filter((f) => /^update/i.test(f) && numOf(f) >= lo && numOf(f) <= hi)
      .sort((x, y) => numOf(x) - numOf(y));
  }
  const one = resolveOne(a, files);
  return one ? [one] : [];
}

const targets = filesForArg(arg);
if (!targets.length) {
  console.error(`✗ Nenhuma migração encontrada para "${arg}" em ${migrationsDir}`);
  process.exit(1);
}

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const db = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT || 3306),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  multipleStatements: true,
});

console.log(`BD ${DB_NAME} — vai correr ${targets.length} migração(ões): ${targets.join(", ")}`);

let failed = false;
await db.query("SET FOREIGN_KEY_CHECKS = 0;");
for (const file of targets) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8").trim();
  if (!sql) {
    console.log(`(vazio) ${file} — ignorado`);
    continue;
  }
  const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
  process.stdout.write(`→ ${file} (${statements.length} statement(s))... `);
  try {
    for (const stmt of statements) await db.query(stmt);
    console.log("✓");
  } catch (err: any) {
    console.log("✗");
    console.error(`   ${err?.sqlMessage || err?.message || err}`);
    failed = true;
    break; // pára na primeira falha para não deixar a BD num estado incerto
  }
}
await db.query("SET FOREIGN_KEY_CHECKS = 1;");
await db.end();

if (failed) {
  console.error("✗ Migração interrompida por erro.");
  process.exit(1);
}
console.log("✓ Migração(ões) concluída(s).");
