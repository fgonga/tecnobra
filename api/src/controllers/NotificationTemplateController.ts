/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 */

import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify/types/reply";
import { BaseCrudController } from "./BaseCrudController";
import { NotificationTemplateService } from "../services/NotificationTemplateService";
import { EventVariableRegistry } from "../services/notification/EventVariableRegistry";
import { handleControllerError } from "../exceptions/handleControllerError";

export class NotificationTemplateController extends BaseCrudController<NotificationTemplateService> {
  constructor() {
    super(new NotificationTemplateService());
  }

  catalog = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.code(200).send({
        events: EventVariableRegistry.EVENTS,
        variables: EventVariableRegistry.catalog(),
      });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  preview = async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      reply.code(200).send(this.service.preview(req.body));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };

  test = async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      reply.code(200).send(await this.service.sendTest(req.body));
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  };
}
