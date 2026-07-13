/*
 *  Tecnobra — Monta a árvore de variáveis ({{trabalhador.*}}, {{visitante.*}},
 *  {{equipamento.*}}, {{material.*}}, {{empresa.*}}, {{obra.*}}, {{cartao.*}},
 *  {{brand.*}}) a partir de um contexto mínimo (ids das entidades).
 */

import dayjs from "dayjs";
import { db } from "../../db/db";
import { config } from "../../config/env";

export type NotificationContext = {
  trabalhadorId?: number;
  visitanteId?: number;
  equipamentoId?: number;
  materialId?: number;
  obraId?: number;
  phone?: string;
  email?: string;
};

export type BuiltPayload = {
  vars: Record<string, any>;
  phone: string | null;
  email: string | null;
};

const fmtDate = (v: any) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "");

export class VariablePayloadBuilder {
  static async build(ctx: NotificationContext): Promise<BuiltPayload> {
    const vars: Record<string, any> = {
      brand: { name: "Tecnobra" },
    };
    let phone: string | null = ctx.phone || null;
    let email: string | null = ctx.email || null;
    let obraId: number | null = ctx.obraId ?? null;

    if (ctx.trabalhadorId) {
      const [rows]: any = await db.execute(
        `SELECT t.*, e.nome AS empresa_nome FROM trabalhadores t
         LEFT JOIN empresas e ON e.id = t.empresa_id
         WHERE t.id = ? LIMIT 1`,
        [ctx.trabalhadorId]
      );
      const t = rows[0];
      if (t) {
        vars.trabalhador = {
          nome: t.nome,
          primeiro_nome: (t.nome || "").trim().split(/\s+/)[0] || "",
          funcao: t.funcao ?? "",
        };
        vars.empresa = { nome: t.empresa_nome ?? "" };
        vars.cartao = { link: `${config.server.frontendUrl}/c/${t.qr_token}` };
        phone = phone || t.telefone || null;
        email = email || t.email || null;
        obraId = obraId ?? t.obra_id;
      }
    }

    if (ctx.visitanteId) {
      const [rows]: any = await db.execute(`SELECT * FROM visitantes WHERE id = ? LIMIT 1`, [ctx.visitanteId]);
      const v = rows[0];
      if (v) {
        vars.visitante = {
          nome: v.nome,
          motivo: v.motivo ?? "",
          valido_de: fmtDate(v.valido_de),
          valido_ate: fmtDate(v.valido_ate),
        };
        vars.cartao = { link: `${config.server.frontendUrl}/c/${v.qr_token}` };
        phone = phone || v.telefone || null;
        email = email || v.email || null;
        obraId = obraId ?? v.obra_id;
      }
    }

    if (ctx.equipamentoId) {
      const [rows]: any = await db.execute(
        `SELECT eq.*, t.nome AS trab_nome, t.telefone AS trab_telefone, e.nome AS empresa_nome
         FROM equipamentos eq
         LEFT JOIN trabalhadores t ON t.id = eq.trabalhador_atual_id
         LEFT JOIN empresas e ON e.id = t.empresa_id
         WHERE eq.id = ? LIMIT 1`,
        [ctx.equipamentoId]
      );
      const eq = rows[0];
      if (eq) {
        vars.equipamento = { nome: eq.nome, codigo: eq.codigo ?? "" };
        if (eq.trab_nome) {
          vars.trabalhador = { ...(vars.trabalhador ?? {}), nome: eq.trab_nome };
          vars.empresa = { nome: eq.empresa_nome ?? "" };
        }
        obraId = obraId ?? eq.obra_id;
      }
    }

    if (ctx.materialId) {
      const [rows]: any = await db.execute(`SELECT * FROM materiais WHERE id = ? LIMIT 1`, [ctx.materialId]);
      const m = rows[0];
      if (m) {
        vars.material = {
          nome: m.nome,
          unidade: m.unidade,
          stock_atual: String(Number(m.stock_atual)),
          stock_minimo: String(Number(m.stock_minimo)),
        };
        obraId = obraId ?? m.obra_id;
      }
    }

    if (obraId) {
      const [rows]: any = await db.execute(`SELECT nome, codigo FROM obras WHERE id = ? LIMIT 1`, [obraId]);
      const o = rows[0];
      if (o) vars.obra = { nome: o.nome, codigo: o.codigo };
    }

    return { vars, phone, email };
  }
}
