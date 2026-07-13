/*
 *  Tecnobra — Reset completo de desenvolvimento:
 *    1. recria a base de dados e corre as migrações (migration.ts)
 *    2. setup (admin, perfis, parametrização, templates)
 *    3. seed de dados demo (seed.ts)
 *
 *  Uso: bun run fresh.ts   |   bun artisan.ts db:fresh
 */

function run(script: string, args: string[] = []) {
    const result = Bun.spawnSync(["bun", "run", script, ...args], {
        cwd: import.meta.dir,
        stdio: ["inherit", "inherit", "inherit"],
    });
    if (result.exitCode !== 0) {
        console.error(`✗ ${script} terminou com código ${result.exitCode}`);
        process.exit(result.exitCode ?? 1);
    }
}

console.log("── migração ──");
run("migration.ts");
console.log("── setup ──");
run("setup.ts");
console.log("── seed ──");
run("seed.ts");
console.log("✓ fresh concluído");
