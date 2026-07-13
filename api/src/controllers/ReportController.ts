import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { ReportService } from "../services/ReportService";
import { handleControllerError } from "../exceptions/handleControllerError";

export class ReportController {
  static presencas = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.code(200).send(await ReportService.presencas(req.query as any));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static visitantes = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.code(200).send(await ReportService.visitantes(req.query as any));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static inventario = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.code(200).send(await ReportService.inventario(req.query as any));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static materiais = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.code(200).send(await ReportService.materiais(req.query as any));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static desempenho = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.code(200).send(await ReportService.desempenho(req.query as any));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
