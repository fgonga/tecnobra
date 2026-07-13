import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { createRequire } from "module";
import { config } from "./src/config/env.js";
import registerRoutes from "./src/routes/index.js";
import { instrument } from "@socket.io/admin-ui";
import localizePtBr from "ajv-i18n/localize/pt-BR"
import qs from "qs"

// socket.io 4.8.x expõe um wrapper.mjs que o Bun não resolve (falta 'default' export).
// Forçamos o caminho CommonJS via require para obter a classe Server real.
const { Server: IOServer } = createRequire(import.meta.url)("socket.io");
const app = Fastify(
    {
      logger: true,
      trustProxy: true,
      bodyLimit: 20 * 1024 * 1024, // 20MB — suporta ficheiros de prova em base64
      routerOptions: {
        querystringParser: (str) => qs.parse(str),
      },
    }
);

app.setErrorHandler((error, req, reply) => {
  if (error.validation) {
    localizePtBr(error.validation)
    const errors: Record<string, string[]> = {}
    for (const err of error.validation) {
      const field =
          err.instancePath.replace("/", "") ||
          err.params?.missingProperty ||
          "general"
      if (!errors[field]) errors[field] = []
      errors[field].push(err.message || "inválido")
    }
    return reply.status(422).send({
      message: "Os dados fornecidos são inválidos.",
      errors,
    })
  }

  if (
      error.code?.startsWith("FST_JWT_") ||
      error.code?.startsWith("FAST_JWT_")
  ) {
    return reply.status(401).send({
      message: "Token de autenticação inválido, expirado ou ausente.",
      type: "danger",
    })
  }

  if (error.status === 429) {
    return reply.status(429).send({
      message: error.message || "Muitas requisições, tente novamente mais tarde.",
      type: "danger",
    })
  }

  return reply.status(500).send({
    message: "Erro interno no servidor.",
    type: "danger",
  })
})

import rateLimit from "@fastify/rate-limit";
import axios from "axios";


await app.register(rateLimit, {
  global: true,
  max: 300,
  timeWindow: '1 minute',
});
// ==================== SCHEDULE ====================
import { fastifySchedule } from "@fastify/schedule";
import { schedules } from "./src/schedules/kernel";
app.register(fastifySchedule);
// ==================== SCHEDULE ====================
// ==================== HELMET ====================
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hidePoweredBy: true,
});
// ==================== CORS ====================
app.register(cors, {
  origin: [config.server.frontendUrl],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});
// ==================== JWT ====================
if (!config.server.jwtSecret) throw new Error("JWT_SECRET not defined");
app.register(fastifyJwt, { secret: config.server.jwtSecret });
app.decorate(
    "authenticate",
    async function (request, reply) {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    }
)

// ==================== ROTAS ====================
registerRoutes(app);
// ============= SOCKET.IO (antes do listen) =============
const io = new IOServer(app.server, {
  path: "/socket.io",
  pingInterval: 30000, // envia ping a cada 30s
  pingTimeout: 60000,  // espera até 60s antes de encerrar
  cors: { origin: "*" ,  methods: ["GET", "POST"]},
})

app.decorate("io", io) // agora permitido, antes do start

io.on("connection", socket => {
  console.log("Cliente conectado:", socket.id)

  socket.on("join-obra", (obraId: string | number) => {
    socket.join(`obra:${obraId}`)
    console.log(`Socket ${socket.id} entrou na sala obra:${obraId}`)
  })

  socket.on("leave-obra", (obraId: string | number) => {
    socket.leave(`obra:${obraId}`)
    console.log(`Socket ${socket.id} saiu da sala obra:${obraId}`)
  })

  socket.on("disconnect", () => console.log("Cliente desconectado:", socket.id))
})
// ============= FUNÇÃO PRINCIPAL =============
async function main() {
  try {
    await app.ready();
    schedules.forEach(job => app.scheduler.addCronJob(job));
    await app.listen({ port: config.server.port, host: "0.0.0.0" })
    console.log(`Server + Socket.IO running at ${config.server.url}:${config.server.port}`)
    console.table(config.server)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
main()
export default app
