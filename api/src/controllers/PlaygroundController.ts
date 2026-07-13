/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Playground de sistemas externos (admin) — executa chamadas reais às SDKs/
 *  serviços internos a partir da UI, para testar integrações.
 *
 *  Modelo uniforme: system -> resource -> action(...args).
 *  Cada alvo tem whitelist de métodos (nunca invoca métodos arbitrários).
 *  AppyPay fica de fora de propósito.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config/env";
import { vendus, VendusError } from "../lib/vendus";
import { SmsService } from "../services/SmsService";
import { WhatsappService, WhatsappGatewayError } from "../services/WhatsappService";
import { Thinkific } from "@bit/thinkificts/Thinkific";

interface Target {
  obj: any;
  methods: string[];
  /** Métodos que escrevem/enviam/cobram — UI mostra aviso. */
  destructive?: string[];
}

interface SystemDef {
  label: string;
  /** true se tem credencial real OU o mock do sistema está ativo. */
  configured: () => boolean;
  /** true se as chamadas vão para o mock-server (não para o serviço real). */
  mock: () => boolean;
  resources: Record<string, Target>;
}

function registry(): Record<string, SystemDef> {
  return {
    vendus: {
      label: "Vendus",
      // Nota: o mock-server ainda não tem rota /vendus — mock=true vai falhar a ligação.
      configured: () => Boolean(config.vendus.apiKey) || config.mock.enabledVendus,
      mock: () => config.mock.enabledVendus,
      resources: {
        documents: {
          obj: vendus.documents,
          methods: ["create", "cancel", "get", "list", "getPdfUrl"],
          destructive: ["create", "cancel"],
        },
        clients: {
          obj: vendus.clients,
          methods: ["create", "get", "list", "update", "deactivate", "remove", "findByFiscalId"],
          destructive: ["create", "update", "deactivate", "remove"],
        },
        products: {
          obj: vendus.products,
          methods: ["create", "get", "list", "update", "deactivate", "remove", "findByReference"],
          destructive: ["create", "update", "deactivate", "remove"],
        },
        registers: {
          // Para descobrir o VENDUS_REGISTER_ID: registers.apiRegister() devolve a caixa type="api".
          obj: vendus.registers,
          methods: ["list", "get", "apiRegister"],
        },
        paymentMethods: {
          obj: vendus.paymentMethods,
          methods: ["list", "getDefault", "create"],
          destructive: ["create"],
        },
      },
    },
    sms: {
      label: "SMS",
      configured: () => Boolean(config.sms.apiKey) || config.mock.enabledSms,
      mock: () => config.mock.enabledSms,
      resources: {
        sms: { obj: SmsService, methods: ["send"], destructive: ["send"] },
      },
    },
    whatsapp: {
      label: "WhatsApp",
      configured: () => Boolean(config.whatsapp.user) || config.mock.enabledWhatsapp,
      mock: () => config.mock.enabledWhatsapp,
      resources: {
        whatsapp: { obj: WhatsappService, methods: ["send"], destructive: ["send"] },
      },
    },
    thinkific: {
      label: "Thinkific",
      configured: () => Boolean(process.env.THINKIFIC_API_KEY) || config.mock.enabledThinkific,
      // O pacote @bit/thinkificts já honra THINKIFIC_BASE_URL; com USE_MOCK_THINKIFIC=true
      // o env.ts aponta a baseURL para o mock-server.
      mock: () => config.mock.enabledThinkific,
      resources: {
        thinkific: {
          obj: Thinkific,
          methods: [
            "getUserByEmail", "getCourses", "getCourse", "getProducts", "getProduct",
            "getBundle", "getEnrolls",
            "createUser", "safeCreateUser", "enrollCourseWithExpiry", "enrollBundleWithExpiry", "deleteUser",
          ],
          destructive: ["createUser", "safeCreateUser", "enrollCourseWithExpiry", "enrollBundleWithExpiry", "deleteUser"],
        },
      },
    },
  };
}

export class PlaygroundController {
  /** Catálogo dos sistemas + métodos disponíveis para a UI montar tabs/dropdowns. */
  static async status(_req: FastifyRequest, reply: FastifyReply) {
    const reg = registry();
    const systems: Record<string, any> = {};
    for (const [key, sys] of Object.entries(reg)) {
      const resources: Record<string, any> = {};
      for (const [rkey, t] of Object.entries(sys.resources)) {
        resources[rkey] = { methods: t.methods, destructive: t.destructive ?? [] };
      }
      systems[key] = { label: sys.label, configured: sys.configured(), mock: sys.mock(), resources };
    }
    return reply.send({
      vendus: { mode: config.vendus.mode, baseUrl: config.vendus.apiUrl, registerId: config.vendus.registerId || null },
      systems,
    });
  }

  /** Executa { system, resource, action, args[] }. */
  static async run(
    req: FastifyRequest<{ Body: { system?: string; resource?: string; action?: string; args?: unknown[] } }>,
    reply: FastifyReply,
  ) {
    const { system, resource, action, args = [] } = req.body || {};
    const reg = registry();

    const sys = system ? reg[system] : undefined;
    if (!sys) return reply.status(400).send({ ok: false, error: { message: `Sistema inválido: ${system}` } });

    const target = resource ? sys.resources[resource] : undefined;
    if (!target) return reply.status(400).send({ ok: false, error: { message: `Recurso inválido: ${system}.${resource}` } });

    if (!action || !target.methods.includes(action)) {
      return reply.status(400).send({ ok: false, error: { message: `Ação inválida: ${resource}.${action}` } });
    }
    if (!sys.configured()) {
      return reply.status(400).send({ ok: false, error: { message: `${sys.label} não está configurado.` } });
    }

    const fn = target.obj?.[action];
    if (typeof fn !== "function") {
      return reply.status(400).send({ ok: false, error: { message: `Método indisponível: ${resource}.${action}` } });
    }

    try {
      const callArgs = Array.isArray(args) ? args : [args];
      const data = await fn.apply(target.obj, callArgs);
      const out: any = { ok: true, data };
      if (system === "vendus") out.rateLimit = vendus.http.rateLimit;
      return reply.send(out);
    } catch (err) {
      if (err instanceof VendusError) {
        return reply.send({
          ok: false,
          error: { message: err.message, status: err.status, errors: err.errors, body: err.body },
          rateLimit: vendus.http.rateLimit,
        });
      }
      if (err instanceof WhatsappGatewayError) {
        // Local técnico: mostra o que foi enviado e o que o gateway respondeu.
        return reply.send({
          ok: false,
          error: {
            message: err.message,
            status: err.status,
            request: err.request,
            response: err.response,
          },
        });
      }
      const e = err as any;
      return reply.send({
        ok: false,
        error: { message: e?.message ?? "Erro inesperado", status: e?.response?.status, body: e?.response?.data },
      });
    }
  }
}
