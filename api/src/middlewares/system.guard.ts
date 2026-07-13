import type { FastifyReply, FastifyRequest } from "fastify"
import type { FastifyInstance } from "fastify/types"

export function requireSystemRule(fastify: FastifyInstance, systemRule: string) {
  return requireAnySystemRule(fastify, [systemRule])
}

/** Autoriza se o utilizador tiver QUALQUER uma das regras indicadas (ou "*"). */
export function requireAnySystemRule(fastify: FastifyInstance, systemRules: string[]) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await fastify.authenticate(req, reply)
      const user: any = req.user
      const rules: string[] = Array.isArray(user?.rules) ? user.rules : []
      const allowed = rules.includes("*") || systemRules.some((r) => rules.includes(r))
      if (!allowed) {
        return reply.status(403).send({
          message: "Permissões insuficientes para aceder a este módulo.",
          type: "danger",
        })
      }
    } catch {
      return reply.status(401).send({
        message: "Token inválido ou expirado.",
        type: "danger",
      })
    }
  }
}
