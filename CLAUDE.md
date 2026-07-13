# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The monorepo-level `../CLAUDE.md` covers the overall tech stack and the three platforms (checkout/estudantes/parceiros). This file is specific to the **checkout** platform and adds detail that cannot be inferred from the monorepo file or the file tree.

## Top-level layout

- `api/` — Fastify + Bun backend, MySQL (custom `BaseModel`, no Prisma), Redis/BullMQ, Socket.IO, Winston
- `front/` — Vue 3 + Vite frontend (dev port **8000**, Bootstrap 5 + bootstrap-vue-next + Tabler)
- `redirector/` — small Go service (`main.go`, systemd unit in `redirector.service`) that handles short-URL redirects; independent from the Bun backend

## Commands

### Backend (`api/`)

```bash
bun --watch index.ts              # Main HTTP + Socket.IO server (dev)
bun run express.ts                # Bull-Board UI at /bull (separate process)
bun run socket-server.ts          # Standalone socket server
bun run worker-<name>.ts          # Individual BullMQ workers (see list below)
bun run mock                      # Mock server (src/mock-server/index.ts)
```

There is no lint/test/typecheck pipeline configured in `api/package.json`. Verify changes by running the server and watching logs.

**CLI (`artisan.ts`)** — Laravel-style operator CLI. Prefer this over invoking the root scripts directly:

```bash
bun artisan.ts db:fresh                                 # Drop + migrate + setup + seed
bun artisan.ts db:migrate                               # migration.ts
bun artisan.ts db:setup                                 # Admin user + base config
bun artisan.ts db:seed --orders 200 --influencers 5     # seed.ts
bun artisan.ts db:seed:wallet                           # migrate-wallet.ts
bun artisan.ts user:reset-password <id> <password>
bun artisan.ts payments:recover --start YYYY-MM-DD --end YYYY-MM-DD [--dry]
```

When adding a new root-level script under `api/`, also register it as an `artisan` subcommand so the CLI stays the canonical entry point.

### Frontend (`front/`)

```bash
npm run dev              # Vite on :8000
npm run type-check       # vue-tsc --build
npm run lint             # ESLint --fix
npm run format           # Prettier on src/
npm run build            # vite build --mode prod
npm run build:dev        # --mode dev
npm run build:local      # --mode local
```

## Process topology (PM2)

`api/ecosystem.config.cjs` defines **8 long-running processes** — changes that affect queues, schedulers, or the socket server must be tested across all of them, not just `index.ts`:

| Process | Script | Responsibility |
|---|---|---|
| `index` | `index.ts` | Fastify HTTP API + Socket.IO gateway + scheduled cron jobs (`src/schedules/kernel`) |
| `express` | `express.ts` | Bull-Board UI at `/bull` (basic auth via `BULL_PASSWORD`) |
| `worker-enrolment` | `worker-enrolment.ts` | Consumes `enrolment` queue |
| `worker-notification` | `worker-notification.ts` | Consumes `notification` queue — resolves templates via `NotificationService` (SMS/WhatsApp) + raw `{message}` sends |
| `worker-payment-success` | `worker-payment-success.ts` | Consumes `payments-success` |
| `worker-payment-failed` | `worker-payment-failed.ts` | Consumes `payments-failed` |
| `worker-event` | `worker-event.ts` | Consumes `system-events` |
| `worker-wallet` | `worker-wallet.ts` | Consumes `wallet-payments` |

Queues are declared in `src/queues/index.ts`; each worker is a dedicated top-level `.ts` file. Use `pm2 restart all` after changes (per user memory — no confirmation needed).

`index.ts` itself registers the cron jobs from `src/schedules/kernel.ts` via `@fastify/schedule` — cron code runs inside the main API process, not in a separate worker.

## Backend architecture specifics

### `BaseModel` (`src/models/base.model.ts`)

All MySQL models extend `BaseModel`. Key conventions **enforced by the base class** — violating these bypasses input-safety checks:

- `static tableName: string` — required.
- `static allowedColumns: string[]` — whitelist for `orderBy` / filters / searchable fields coming from request params. Must override.
- `static allowedRelations: string[]` — whitelist for `?with[]=...` eager loading.
- `static sensitiveColumns: string[]` — never returned even if the client requests them in `columns[]`.
- Column names in dynamic SQL are regex-validated against `SAFE_COL_RE = /^[a-zA-Z_][a-zA-Z0-9_.]*$/` — never bypass this; any new dynamic-column method must run the same check.

When you add a new model, populate all four static arrays. Request-driven column/relation selection silently drops anything not on the list.

### Request pipeline

`HTTP → Fastify → Controller → Service → Model → MySQL`, with BullMQ queues fanning out asynchronous work (payments, enrolment, messaging, wallet).

Global error handler in `index.ts` translates:
- AJV validation errors → `422` with Portuguese messages (via `ajv-i18n/pt-BR`), shaped as `{ message, errors: { field: [msgs] } }`
- `FST_JWT_*` / `FAST_JWT_*` codes → `401`
- `429` rate-limit passthrough with custom message
- Everything else → generic `500`

Rate limit is global: **300 req/min**. CORS origin is `config.server.frontendUrl` (single origin, credentials on).

### Socket.IO

Mounted on the same HTTP server in `index.ts` at path `/socket.io`. Clients `join-payment` / `leave-payment` into per-payment rooms so payment-status updates are pushed only to the relevant tab. `app.io` is decorated onto the Fastify instance — access it via `request.server.io` in handlers.

### Reports

Every report endpoint **must include devoluções (refunds)** data, both in the backend payload and the frontend rendering. This is a product requirement, not an implementation detail — don't ship a report that omits refunds.

## Frontend architecture (`front/src/`)

Hexagonal-ish layering split by module:

```
src/
  common/             # shared across modules
    application/      # composables, stores, use-cases, utils
    domain/           # entities, value objects, types
    presentation/     # shared components, layouts, views
  modules/
    checkout/         # public-facing checkout flow
      common/
      features/
    central/          # admin/back-office (orders, reports, settlements, users, …)
      common/
      features/
  App.vue
  main.ts
```

Path aliases (from `vite.config.ts` — use them, don't write relative `../../../` paths):

- `@` → `src`
- `@common` → `src/common`
- `@components` → `src/common/presentation/components`
- `@central` → `src/modules/central`

Feature code belongs under the matching `modules/<module>/features/<feature>/` folder; only promote to `common/` when something is genuinely reused by both `checkout` and `central`.

bootstrap-vue-next components are auto-imported via `unplugin-vue-components` + `BootstrapVueNextResolver` — do not add explicit imports for `<BButton>`, `<BModal>`, etc.

## Environment files

Per `api/` and `front/`: `.env`, `.env-local`, `.env-dev`, `.env-qa`, `.env-prod`. Frontend build modes map to these files via Vite's `--mode` flag (`build:dev` → `.env-dev`, etc.). `FRONTEND_URL` in the API's env gates the single CORS origin.
