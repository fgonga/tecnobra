import { handleControllerError } from "../exceptions/handleControllerError";
import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { SettlementService } from "../services/SettlementService";
import { SettlementModel } from "../models/settlement.model";
import { ValidationError } from "../exceptions/ValidationError";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { eventQueue } from "../queues";

const settlementService = new SettlementService();

export class SettlementController extends BaseCrudController<SettlementService> {
  constructor() {
    super(settlementService);
  }

  store = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const data = await this.service.store(req.body)
      if (data?.id && data?.type === "influencer") {
        await eventQueue.add("settlement-created-event", {
          type: "settlement_created",
          data: { settlementId: data.id },
        });
      }
      reply.code(200).send(data)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  };

  static balance = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await SettlementService.balance();
      reply.code(200).send(data);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static calculate = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await SettlementService.calculate(req.body as any);
      reply.code(200).send(data);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  private static saveDataUrl(id: string | number, dataUrl: string): string | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const ext = mime === "application/pdf" ? "pdf"
              : mime === "image/png"       ? "png"
              : mime === "image/webp"      ? "webp"
              : "jpg";
    const uploadsDir = join(process.cwd(), "uploads", "proofs");
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
    const filename = `${crypto.randomUUID()}.${ext}`;
    writeFileSync(join(uploadsDir, filename), Buffer.from(match[2], "base64"));
    return `/uploads/proofs/${filename}`;
  }

  static markAsPaid = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const { reference, proof_urls: rawProofs, notes } = (req.body as any) || {};

      const proofPaths: string[] = [];
      const rawArray: any[] = Array.isArray(rawProofs) ? rawProofs : (rawProofs ? [rawProofs] : []);
      for (const raw of rawArray) {
        if (typeof raw === "string" && raw.startsWith("data:")) {
          const saved = SettlementController.saveDataUrl(id, raw);
          if (saved) proofPaths.push(saved);
        } else if (typeof raw === "string" && raw.startsWith("/uploads/")) {
          proofPaths.push(raw);
        }
      }

      const record = await SettlementModel.markAsPaid(Number(id), {
        reference,
        proof_urls: proofPaths.length ? proofPaths : undefined,
        notes,
      });

      // Emitir evento para parceiros quando repasse de influencer é marcado como pago
      if (record?.type === "influencer" && record?.influencer_id) {
        await eventQueue.add("settlement-paid-event", {
          type: "settlement_paid",
          data: { settlementId: Number(id) },
        });
      }

      reply.code(200).send(record);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const id = Number((req.params as any).id);
      const settlement = await SettlementModel.findOneById({ id });
      if (!settlement) throw new ValidationError("Repasse não encontrado.", 404, "Danger");
      if (settlement.status === "paid") throw new ValidationError("Não é possível remover um repasse já pago.", 409, "Danger");

      // Notificar parceiros ANTES de eliminar (o builder ainda precisa do registo)
      if (settlement.type === "influencer" && settlement.influencer_id) {
        await eventQueue.add("settlement-cancelled-event", {
          type: "settlement_cancelled",
          data: { settlementId: id },
        });
      }

      await (this.service as SettlementService).delete(id);

      reply.code(200).send({ ok: true });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static addProof = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const { proof_url: raw } = (req.body as any) || {};
      if (!raw || !raw.startsWith("data:")) return reply.code(400).send({ message: "Ficheiro inválido." });
      const saved = SettlementController.saveDataUrl(id, raw);
      if (!saved) return reply.code(400).send({ message: "Não foi possível processar o ficheiro." });
      const record = await SettlementModel.addProof(Number(id), saved);

      if (record?.type === "influencer" && record?.influencer_id) {
        await eventQueue.add("settlement-proof-updated-event", {
          type: "settlement_proof_updated",
          data: { settlementId: Number(id), proofUrls: record.proof_urls },
        });
      }

      reply.code(200).send(record);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static removeProof = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id, filename } = req.params as any;
      if (!filename || filename.includes("..") || filename.includes("/")) {
        return reply.code(400).send({ message: "Nome de ficheiro inválido." });
      }
      const filepath = join(process.cwd(), "uploads", "proofs", filename);
      if (existsSync(filepath)) unlinkSync(filepath);
      const record = await SettlementModel.removeProof(Number(id), filename);

      if (record?.type === "influencer" && record?.influencer_id) {
        await eventQueue.add("settlement-proof-updated-event", {
          type: "settlement_proof_updated",
          data: { settlementId: Number(id), proofUrls: record.proof_urls },
        });
      }

      reply.code(200).send(record);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static serveProof = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { filename } = req.params as any;
      // Prevent path traversal
      if (!filename || filename.includes("..") || filename.includes("/")) {
        return reply.code(400).send({ message: "Invalid filename." });
      }
      const filepath = join(process.cwd(), "uploads", "proofs", filename);
      if (!existsSync(filepath)) return reply.code(404).send({ message: "Ficheiro não encontrado." });
      const ext = filename.split(".").pop()?.toLowerCase();
      const mimeMap: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
      const contentType = mimeMap[ext ?? ""] || "application/octet-stream";
      reply.header("Content-Type", contentType);
      reply.header("Content-Disposition", `inline; filename="${filename}"`);
      reply.send(readFileSync(filepath));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static transactions = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = req.query as any;
      const data = await SettlementService.transactions({
        page:          query.page,
        perPage:       query.perPage,
        account:       query.account,
        influencer_id: query.influencer_id,
        dateFrom:      query.dateFrom,
        dateTo:        query.dateTo,
        type:          query.type,
      });
      reply.code(200).send(data);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static bulkCreate = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await SettlementService.bulkCreateInfluencer(req.body as any);
      // Emitir settlement_created para cada repasse de influencer criado
      for (const record of data) {
        if (record?.id && record?.type === "influencer") {
          await eventQueue.add("settlement-created-event", {
            type: "settlement_created",
            data: { settlementId: record.id },
          });
        }
      }
      reply.code(201).send(data);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static addManualTransaction = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await SettlementService.addManualTransaction(req.body as any);
      reply.code(201).send({ ok: true });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
