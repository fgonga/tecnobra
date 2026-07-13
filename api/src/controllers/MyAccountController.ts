import type { FastifyReply, FastifyRequest } from "fastify";
import { handleControllerError } from "../exceptions/handleControllerError";
import type {
  UpdateUserDto,
  UpdatePhoneDto,
  UpdatePasswordDto,
} from "../services/MyAccountService";
import {MyAccountService} from "../services/MyAccountService";
export class MyAccountController {
  static async updateUser(req: FastifyRequest<{ Body: UpdateUserDto }>, reply: FastifyReply) {
    try {
      const result = await MyAccountService.updateUser(req.user, req.body);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async me(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await MyAccountService.me(req.user);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async updatePhone(req: FastifyRequest<{ Body: UpdatePhoneDto }>, reply: FastifyReply) {
    try {
      const result = await MyAccountService.updatePhone(req.user, req.body);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async updatePassword(req: FastifyRequest<{ Body: UpdatePasswordDto }>, reply: FastifyReply) {
    try {
      const result = await MyAccountService.updatePassword(req.user, req.body);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }
}
