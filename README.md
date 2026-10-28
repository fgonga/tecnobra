# Tecnobra — Sistema inteligente de gestão de obras

Automatiza o registo de entradas e saídas de trabalhadores, visitantes,
equipamentos e materiais em estaleiros de obra, com cartões QR, alertas
inteligentes e relatórios em tempo real.

## Estrutura

- `api/` — Backend Bun + Fastify + MySQL (BullMQ, Socket.IO)
- `front/` — Frontend Vue 3 + Vite (Bootstrap 5 + Tabler)

## Arranque rápido (desenvolvimento)

> No Windows, seguir [docs/WINDOWS.md](docs/WINDOWS.md).

Requisitos: Bun ≥ 1.3, Node 20.19+/22.12+, MySQL 8 e Redis.
Antes de arrancar, criar os ficheiros de ambiente a partir dos exemplos:

```bash
cp api/.env-example api/.env      # preencher DB_* e JWT_SECRET
cp front/.env-example front/.env
```

```bash
# Backend
cd api
bun install
bun artisan.ts db:fresh     # recria a BD + admin + dados demo
bun --watch index.ts        # API em http://127.0.0.1:9100

# Frontend
cd front
npm install
npm run dev                 # UI em http://127.0.0.1:9300
```

Credenciais iniciais: `admin` / `admin`.

> Nota: a leitura de QR por câmara na portaria exige HTTPS ou `localhost`
> (restrição dos browsers ao acesso à câmara).
