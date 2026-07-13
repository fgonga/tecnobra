import { handleControllerError } from "../exceptions/handleControllerError";
import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { RefundService } from "../services/RefundService";

const refundService = new RefundService();

export class RefundController extends BaseCrudController<RefundService> {
  constructor() {
    super(refundService);
  }

  store = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (req as any).user;
      const data = { ...(req.body as any), requested_by: user?.username ?? null };
      const result = await refundService.store(data);
      reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static approve = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const { notes } = (req.body as any) || {};
      const user = (req as any).user;
      const ok = await refundService.approve(Number(id), notes, user?.username ?? undefined);
      reply.code(200).send({ success: ok });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  static reject = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const { notes } = (req.body as any) || {};
      const ok = await refundService.reject(Number(id), notes);
      reply.code(200).send({ success: ok });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
