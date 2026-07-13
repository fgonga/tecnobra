#!/usr/bin/env bash
#
# Deploy do treesix/checkout (monorepo único: api/ Bun+PM2 + front/ Vite).
#
#   - Verifica que o working tree está limpo (aborta se houver alterações locais).
#   - git pull --ff-only  → traz o código da api E o build do front já compilado
#     (front/dist é VERSIONADO: o build é feito localmente e commitado; o servidor
#      NÃO compila o front).
#   - api: bun install + pm2 reload de TODOS os processos (ecosystem.config.cjs).
#
# Com --front-only só faz o pull (atualiza o front/dist, não mexe na api).
# Com --discard descarta alterações locais antes do pull (DESTRÓI — usar c/ cuidado).
#
# NÃO corre migrações: `bun artisan.ts db:migrate` DROPA a base de dados.
# Em produção as migrações (ex.: updateN.sql) são aplicadas manualmente.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

red=$'\e[0;31m'; grn=$'\e[0;32m'; ylw=$'\e[0;33m'; cya=$'\e[0;36m'; rst=$'\e[0m'

# ---------- flags ----------
DISCARD=false
DO_API=true   # --front-only desliga (só pull)

while (($#)); do
  case "$1" in
    --discard|-d)    DISCARD=true; shift ;;
    --front-only|-f) DO_API=false; shift ;;
    --help|-h)
      cat <<EOF
Uso: $0 [opções]
  --front-only, -f   só git pull (atualiza front/dist; não reinicia a api)
  --discard, -d      descarta alterações locais antes do pull (reset --hard + clean)
  -h, --help         esta ajuda

Nota: o front NÃO é compilado no servidor — front/dist é versionado (build local + commit).
EOF
      exit 0 ;;
    *) echo "${red}Flag desconhecida:${rst} $1"; exit 1 ;;
  esac
done

# ---------- user-alvo ----------
# Em produção o owner dos ficheiros (ex.: www) deve correr o deploy, para que
# .git e o PM2 fiquem com as permissões certas.
DEFAULT_USER="www"
read -r -p "User para correr o deploy [${DEFAULT_USER}]: " TARGET_USER
TARGET_USER="${TARGET_USER:-$DEFAULT_USER}"

if ! id -u "$TARGET_USER" >/dev/null 2>&1; then
  echo "${red}✗ user '$TARGET_USER' não existe${rst}"
  exit 1
fi

run_as() {
  if [[ "$(id -un)" == "$TARGET_USER" ]]; then
    "$@"
  else
    sudo -u "$TARGET_USER" -- "$@"
  fi
}

echo "${cya}== Deploy treesix/checkout ==${rst}"
echo "   user: ${ylw}$TARGET_USER${rst}   api: ${ylw}$($DO_API && echo "reinicia" || echo "intacta (--front-only)")${rst}"
echo

# ---------- fase 1: working tree limpo ----------
# Todas as chamadas git via run_as: se o invocador ≠ owner, o git rejeita com
# "dubious ownership" e o status sai vazio → falso "limpo".
# --untracked-files=no: ignoramos ficheiros untracked (ex.: .well-known/ e
# .user.ini gerados pelo aaPanel) — não bloqueiam um pull --ff-only e estão
# sempre presentes em produção. Só interessam as alterações a ficheiros versionados.
echo "${cya}== Verificação do working tree ==${rst}"
if ! status_out=$(run_as git -C "$SCRIPT_DIR" status --porcelain --untracked-files=no 2>&1); then
  echo "${red}✗ git status falhou:${rst}"; echo "$status_out" | sed 's/^/    /'; exit 1
fi

if [[ -n "$status_out" ]]; then
  if ! $DISCARD; then
    branch="$(run_as git -C "$SCRIPT_DIR" branch --show-current 2>/dev/null || echo '?')"
    echo "${red}Abortado:${rst} há alterações locais não commitadas (branch: ${ylw}$branch${rst}):"
    run_as git -C "$SCRIPT_DIR" status --short --untracked-files=no | sed 's/^/    /'
    echo
    echo "Resolve antes de correr (commit, stash) ou usa ${ylw}--discard${rst}."
    exit 1
  fi
  echo "${ylw}!! --discard activo — descartando alterações locais${rst}"
  # clean SEM -d (não apaga directórios untracked: node_modules/, uploads…).
  run_as git -C "$SCRIPT_DIR" reset --hard HEAD --quiet
  run_as git -C "$SCRIPT_DIR" clean -f \
    -e '.env' -e '.env.*' -e '.env-*' \
    -e 'node_modules/' --quiet
else
  echo "${grn}✓${rst} working tree limpo"
fi
echo

# ---------- fase 2: git pull (traz api + front/dist) ----------
branch="$(run_as git -C "$SCRIPT_DIR" branch --show-current)"
echo "${cya}== git pull --ff-only${rst} ${ylw}($branch)${rst}"
run_as git -C "$SCRIPT_DIR" pull --ff-only
echo

# ---------- fase 3: api (Bun + PM2) ----------
if $DO_API; then
  echo "${cya}== api: bun install ==${rst}"
  ( cd "$SCRIPT_DIR/api" && run_as bun install )
  echo "${cya}== api: pm2 reload (ecosystem.config.cjs) ==${rst}"
  # startOrReload: arranca se não existir, faz reload (zero-downtime) se já correr.
  ( cd "$SCRIPT_DIR/api" && run_as pm2 startOrReload ecosystem.config.cjs --update-env )
  run_as pm2 save >/dev/null 2>&1 || true
  echo "${grn}✓ api pronta${rst}"; echo
else
  echo "${ylw}— api não reiniciada (--front-only)${rst}"; echo
fi

echo "${grn}✓ Deploy concluído${rst}"
echo "${ylw}Lembrete:${rst} migrações de BD (updateN.sql) NÃO correm aqui — aplica-as à mão se necessário."
