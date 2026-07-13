# CLAUDE.md

Guia para o Claude Code ao trabalhar neste repositório.

**Tecnobra** — sistema de gestão de obras: registo de entradas/saídas de
trabalhadores, visitantes, equipamentos e materiais com códigos QR,
alertas inteligentes e relatórios em tempo real. Todo o texto de UI e
mensagens é em **português de Portugal**.

## Estrutura

- `api/` — Fastify + Bun, MySQL (`BaseModel` custom, sem ORM), Redis/BullMQ, Socket.IO
- `front/` — Vue 3 + Vite (porta **9300**), Bootstrap 5 + bootstrap-vue-next + Tabler

## Comandos

### Backend (`api/`)

```bash
bun --watch index.ts              # API + Socket.IO (dev, porta 9100)
bun run express.ts                # Bull-Board em /bull
bun run worker-notification.ts    # Worker da fila notification
bun run worker-event.ts           # Worker da fila system-events
bun artisan.ts db:fresh           # Recria BD + setup + seed demo
bun artisan.ts db:setup           # Admin, perfis, parametrização, templates
bun artisan.ts user:reset-password <id> <password>
```

Não há pipeline de lint/teste no `api/` — verificar alterações executando o
servidor e exercitando endpoints com curl.

### Frontend (`front/`)

```bash
npm run dev              # Vite em :9300
npm run type-check       # vue-tsc (o projeto herdou ~170 erros pré-existentes)
npm run lint             # ESLint --fix
npm run build            # vite build --mode prod
```

## Processos PM2 (`api/ecosystem.config.cjs`)

| Processo | Script | Responsabilidade |
|---|---|---|
| `tecnobra-api` | `index.ts` | API Fastify + Socket.IO + cron (`src/schedules/kernel`) |
| `tecnobra-bull` | `express.ts` | UI Bull-Board em `/bull` |
| `tecnobra-worker-notification` | `worker-notification.ts` | Fila `notification` (SMS/WhatsApp/email por template) |
| `tecnobra-worker-event` | `worker-event.ts` | Fila `system-events` |

## Receita para nova feature CRUD (backend)

1. DDL em `api/src/db/migrations/init.sql` (dev) ou novo `updateN.sql` (produção)
2. Model em `src/models/<nome>.model.ts` — `extends BaseModel`; preencher
   `tableName`, `allowedColumns`, `allowedRelations`, `sensitiveColumns`
   e `static create` → `genericCreate`
3. Service `extends BaseCrudService`, Controller `extends BaseCrudController`
4. Schema AJV em `src/schema/` (com `additionalProperties: false`)
5. Rota: `this.crud(fastify, "<plural>", ctrl, Schema, opts?, "<regra>")`
   em `src/routes/routes.ts` — rotas estáticas custom ANTES do crud()

Regras de sistema em `src/models/profile.model.ts` (`ALL_SYSTEM_RULES`):
`dashboard, obras, empresas, trabalhadores, portaria, equipamentos,
materiais, visitantes, veiculos, desempenho, alertas, reports, users, configs, *`.

## Receita para nova feature admin (frontend)

Copiar a estrutura de uma feature existente em
`front/src/modules/central/features/<nome>/`:
`application/dtos` + `domain/service` (implementa `CrudService<T>`) +
`presentation/views/{index,create}.vue` + `presentation/components/`.
Registar a rota em `src/modules/central/common/presentation/routes/index.ts`
(`meta.middlewares: ["auth", "role:<regra>"]`) e o item de menu em
`src/common/presentation/components/BitNav.vue`.

## Convenções Tecnobra

- **Tokens QR**: `nanoid(21)` opaco por entidade (`qr_token`), revogável;
  o QR codifica `${FRONTEND_URL}/c/<token>`; endpoints de check-in exigem
  autenticação com a regra `portaria`.
- **Stock**: qualquer mutação de `materiais.stock_atual` acontece dentro de
  transação (guia incrementa, consumo decrementa).
- **Socket.IO**: salas por obra (`join-obra` → sala `obra:<id>`); processos
  externos emitem via `POST /snotify {room, event, payload}` (só localhost).
- **Notificações**: template é a fonte de verdade (sem template ativo num
  canal, nada é enviado nesse canal). Canais: sms, whatsapp, email
  (`EmailService`/nodemailer; `USE_MOCK_EMAIL=true` em dev). Eventos em
  `src/services/notification/EventVariableRegistry.ts`.
- **Uploads**: data-URL base64 no corpo JSON → `UploadService.saveDataUrl`
  (disco local `uploads/<subdir>`), servido em `GET /uploads/:subdir/:filename`.
- **Migrações**: `db:migrate` DROPA a base de dados. Em produção usar
  `updateN.sql` + `bun artisan.ts migrate <n>`.
