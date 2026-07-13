import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { GuiasService } from "../services/GuiasService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class GuiasController extends BaseCrudController<GuiasService> {
  constructor() {
    super(new GuiasService());
  }

  store = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await (this.service as GuiasService).store({
        ...(req.body as any),
        registado_por: Number((req.user as any)?.sub),
      });
      // Tempo real: stock alterado
      try {
        req.server.io.to(`obra:${data.obra_id}`).emit("stock-update", { guia_id: data.id });
      } catch (e) {
        req.log.error({ err: e }, "stock-update emit falhou");
      }
      reply.code(200).send(data);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
