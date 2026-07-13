/*
 *  Tecnobra — Cartões digitais (trabalhadores e visitantes).
 *
 *  O QR do cartão codifica `${FRONTEND_URL}/c/<token>`; o token é um nanoid
 *  opaco guardado na entidade (revogável). O endpoint público devolve apenas
 *  os campos de apresentação do cartão.
 */

import { nanoid } from "nanoid";
import { db } from "../db/db";
import { config } from "../config/env";
import { QrService } from "./QrService";
import { TrabalhadorModel } from "../models/trabalhador.model";
import { ValidationError } from "../exceptions/ValidationError";
import { notificationQueue } from "../queues";

export type CardPayload = {
  tipo: "trabalhador" | "visitante";
  nome: string;
  subtitulo: string;        // função (trabalhador) ou motivo (visitante)
  empresa: string | null;
  obra: string | null;
  foto: string | null;
  validade: { de: string | null; ate: string | null } | null;
  qrDataUrl: string;
};

export class CardService {
  static cardLink(token: string): string {
    return `${config.server.frontendUrl}/c/${token}`;
  }

  /** Resolve um token público para o payload do cartão (404 se revogado/inexistente). */
  static async resolvePublicCard(token: string): Promise<CardPayload> {
    // Trabalhador?
    const [tRows]: any = await db.execute(
      `SELECT t.nome, t.funcao, t.foto, t.cartao_estado, t.estado,
              e.nome AS empresa_nome, o.nome AS obra_nome
       FROM trabalhadores t
       LEFT JOIN empresas e ON e.id = t.empresa_id
       LEFT JOIN obras o ON o.id = t.obra_id
       WHERE t.qr_token = ? LIMIT 1`,
      [token]
    );
    const t = tRows[0];
    if (t) {
      if (t.cartao_estado !== "ativo" || t.estado === "inativo") {
        throw new ValidationError("Cartão não encontrado.", 404, "danger");
      }
      return {
        tipo: "trabalhador",
        nome: t.nome,
        subtitulo: t.funcao ?? "",
        empresa: t.empresa_nome ?? null,
        obra: t.obra_nome ?? null,
        foto: t.foto ?? null,
        validade: null,
        qrDataUrl: await QrService.toDataUrl(this.cardLink(token)),
      };
    }

    // Visitante?
    const [vRows]: any = await db.execute(
      `SELECT v.nome, v.motivo, v.empresa, v.estado, v.valido_de, v.valido_ate,
              o.nome AS obra_nome
       FROM visitantes v
       LEFT JOIN obras o ON o.id = v.obra_id
       WHERE v.qr_token = ? LIMIT 1`,
      [token]
    );
    const v = vRows[0];
    if (v) {
      if (v.estado === "encerrado") {
        throw new ValidationError("Cartão não encontrado.", 404, "danger");
      }
      return {
        tipo: "visitante",
        nome: v.nome,
        subtitulo: v.motivo ?? "",
        empresa: v.empresa ?? null,
        obra: v.obra_nome ?? null,
        foto: null,
        validade: { de: v.valido_de, ate: v.valido_ate },
        qrDataUrl: await QrService.toDataUrl(this.cardLink(token)),
      };
    }

    throw new ValidationError("Cartão não encontrado.", 404, "danger");
  }

  /**
   * Emite (ou renova) o cartão de um trabalhador e dispara a notificação
   * WorkerCardIssued (email com QR anexo + whatsapp com ligação).
   */
  static async issueWorkerCard(trabalhadorId: number, renovar = false): Promise<{ link: string; qrDataUrl: string }> {
    const trabalhador = await TrabalhadorModel.findOneBy("id", trabalhadorId);
    if (!trabalhador) throw new ValidationError("Trabalhador não encontrado.", 404, "danger");
    if (trabalhador.estado === "inativo") {
      throw new ValidationError("Não é possível emitir cartão para um trabalhador inativo.", 422, "danger");
    }

    let token = trabalhador.qr_token;
    if (renovar || !token) {
      token = nanoid(21);
    }
    await TrabalhadorModel.update(trabalhadorId, {
      qr_token: token,
      cartao_estado: "ativo",
      cartao_emitido_em: new Date().toISOString().slice(0, 19).replace("T", " "),
    });

    const link = this.cardLink(token);
    const qrPng = await QrService.toPngBuffer(link);

    await notificationQueue.add("notification", {
      notify: "WorkerCardIssued",
      context: { trabalhadorId },
      attachments: [
        {
          filename: "cartao-tecnobra.png",
          contentBase64: qrPng.toString("base64"),
          contentType: "image/png",
        },
      ],
    });

    return { link, qrDataUrl: await QrService.toDataUrl(link) };
  }

  /** Revoga o cartão de um trabalhador (o QR deixa de resolver). */
  static async revokeWorkerCard(trabalhadorId: number): Promise<void> {
    const trabalhador = await TrabalhadorModel.findOneBy("id", trabalhadorId);
    if (!trabalhador) throw new ValidationError("Trabalhador não encontrado.", 404, "danger");
    await TrabalhadorModel.update(trabalhadorId, { cartao_estado: "revogado" });
  }

  /** Pré-visualização do cartão para o back-office (inclui QR). */
  static async workerCardPreview(trabalhadorId: number): Promise<{ link: string; qrDataUrl: string; cartao_estado: string }> {
    const trabalhador = await TrabalhadorModel.findOneBy("id", trabalhadorId);
    if (!trabalhador) throw new ValidationError("Trabalhador não encontrado.", 404, "danger");
    const link = this.cardLink(trabalhador.qr_token);
    return {
      link,
      qrDataUrl: await QrService.toDataUrl(link),
      cartao_estado: trabalhador.cartao_estado,
    };
  }
}
