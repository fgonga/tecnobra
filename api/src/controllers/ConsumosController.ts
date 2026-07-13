import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { ConsumosService } from "../services/ConsumosService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class ConsumosController extends BaseCrudController<ConsumosService> {
  constructor() {
    super(new ConsumosService());
  }

  store = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await (this.service as ConsumosService).store({
        ...(req.body as any),
        registado_por: Number((req.user as any)?.sub),
      });
      try {
        req.server.io.to(`obra:${result.consumo.obra_id}`).emit("stock-update", {
          material_id: result.material.id,
          stock_atual: result.material.stock_atual,
          stock_baixo: result.stock_baixo,
        });
      } catch (e) {
        req.log.error({ err: e }, "stock-update emit falhou");
      }
      reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
