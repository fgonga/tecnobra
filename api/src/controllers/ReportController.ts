import { handleControllerError } from "../exceptions/handleControllerError"
import {FastifyRequest} from "fastify/types/request";
import {FastifyReply} from "fastify/types/reply";
import {ReportService} from "../services/ReportService";

export class ReportController {
  static async sales(
      req: FastifyRequest<{ Body: any }>,
      reply: FastifyReply
  ) {
    try {
      return reply.code(200).send(await ReportService.sales(req.query as any));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async report(
      req: FastifyRequest<{ Body: any }>,
      reply: FastifyReply
  ) {
    try {
      return reply.code(200).send(await ReportService.report(req.query || req.body));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async reportDashboard(
      req: FastifyRequest<{ Body: any }>,
      reply: FastifyReply
  ) {
    try {
      return reply.code(200).send(await ReportService.reportDashboard(req.query || req.body));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }
}
