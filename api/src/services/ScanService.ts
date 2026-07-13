/*
 *  Tecnobra — Portaria: resolução de tokens QR e registo de entradas/saídas.
 *
 *  O token pode chegar cru ou como URL de cartão (…/c/<token>) — extraímos
 *  sempre o último segmento. A direção, se omitida, é inferida como o
 *  oposto do último movimento da entidade.
 */

import { db } from "../db/db";
import { MovimentoModel, TipoEntidade, Direcao, MetodoRegisto } from "../models/movimento.model";
import { ValidationError } from "../exceptions/ValidationError";

export type ResolveResult = {
  tipo: TipoEntidade | "equipamento" | "material";
  entidade: Record<string, any>;
  ultimoMovimento: Record<string, any> | null;
  direcaoSugerida: Direcao | null;
};

export type CheckinInput = {
  token?: string;
  tipo_entidade?: TipoEntidade;
  entidade_id?: number;
  direcao?: Direcao;
  metodo?: MetodoRegisto;
  portao?: string | null;
  obs?: string | null;
  registado_por: number;
};

export class ScanService {
  /** Extrai o token de um valor lido (token cru ou URL /c/<token>). */
  static extractToken(raw: string): string {
    const value = String(raw ?? "").trim();
    const match = value.match(/\/c\/([A-Za-z0-9_-]{10,32})\/?$/);
    if (match) return match[1];
    return value;
  }

  /** Resolve um token QR para a entidade correspondente. */
  static async resolve(rawToken: string): Promise<ResolveResult> {
    const token = this.extractToken(rawToken);
    if (!token || token.length > 32) {
      throw new ValidationError("Código QR inválido.", 422, "danger");
    }

    // Trabalhador
    const [tRows]: any = await db.execute(
      `SELECT t.id, t.nome, t.funcao, t.foto, t.estado, t.cartao_estado, t.obra_id,
              e.nome AS empresa_nome, o.nome AS obra_nome
       FROM trabalhadores t
       LEFT JOIN empresas e ON e.id = t.empresa_id
       LEFT JOIN obras o ON o.id = t.obra_id
       WHERE t.qr_token = ? LIMIT 1`,
      [token]
    );
    if (tRows[0]) {
      const t = tRows[0];
      const last = await MovimentoModel.lastForEntity("trabalhador", t.id);
      return {
        tipo: "trabalhador",
        entidade: t,
        ultimoMovimento: last,
        direcaoSugerida: last?.direcao === "entrada" ? "saida" : "entrada",
      };
    }

    // Visitante
    const [vRows]: any = await db.execute(
      `SELECT v.*, o.nome AS obra_nome FROM visitantes v
       LEFT JOIN obras o ON o.id = v.obra_id
       WHERE v.qr_token = ? LIMIT 1`,
      [token]
    );
    if (vRows[0]) {
      const v = vRows[0];
      const last = await MovimentoModel.lastForEntity("visitante", v.id);
      return {
        tipo: "visitante",
        entidade: v,
        ultimoMovimento: last,
        direcaoSugerida: last?.direcao === "entrada" ? "saida" : "entrada",
      };
    }

    // Equipamento (para o fluxo levantar/devolver — Fase 3)
    const [eqRows]: any = await db.execute(
      `SELECT eq.*, t.nome AS trabalhador_atual_nome FROM equipamentos eq
       LEFT JOIN trabalhadores t ON t.id = eq.trabalhador_atual_id
       WHERE eq.qr_token = ? LIMIT 1`,
      [token]
    );
    if (eqRows[0]) {
      return { tipo: "equipamento", entidade: eqRows[0], ultimoMovimento: null, direcaoSugerida: null };
    }

    // Material
    const [mRows]: any = await db.execute(
      `SELECT * FROM materiais WHERE qr_token = ? LIMIT 1`,
      [token]
    );
    if (mRows[0]) {
      return { tipo: "material", entidade: mRows[0], ultimoMovimento: null, direcaoSugerida: null };
    }

    throw new ValidationError("Código QR não reconhecido.", 404, "danger");
  }

  /** Regista um movimento de entrada/saída (via QR ou manual). */
  static async checkin(input: CheckinInput): Promise<{ movimento: any; entidade: any; tipo: TipoEntidade }> {
    let tipo: TipoEntidade;
    let entidade: any;

    if (input.token) {
      const resolved = await this.resolve(input.token);
      if (resolved.tipo === "equipamento" || resolved.tipo === "material") {
        throw new ValidationError(
          "Este QR pertence a um equipamento/material — use o fluxo de levantamento/devolução.",
          422, "warning"
        );
      }
      tipo = resolved.tipo;
      entidade = resolved.entidade;
    } else {
      if (!input.tipo_entidade || !input.entidade_id) {
        throw new ValidationError("Indique o token ou a entidade (tipo + id).", 422, "danger");
      }
      tipo = input.tipo_entidade;
      const table = tipo === "trabalhador" ? "trabalhadores" : tipo === "visitante" ? "visitantes" : "veiculos";
      const [rows]: any = await db.execute(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [input.entidade_id]);
      entidade = rows[0];
      if (!entidade) throw new ValidationError("Entidade não encontrada.", 404, "danger");
    }

    // ─── Validações por tipo ───
    if (tipo === "trabalhador") {
      if (entidade.cartao_estado === "revogado" && input.token) {
        throw new ValidationError("Cartão revogado — contacte o encarregado.", 422, "danger");
      }
      if (entidade.estado !== "ativo") {
        throw new ValidationError(`Trabalhador ${entidade.estado} — entrada não permitida.`, 422, "danger");
      }
    }
    if (tipo === "visitante") {
      const now = new Date();
      if (entidade.valido_de && new Date(entidade.valido_de) > now) {
        throw new ValidationError("Cartão de visitante ainda não é válido.", 422, "danger");
      }
      if (entidade.valido_ate && new Date(entidade.valido_ate) < now) {
        throw new ValidationError("Cartão de visitante expirado.", 422, "danger");
      }
    }

    // ─── Direção: explícita ou inferida ───
    const last = await MovimentoModel.lastForEntity(tipo, entidade.id);
    const direcao: Direcao = input.direcao ?? (last?.direcao === "entrada" ? "saida" : "entrada");

    const movimento = await MovimentoModel.create({
      obra_id: entidade.obra_id,
      tipo_entidade: tipo,
      trabalhador_id: tipo === "trabalhador" ? entidade.id : null,
      visitante_id: tipo === "visitante" ? entidade.id : null,
      veiculo_id: tipo === "veiculo" ? entidade.id : null,
      direcao,
      metodo: input.metodo ?? (input.token ? "qr" : "manual"),
      portao: input.portao ?? null,
      registado_por: input.registado_por,
      obs: input.obs ?? null,
    });

    // Visitante entra → estado ativo; sai → encerrado só manualmente (pode voltar a entrar)
    if (tipo === "visitante" && direcao === "entrada" && entidade.estado === "previsto") {
      await db.execute(`UPDATE visitantes SET estado = 'ativo' WHERE id = ?`, [entidade.id]);
    }

    return { movimento, entidade, tipo };
  }
}
