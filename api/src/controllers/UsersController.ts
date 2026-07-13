import type { FastifyRequest, FastifyReply } from "fastify";
import { UsersService } from "../services/UsersService";
import { BaseCrudController } from "./BaseCrudController";
import { handleControllerError } from "../exceptions/handleControllerError";
import { config } from "../config/env";

export class UsersController extends BaseCrudController<UsersService> {
  constructor() {
    super(new UsersService());
  }

  static resetPassword = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as any;
      const defaultPassword = config.server.defaultPassword;
      await UsersService.resetPassword(Number(id), defaultPassword);
      reply.code(200).send({ success: true, message: 'Palavra-passe redefinida para o padrão.' });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
