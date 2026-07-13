import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { CardService } from "../services/CardService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class CardController {
  /** GET /api/public/cards/:token — cartão digital público (sem auth, rate-limited). */
  static show = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = req.params as any;
      if (!token || String(token).length > 32) {
        return reply.code(404).send({ message: "Cartão não encontrado." });
      }
      const card = await CardService.resolvePublicCard(String(token));
      reply.code(200).send(card);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
