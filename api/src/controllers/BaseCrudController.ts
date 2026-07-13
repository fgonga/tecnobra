import { handleControllerError } from "../exceptions/handleControllerError"
import {FastifyRequest} from "fastify/types/request";
import {FastifyReply} from "fastify/types/reply";

export class BaseCrudController<TService> {
  protected service: TService

  constructor(service: TService) {
    this.service = service
  }

  index = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const data = await this.service.index(req.query)
      reply.code(200).send(data)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  store = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const data = await this.service.store(req.body)
      reply.code(200).send(data)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  show = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = {
        // @ts-ignore
        id: req.params.id,
        // @ts-ignore
        columns: req.query.columns,
        // @ts-ignore
        with: req.query.with,
      }
      // @ts-ignore
      const record = await this.service.show(data)
      reply.code(200).send(record)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const ok = await this.service.delete(req.params.id)
      reply.code(200).send(ok)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const ok = await this.service.update(req.params.id, req.body)
      reply.code(200).send(ok)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }
}
