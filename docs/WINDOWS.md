# Correr o Tecnobra no Windows

Guia de desenvolvimento em Windows 10/11. Tudo corre nativamente — não é
preciso Docker nem WSL, **exceto** o Redis (ver secção própria) e nos casos
assinalados em [Windows ARM](#windows-arm-surface-pro-x-snapdragon).

Se preferires evitar chatices de compatibilidade, [correr tudo dentro do
WSL2](#alternativa-tudo-em-wsl2) é a via mais simples e é o ambiente mais
próximo daquele em que o projeto é desenvolvido.

---

## 1. Requisitos

| Software | Versão | Para quê | Instalação |
|---|---|---|---|
| **Bun** | ≥ 1.3 | runtime do backend | `powershell -c "irm bun.sh/install.ps1 \| iex"` |
| **Node.js** | 20.19+ ou 22.12+ | frontend (Vite) | [nodejs.org](https://nodejs.org) ou `winget install OpenJS.NodeJS.LTS` |
| **MySQL** | 8.x | base de dados | `winget install Oracle.MySQL` |
| **Redis** | 6+ | filas BullMQ | ver [secção 2](#2-redis-no-windows) |
| **Git** | qualquer | clonar | `winget install Git.Git` |

Confirmar depois de instalar (abrir um terminal **novo** para o PATH
atualizar):

```powershell
bun --version
node --version
mysql --version
```

> **Atenção ao PowerShell:** o instalador do Bun precisa que a execução de
> scripts esteja permitida. Se falhar com *"running scripts is disabled"*:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

---

## 2. Redis no Windows

O Redis não tem versão oficial para Windows. Escolhe **uma** destas opções:

**Memurai** (recomendado — nativo, corre como serviço do Windows)
```powershell
winget install Memurai.MemuraiDeveloper
```
Fica a escutar em `127.0.0.1:6379` e arranca com o Windows. Nada mais a fazer.

**WSL2** — se já tiveres WSL instalado:
```powershell
wsl -e sudo apt update
wsl -e sudo apt install -y redis-server
wsl -e sudo service redis-server start
```
O `localhost` do Windows chega ao WSL2, por isso `REDIS_HOST=127.0.0.1` funciona.
É preciso repetir o `service redis-server start` a cada reinício.

**Docker Desktop**
```powershell
docker run -d --name redis -p 6379:6379 --restart unless-stopped redis:7
```

Verificar que está de pé:
```powershell
Test-NetConnection 127.0.0.1 -Port 6379
```

---

## 3. Preparar a base de dados

Com o MySQL instalado, criar o utilizador/base. O `db:fresh` cria a base
sozinho, mas precisa de credenciais válidas:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tecnobra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> Se o `mysql` não for reconhecido, adiciona ao PATH:
> `C:\Program Files\MySQL\MySQL Server 8.0\bin`

---

## 4. Clonar e configurar

```powershell
git clone https://github.com/fgonga/tecnobra.git
cd tecnobra
```

Os ficheiros `.env` **não estão no repositório** (estão no `.gitignore`).
Criá-los a partir dos exemplos:

```powershell
Copy-Item api\.env-example api\.env
Copy-Item front\.env-example front\.env
```

Editar `api\.env` e preencher no mínimo:

| Variável | Valor |
|---|---|
| `DB_USER` / `DB_PASSWORD` | as credenciais do teu MySQL |
| `DB_NAME` | `tecnobra` |
| `JWT_SECRET` | um valor aleatório longo |

Gerar o `JWT_SECRET`:
```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Deixa `USE_MOCK_SMS`, `USE_MOCK_WHATSAPP` e `USE_MOCK_EMAIL` a `true` — em
desenvolvimento nenhuma notificação sai para o exterior, fica só registada no log.

O `front\.env` normalmente não precisa de alterações.

---

## 5. Instalar dependências

```powershell
cd api
bun install
cd ..\front
npm install
cd ..
```

---

## 6. Criar o esquema e os dados demo

```powershell
cd api
bun artisan.ts db:fresh
```

Isto **apaga e recria** a base de dados, aplica o esquema, cria o
administrador, os perfis, a parametrização e os templates de notificação, e
carrega dados de demonstração.

Credenciais iniciais: **`admin` / `admin`**

> Outros comandos: `db:setup` (só admin/perfis/templates, sem demo),
> `db:seed` (só dados demo), `user:reset-password <id> <password>`.

---

## 7. Arrancar

São processos separados — **um terminal para cada**.

```powershell
# Terminal 1 — API + Socket.IO          → http://127.0.0.1:9100
cd api
bun --watch index.ts

# Terminal 2 — worker de notificações
cd api
bun run worker-notification.ts

# Terminal 3 — worker de eventos
cd api
bun run worker-event.ts

# Terminal 4 — frontend                 → http://127.0.0.1:9300
cd front
npm run dev
```

Opcional — painel das filas (Bull-Board) em `http://127.0.0.1:9400/bull`:
```powershell
cd api
bun run express.ts
```

Abrir **http://127.0.0.1:9300** e entrar com `admin` / `admin`.

### Portas usadas

| Porta | Processo |
|---|---|
| 9100 | API Fastify + Socket.IO |
| 9300 | Frontend (Vite) |
| 9400 | Bull-Board (opcional) |
| 3099 | Mock de SMS/WhatsApp |
| 3306 | MySQL |
| 6379 | Redis |

> O `BULL_DASHBOARD_PORT` vem a 9400 no `.env-example` de propósito: o valor
> usado internamente (9300) colide com o frontend.

---

## 8. Problemas comuns no Windows

**`bun` ou `node` não reconhecido**
O PATH só é lido por terminais abertos depois da instalação. Fecha e abre
um terminal novo.

**Erro a instalar `argon2`**
Em Windows x64 o pacote traz binário pré-compilado (`win32-x64`) e não
compila nada. Se mesmo assim falhar, instala as ferramentas de compilação:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```
e seleciona *Desktop development with C++*.

**`ECONNREFUSED 127.0.0.1:6379`**
O Redis não está a correr — ver [secção 2](#2-redis-no-windows). Com WSL,
lembra-te de o arrancar após cada reinício.

**`ER_ACCESS_DENIED_ERROR` / `ER_NOT_SUPPORTED_AUTH_MODE`**
Credenciais erradas no `api\.env`, ou o MySQL 8 a usar
`caching_sha2_password` com um cliente antigo:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'a-tua-password';
FLUSH PRIVILEGES;
```

**Porta ocupada** — descobrir quem a está a usar:
```powershell
Get-NetTCPConnection -LocalPort 9100 | Select-Object OwningProcess
Get-Process -Id <PID>
```

**A câmara do leitor de QR na portaria não abre**
Os browsers só dão acesso à câmara em HTTPS ou em `localhost`. Usar
`http://localhost:9300` (não o IP da máquina) ou servir por HTTPS.

**Finais de linha (CRLF/LF)**
Para o Git não marcar ficheiros inteiros como alterados:
```powershell
git config --global core.autocrlf input
```

**`deploy.sh` não corre**
É um script de produção para Linux (bash + PM2). Não é usado em
desenvolvimento no Windows.

---

## Windows ARM (Surface Pro X, Snapdragon)

O Bun não tem build nativo para Windows ARM64 e o `argon2` também não traz
binário para essa plataforma. Nestas máquinas usa
[WSL2](#alternativa-tudo-em-wsl2).

---

## Alternativa: tudo em WSL2

Mais simples se já usas WSL, e idêntico ao ambiente de desenvolvimento original.

```powershell
wsl --install -d Ubuntu     # se ainda não tiveres
```

Dentro do Ubuntu:

```bash
sudo apt update
sudo apt install -y mysql-server redis-server curl unzip
sudo service mysql start
sudo service redis-server start

curl -fsSL https://bun.sh/install | bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs

git clone https://github.com/fgonga/tecnobra.git
cd tecnobra
cp api/.env-example api/.env
cp front/.env-example front/.env
# editar api/.env (DB_USER, DB_PASSWORD, JWT_SECRET)

cd api && bun install && bun artisan.ts db:fresh && cd ../front && npm install
```

Depois seguir a [secção 7](#7-arrancar) com os mesmos comandos. O Windows
consegue abrir `http://127.0.0.1:9300` normalmente — o WSL2 reencaminha as
portas para o host.

> **Importante:** clona o projeto dentro do sistema de ficheiros do Linux
> (`~/tecnobra`), não em `/mnt/c/...`. Em `/mnt/c` o I/O é muito lento e o
> hot-reload do Vite e do `bun --watch` pode não detetar alterações.
