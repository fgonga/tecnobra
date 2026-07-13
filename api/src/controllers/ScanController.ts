import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { ScanService } from "../services/ScanService";
import { PresencaService } from "../services/PresencaService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class ScanController {
  /** POST /api/v1/scan/resolve { token } */
  static resolve = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = req.body as any;
      reply.code(200).send(await ScanService.resolve(String(token ?? "")));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  /** POST /api/v1/scan/checkin { token | (tipo_entidade, entidade_id), direcao?, portao?, obs? } */
  static checkin = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = (req.body as any) ?? {};
      const result = await ScanService.checkin({
        token: body.token,
        tipo_entidade: body.tipo_entidade,
        entidade_id: body.entidade_id ? Number(body.entidade_id) : undefined,
        direcao: body.direcao,
        metodo: body.metodo,
        portao: body.portao ?? null,
        obs: body.obs ?? null,
        registado_por: Number((req.user as any)?.sub),
      });

      // Tempo real: empurra o movimento + ocupação para a sala da obra
      const obraId = result.movimento.obra_id;
      try {
        const ocupacao = await PresencaService.ocupacao(obraId);
        req.server.io.to(`obra:${obraId}`).emit("presence-update", {
          movimento: result.movimento,
          tipo: result.tipo,
          entidade: {
            id: result.entidade.id,
            nome: result.entidade.nome ?? result.entidade.matricula,
          },
          ocupacao: {
            total: ocupacao.total,
            trabalhadores: ocupacao.trabalhadores,
            visitantes: ocupacao.visitantes,
            veiculos: ocupacao.veiculos,
          },
        });
      } catch (e) {
        // O tempo real nunca deve quebrar o registo
        req.log.error({ err: e }, "presence-update emit falhou");
      }

      reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  /** GET /api/v1/obras/:id/ocupacao */
  static ocupacao = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      reply.code(200).send(await PresencaService.ocupacao(Number(id)));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
