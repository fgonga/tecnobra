/**
 * Configuração global da aplicação — único ponto de leitura de variáveis de ambiente.
 *
 * Cada serviço externo tem a sua própria flag de mock independente:
 *   USE_MOCK_APPYPAY=true/false
 *   USE_MOCK_SMS=true/false
 *   USE_MOCK_THINKIFIC=true/false
 *   USE_MOCK_WHATSAPP=true/false
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

const isMockAppypay   = isMockFor("APPYPAY")
const isMockSms       = isMockFor("SMS")
const isMockThinkific = isMockFor("THINKIFIC")
const isMockWhatsapp  = isMockFor("WHATSAPP")
const isMockVendus    = isMockFor("VENDUS")

export const config = {
  env:   process.env.NODE_ENV || "development",
  isDev: process.env.APP_DEVELOPMENT === "true",

  server: {
    port:            Number(process.env.APP_PORT || 9301),
    url:             process.env.APP_URL || "http://localhost:8001",
    frontendUrl:     process.env.FRONTEND_URL || "",
    jwtSecret:       process.env.JWT_SECRET || "",
    defaultPassword: process.env.DEFAULT_PASSWORD || "treesix",
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

  appypay: {
    authUrl:      mockOr("APPYPAY", `${mockBase}/appypay/oauth2/token`, "APPYPAY_AUTH_URL"),
    apiUrl:       mockOr("APPYPAY", `${mockBase}/appypay`,              "APPYPAY_API_URL"),
    clientId:     process.env.APPYPAY_CLIENT_ID     || "",
    clientSecret: process.env.APPYPAY_CLIENT_SECRET || "",
    resource:     process.env.APPYPAY_RESOURCE      || "",
    gpo:          process.env.APPYPAY_GPO           || "",
    posCode:      process.env.APPYPAY_POS_CODE      || "",
    version:      process.env.APPYPAY_VERSION       || "",
  },

  sms: {
    apiUrl: mockOr("SMS", `${mockBase}/sms/api/v2/send_message`, "SMS_API_URL", "https://www.telcosms.co.ao/api/v2/send_message"),
    apiKey: process.env.SMS_API_KEY || "",
  },

  whatsapp: {
    apiUrl:   mockOr("WHATSAPP", `${mockBase}/whatsapp`, "WHATSAPP_API_URL", "http://52.47.39.99:9000"),
    deviceId: process.env.WHATSAPP_DEVICE_ID    || "helpdesk",
    phone:    process.env.WHATSAPP_GROUP_PHONE   || "120363403738565740@g.us",
    user:     process.env.WHATSAPP_USER          || "",
    password: process.env.WHATSAPP_PASSWORD      || "",
  },

  partner: {
    apiUrl: process.env.PARTNER_API     || "",
    apiKey: process.env.PARTNER_API_KEY || "",
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },

  // Faturação eletrónica — Cegid Vendus (https://www.vendus.co.ao/ws/)
  vendus: {
    apiUrl:     mockOr("VENDUS", `${mockBase}/vendus/ws/v1.1`, "VENDUS_API_URL", "https://www.vendus.co.ao/ws/v1.1"),
    apiKey:     process.env.VENDUS_API_KEY || "",
    registerId: Number(process.env.VENDUS_REGISTER_ID || 0),
    // "tests" não comunica os documentos à AGT; usar "normal" em produção.
    mode:       (process.env.VENDUS_MODE === "normal" ? "normal" : "tests") as "normal" | "tests",
    // Subdomínio do backoffice do tenant (ex.: https://acme.vendus.co.ao).
    // O PDF do documento é servido aqui, com a sessão do browser do admin.
    officeUrl:  (process.env.VENDUS_OFFICE_URL || "").replace(/\/+$/, ""),
  },

  mock: {
    enabledAppypay:   isMockAppypay,
    enabledSms:       isMockSms,
    enabledThinkific: isMockThinkific,
    enabledWhatsapp:  isMockWhatsapp,
    enabledVendus:    isMockVendus,
    port:             Number(process.env.MOCK_APP_PORT || 3099),
    base:             mockBase,
  },
} as const

// Forçar override de process.env para clientes que lêem env directamente
if (isMockAppypay) {
  process.env.APPYPAY_AUTH_URL = config.appypay.authUrl
  process.env.APPYPAY_API_URL  = config.appypay.apiUrl
}

if (isMockThinkific) {
  process.env.THINKIFIC_BASE_URL = process.env.MOCK_THINKIFIC_BASE_URL || `${mockBase}/thinkific/api/public/v1`
}

if (isMockWhatsapp) {
  process.env.WHATSAPP_API_URL     = config.whatsapp.apiUrl
  process.env.WHATSAPP_DEVICE_ID   = config.whatsapp.deviceId
  process.env.WHATSAPP_GROUP_PHONE = config.whatsapp.phone
}

console.log(`[Config] mock → appypay=${isMockAppypay} sms=${isMockSms} thinkific=${isMockThinkific} whatsapp=${isMockWhatsapp}`)
console.log(`  appypay.authUrl   = ${config.appypay.authUrl}`)
console.log(`  appypay.apiUrl    = ${config.appypay.apiUrl}`)
console.log(`  sms.apiUrl        = ${config.sms.apiUrl}`)
console.log(`  whatsapp.apiUrl   = ${config.whatsapp.apiUrl}`)
console.log(`  thinkific.baseUrl = ${process.env.THINKIFIC_BASE_URL}`)
