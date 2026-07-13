import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { MateriaisService } from "../services/MateriaisService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class MateriaisController extends BaseCrudController<MateriaisService> {
  constructor() {
    super(new MateriaisService());
  }

  /** GET /api/v1/obras/:id/stock — painel de stock da obra */
  static stock = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      reply.code(200).send(await MateriaisService.stock(Number(id)));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
