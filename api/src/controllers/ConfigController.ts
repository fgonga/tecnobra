import { handleControllerError } from "../exceptions/handleControllerError";
import {ConfigModel} from "../models/config.model";
import {configCache} from "../services/ConfigCache";
import {FastifyRequest} from "fastify/types/request";
import {FastifyReply} from "fastify/types/reply";

export class ConfigController {

  static async getConfig(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const result = await ConfigModel.findOneBy("id", 1);
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }
  static async setConfig(req: FastifyRequest<{ body: any }>, reply: FastifyReply) {
    try {
      const result = await ConfigModel.update(1, req.body);
      configCache.invalidate();
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }
}
