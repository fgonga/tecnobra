import type { FastifyReply, FastifyRequest } from "fastify";
import { handleControllerError } from "../exceptions/handleControllerError";
import {AuthService} from "../services/AuthService";
import {PaginationRequestDto} from "../dtos/index";
import {CoursesService} from "../services/CoursesService";
import {BaseCrudController} from "./BaseCrudController";

export class CoursesController extends BaseCrudController<CoursesService> {
  constructor() {
    super(new CoursesService());
  }
  static async synchronize(
      req: FastifyRequest<{ Body: any }>,
      reply: FastifyReply
  ) {
    try {
      const result = await CoursesService.synchronize()
      return reply.code(200).send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  // Passo 1 do fluxo interativo: lista leve do catálogo remoto (rápida).
  static async syncManifest(req: FastifyRequest, reply: FastifyReply) {
    try {
      const items = await CoursesService.syncManifest()
      return reply.send({ items, total: items.length });
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  // Passo 2: sincroniza 1 produto (o frontend chama isto item-a-item, com progresso).
  static async syncItem(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const result = await CoursesService.syncItem(req.body)
      return reply.send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  // Passo 3: apaga cursos locais órfãos (não vistos no manifesto).
  static async syncFinalize(req: FastifyRequest<{ Body: { slugs?: string[] } }>, reply: FastifyReply) {
    try {
      const result = await CoursesService.finalize(req.body?.slugs || [])
      return reply.send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  // Sync de um único curso pelo slug (modal "Adicionar").
  static async syncOne(req: FastifyRequest<{ Body: { slug?: string } }>, reply: FastifyReply) {
    try {
      const slug = req.body?.slug?.trim()
      if (!slug) return reply.code(422).send({ message: "Informe o slug do curso." });
      const result = await CoursesService.syncOne(slug)
      if (!result) return reply.code(404).send({ message: "Nenhum curso com esse slug foi encontrado no Thinkific." });
      return reply.send(result);
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }

  // Recomendações públicas para o fim do teste de nível (+Inglês primeiro).
  static async recommend(
      req: FastifyRequest<{ Querystring: { level?: string } }>,
      reply: FastifyReply
  ) {
    try {
      const rawLevel = (req.query as any)?.level
      const level = Array.isArray(rawLevel) ? rawLevel[0] : rawLevel
      const courses = await CoursesService.recommendForLevel(level)
      return reply.code(200).send({ level: (level || "").toString().toUpperCase() || null, courses })
    } catch (err: any) {
      handleControllerError(reply, err);
    }
  }
}
