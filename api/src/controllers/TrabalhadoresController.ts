import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { TrabalhadoresService } from "../services/TrabalhadoresService";
import { CardService } from "../services/CardService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class TrabalhadoresController extends BaseCrudController<TrabalhadoresService> {
  constructor() {
    super(new TrabalhadoresService());
  }

  /** POST /api/v1/trabalhadores/:id/emitir-cartao  { renovar?: boolean } */
  static emitirCartao = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const { renovar } = (req.body as any) ?? {};
      const data = await CardService.issueWorkerCard(Number(id), !!renovar);
      reply.code(200).send({ ...data, message: "Cartão emitido. A notificação será enviada." });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  /** POST /api/v1/trabalhadores/:id/revogar-cartao */
  static revogarCartao = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      await CardService.revokeWorkerCard(Number(id));
      reply.code(200).send({ ok: true, message: "Cartão revogado." });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  /** GET /api/v1/trabalhadores/:id/cartao — pré-visualização (QR + estado) */
  static cartao = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      reply.code(200).send(await CardService.workerCardPreview(Number(id)));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
