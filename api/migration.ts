import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import "dotenv/config";

async function runMigrationsFresh() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  const root = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  console.log(`Dropping and recreating database ${DB_NAME}...`);

  await root.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\`;`);
  await root.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await root.end();

  const db = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });

  const migrationsDir = path.resolve("./src/db/migrations");
  const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
        const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
        return numA - numB;
      });

  console.log(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8").trim();
    if (!sql) continue;

    const conn = await db.getConnection();
    await conn.query(`SET FOREIGN_KEY_CHECKS = 0;`);
    try {
      console.log(`Executing migration: ${file}`);
      const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      console.log(`Migration executed: ${file}`);
    } catch (err) {
      console.error(`Failed migration: ${file}`, err);
      process.exit(1);
    } finally {
      await conn.query(`SET FOREIGN_KEY_CHECKS = 1;`);
      conn.release();
    }
  }

  console.log("Database recreated and migrations executed successfully!");
  await db.end();
}

runMigrationsFresh();
