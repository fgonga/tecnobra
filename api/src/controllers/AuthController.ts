import type { FastifyReply, FastifyRequest } from "fastify";
import { handleControllerError } from "../exceptions/handleControllerError";
import {AuthService} from "../services/AuthService";

export class AuthController {
  static async login(
    req: FastifyRequest<{ Body: { identification: string; password: string } }>,
    reply: FastifyReply
  ) {
    try {
      const result = await AuthService.login(req.body);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async checkPhone(
    req: FastifyRequest<{ Body: { phone: string } }>,
    reply: FastifyReply
  ) {
    try {
      const result = await AuthService.checkPhone(req.body.phone);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async verifyCode(
    req: FastifyRequest<{ Body: { phone: string; code: string } }>,
    reply: FastifyReply
  ) {
    try {
      const result = await AuthService.verifyCode(req.body.phone, req.body.code);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  static async resetPassword(
    req: FastifyRequest<{ Body: { phone: string; password: string; token: string } }>,
    reply: FastifyReply
  ) {
    try {
      const result = await AuthService.resetPassword(req.body.phone, req.body.password, req.body.token);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }
}
