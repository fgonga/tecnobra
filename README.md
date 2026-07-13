# Tecnobra — Sistema inteligente de gestão de obras

Automatiza o registo de entradas e saídas de trabalhadores, visitantes,
equipamentos e materiais em estaleiros de obra, com cartões QR, alertas
inteligentes e relatórios em tempo real.

## Estrutura

- `api/` — Backend Bun + Fastify + MySQL (BullMQ, Socket.IO)
- `front/` — Frontend Vue 3 + Vite (Bootstrap 5 + Tabler)

## Arranque rápido (desenvolvimento)

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
