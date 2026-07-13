// Build de produção com troca automática de .env:
//   1) .env-prod  → .env   (config de produção)
//   2) vite build
//   3) .env-local → .env   (repõe a config local, mesmo se o build falhar)
//
// Preserva o código de saída do build, para o deploy detetar falhas.
import { copyFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

function swap(from) {
  if (existsSync(from)) {
    copyFileSync(from, '.env')
    console.log(`» .env ← ${from}`)
  } else {
    console.warn(`! ${from} não encontrado — .env mantido como está`)
  }
}

// 1) usar a config de produção
swap('.env-prod')

// 2) build
// O Bun auto-carrega o .env (ainda local) para process.env ANTES desta troca, e o
// Vite dá prioridade às vars de ambiente já existentes sobre os ficheiros .env.
// Removemos as VITE_* do ambiente passado ao build → o Vite lê o .env (agora prod).
const buildEnv = { ...process.env }
for (const k of Object.keys(buildEnv)) {
  if (k.startsWith('VITE_')) delete buildEnv[k]
}
const res = spawnSync('vite build', { stdio: 'inherit', shell: true, env: buildEnv })

// 3) repor a config local (sempre)
swap('.env-local')

process.exit(res.status ?? 1)
