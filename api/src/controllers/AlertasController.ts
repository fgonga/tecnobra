import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { BaseCrudService } from "../services/BaseCrudService";
import { AlertaModel } from "../models/alerta.model";
import { handleControllerError } from "../exceptions/handleControllerError";

class AlertasService extends BaseCrudService<typeof AlertaModel> {
  constructor() {
    super(AlertaModel);
  }
}

export class AlertasController extends BaseCrudController<AlertasService> {
  constructor() {
    super(new AlertasService());
  }

  /** POST /api/v1/alertas/:id/resolver */
  static resolver = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const alerta = await AlertaModel.findOneBy("id", Number(id));
      if (!alerta) return reply.code(404).send({ message: "Alerta não encontrado.", type: "danger" });
      await AlertaModel.update(Number(id), {
        estado: "resolvido",
        resolvido_por: Number((req.user as any)?.sub),
        resolvido_em: new Date().toISOString().slice(0, 19).replace("T", " "),
      });
      reply.code(200).send({ ok: true, message: "Alerta resolvido." });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  /** GET /api/v1/alertas/abertos/contagem — badge do menu */
  static contagem = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rows = await AlertaModel.query<any>(`SELECT COUNT(*) AS total FROM alertas WHERE estado = 'aberto'`);
      reply.code(200).send({ total: Number(rows[0]?.total ?? 0) });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
