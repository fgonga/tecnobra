import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { EquipamentosService } from "../services/EquipamentosService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class EquipamentosController extends BaseCrudController<EquipamentosService> {
  constructor() {
    super(new EquipamentosService());
  }

  private static emitUpdate(req: FastifyRequest, obraId: number, payload: Record<string, any>) {
    try {
      req.server.io.to(`obra:${obraId}`).emit("equipment-update", payload);
    } catch (e) {
      req.log.error({ err: e }, "equipment-update emit falhou");
    }
  }

  /** POST /api/v1/equipamentos/:id/levantar { trabalhador_id, devolucao_prevista?, obs? } */
  static levantar = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const body = (req.body as any) ?? {};
      const result = await EquipamentosService.levantar(Number(id), {
        trabalhador_id: Number(body.trabalhador_id),
        devolucao_prevista: body.devolucao_prevista ?? null,
        obs: body.obs ?? null,
        registado_por: Number((req.user as any)?.sub),
      });
      EquipamentosController.emitUpdate(req, result.obra_id, result);
      reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  /** POST /api/v1/equipamentos/:id/devolver { estado_devolucao?, obs? } */
  static devolver = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const body = (req.body as any) ?? {};
      const result = await EquipamentosService.devolver(Number(id), {
        estado_devolucao: body.estado_devolucao,
        obs: body.obs ?? null,
        registado_por: Number((req.user as any)?.sub),
      });
      EquipamentosController.emitUpdate(req, result.obra_id, result);
      reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
