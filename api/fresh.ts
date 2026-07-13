/**
 * fresh.ts — Reset completo da base de dados para desenvolvimento
 *
 * O que faz, por ordem:
 *   1. Apaga e recria a base de dados
 *   2. Corre todas as migrations
 *   3. Cria o utilizador admin e a configuração base (setup)
 *   4. Sincroniza os cursos do mock Thinkific
 *   5. Define "Bundle Mock A" como curso padrão
 *
 * Uso: bun run fresh.ts
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import argon2 from "argon2";
import { seedNotificationTemplates } from "./src/db/seedNotificationTemplates";

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// ─── helpers ──────────────────────────────────────────────────────────────────

function step(msg: string) {
  console.log(`\n▶ ${msg}`);
}

function ok(msg: string) {
  console.log(`  ✔ ${msg}`);
}

// ─── 1. Recriar base de dados ─────────────────────────────────────────────────

async function recreateDatabase() {
  step("Recriar base de dados");

  const root = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  await root.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
  await root.query(
    `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await root.end();

  ok(`Base de dados "${DB_NAME}" recriada.`);
}

// ─── 2. Migrations ────────────────────────────────────────────────────────────

async function runMigrations(pool: mysql.Pool) {
  step("Migrations");

  const dir = path.resolve("./src/db/migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => {
      const n = (s: string) => parseInt(s.replace(/\D/g, "") || "0", 10);
      return n(a) - n(b);
    });

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf-8").trim();
    if (!sql) continue;

    const conn = await pool.getConnection();
    await conn.query(`SET FOREIGN_KEY_CHECKS = 0;`);
    try {
      for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
        await conn.query(stmt);
      }
      ok(file);
    } catch (err) {
      console.error(`  ✘ Falha em ${file}:`, err);
      process.exit(1);
    } finally {
      await conn.query(`SET FOREIGN_KEY_CHECKS = 1;`);
      conn.release();
    }
  }
}

// ─── 3. Setup (admin + config) ────────────────────────────────────────────────

async function runSetup(pool: mysql.Pool) {
  step("Setup");

  const conn = await pool.getConnection();
  try {
    const password = await argon2.hash("admin");

    const [userResult]: any = await conn.execute(
      `INSERT INTO users (name, username, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
      ["Bantu Internet Technologies", "admin", "925924797", password, "superadmin"]
    );
    ok("Utilizador admin criado.");

    // Regra * dá acesso total a todas as rotas
    await conn.execute(
      `INSERT INTO user_rules (user_id, rule) VALUES (?, ?)`,
      [userResult.insertId, "*"]
    );
    ok("Permissão * atribuída ao admin.");

    await conn.execute(
      `INSERT INTO parametrization (promotion_active, promotion_quantity, promotion_quantity_max) VALUES (1, 0, 0)`
    );
    ok("Configuração base criada.");
  } finally {
    conn.release();
  }
}

// ─── 4. Importar cursos do mock ───────────────────────────────────────────────

const MOCK_PRODUCTS = [
  {
    id: 2001, name: "Curso Mock A", slug: "produto-mock-a",
    productable_type: "Course", productable_id: 1001,
    description: null, price: 20000, days_until_expiry: 365,
    thinkific_id: 1001,
  },
  {
    id: 2002, name: "Curso Mock B", slug: "produto-mock-b",
    productable_type: "Course", productable_id: 1002,
    description: null, price: 5000, days_until_expiry: 365,
    thinkific_id: 1002,
  },
  {
    id: 2003, name: "Bundle Mock A", slug: "bundle-mock-a",
    productable_type: "Bundle", productable_id: 3001,
    description: null, price: 10000, days_until_expiry: 365,
    thinkific_id: 3001,
  },
];

async function importCourses(pool: mysql.Pool): Promise<number> {
  step("Importar cursos mock");

  const conn = await pool.getConnection();
  let bundleMockId: number | null = null;

  try {
    for (const p of MOCK_PRODUCTS) {
      const [result]: any = await conn.execute(
        `INSERT INTO courses (name, slug, product_id, thinkific_id, thinkific_type, description, price, days_until_expiry)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.name, p.slug, String(p.id), String(p.thinkific_id), p.productable_type, p.description, p.price, p.days_until_expiry]
      );
      ok(`${p.name} (id local: ${result.insertId})`);
      if (p.slug === "bundle-mock-a") bundleMockId = result.insertId;
    }
  } finally {
    conn.release();
  }

  if (!bundleMockId) throw new Error("Bundle Mock A não foi inserido.");
  return bundleMockId;
}

// ─── 5. Definir curso padrão ──────────────────────────────────────────────────

async function setDefaultCourse(pool: mysql.Pool, courseId: number) {
  step("Definir curso padrão");

  const conn = await pool.getConnection();
  try {
    await conn.execute(
      `UPDATE parametrization SET default_course_id = ? WHERE id = 1`,
      [courseId]
    );
    ok(`Curso padrão definido: id ${courseId} (Bundle Mock A)`);
  } finally {
    conn.release();
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  fresh.ts — reset completo para dev");
  console.log("═══════════════════════════════════════════");

  await recreateDatabase();

  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  await runMigrations(pool);
  await runSetup(pool);
  const bundleId = await importCourses(pool);
  await setDefaultCourse(pool, bundleId);

  step("Seed dos templates de notificação");
  const seeded = await seedNotificationTemplates(pool);
  ok(`${seeded} template(s) de notificação inserido(s).`);

  await pool.end();

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✔ Pronto. Base de dados limpa e configurada.");
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n✘ Erro fatal:", err);
  process.exit(1);
});
