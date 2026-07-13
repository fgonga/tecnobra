import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { DashboardService } from "../services/DashboardService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class DashboardController {
  /** GET /api/v1/report-dashboard?obra_id= */
  static dashboard = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.code(200).send(await DashboardService.dashboard(req.query as any));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
