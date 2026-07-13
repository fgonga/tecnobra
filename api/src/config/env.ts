/**
 * Configuração global da aplicação — único ponto de leitura de variáveis de ambiente.
 *
 * Cada serviço externo tem a sua própria flag de mock independente:
 *   USE_MOCK_SMS=true/false
 *   USE_MOCK_WHATSAPP=true/false
 *   USE_MOCK_EMAIL=true/false
 */

import "dotenv/config"

const mockBase = `http://127.0.0.1:${process.env.MOCK_APP_PORT || 3099}`

function isMockFor(service: string): boolean {
  return process.env[`USE_MOCK_${service}`] === "true"
}

function mockOr(service: string, mockUrl: string, realEnvKey: string, fallback = ""): string {
  if (!isMockFor(service)) return process.env[realEnvKey] || fallback
  return process.env[`MOCK_${realEnvKey}`] || mockUrl
}

const isMockSms      = isMockFor("SMS")
const isMockWhatsapp = isMockFor("WHATSAPP")
const isMockEmail    = isMockFor("EMAIL")

export const config = {
  env:   process.env.NODE_ENV || "development",
  isDev: process.env.APP_DEVELOPMENT === "true",

  server: {
    port:            Number(process.env.APP_PORT || 9301),
    url:             process.env.APP_URL || "http://localhost:8001",
    frontendUrl:     process.env.FRONTEND_URL || "",
    jwtSecret:       process.env.JWT_SECRET || "",
    defaultPassword: process.env.DEFAULT_PASSWORD || "tecnobra",
  },

  socket: {
    port: Number(process.env.SOCKET_PORT || 8002),
  },

  db: {
    host:     process.env.DB_HOST     || "127.0.0.1",
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER     || "",
    password: process.env.DB_PASSWORD || "",
    name:     process.env.DB_NAME     || "",
  },

  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
  },

  sms: {
    apiUrl: mockOr("SMS", `${mockBase}/sms/api/v2/send_message`, "SMS_API_URL", "https://www.telcosms.co.ao/api/v2/send_message"),
    apiKey: process.env.SMS_API_KEY || "",
  },

  whatsapp: {
    apiUrl:   mockOr("WHATSAPP", `${mockBase}/whatsapp`, "WHATSAPP_API_URL", ""),
    deviceId: process.env.WHATSAPP_DEVICE_ID    || "tecnobra",
    phone:    process.env.WHATSAPP_GROUP_PHONE   || "",
    user:     process.env.WHATSAPP_USER          || "",
    password: process.env.WHATSAPP_PASSWORD      || "",
  },

  // E-mail (SMTP via nodemailer). Com USE_MOCK_EMAIL=true usa jsonTransport (só log).
  smtp: {
    mock:     isMockEmail,
    host:     process.env.SMTP_HOST     || "",
    port:     Number(process.env.SMTP_PORT || 587),
    secure:   process.env.SMTP_SECURE === "true",
    user:     process.env.SMTP_USER     || "",
    password: process.env.SMTP_PASSWORD || "",
    from:     process.env.MAIL_FROM     || "Tecnobra <no-reply@tecnobra.local>",
  },

  // Webhook opcional para sistemas externos (dispatch de eventos)
  partner: {
    apiUrl: process.env.PARTNER_API     || "",
    apiKey: process.env.PARTNER_API_KEY || "",
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },

  mock: {
    enabledSms:      isMockSms,
    enabledWhatsapp: isMockWhatsapp,
    enabledEmail:    isMockEmail,
    port:            Number(process.env.MOCK_APP_PORT || 3099),
    base:            mockBase,
  },
} as const

if (isMockWhatsapp) {
  process.env.WHATSAPP_API_URL     = config.whatsapp.apiUrl
  process.env.WHATSAPP_DEVICE_ID   = config.whatsapp.deviceId
  process.env.WHATSAPP_GROUP_PHONE = config.whatsapp.phone
}

console.log(`[Config] mock → sms=${isMockSms} whatsapp=${isMockWhatsapp} email=${isMockEmail}`)
