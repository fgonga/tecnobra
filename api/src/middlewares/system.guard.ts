import type { FastifyReply, FastifyRequest } from "fastify"
import type { FastifyInstance } from "fastify/types"

export function requireSystemRule(fastify: FastifyInstance, systemRule: string) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await fastify.authenticate(req, reply)
      const user: any = req.user
      const rules: string[] = Array.isArray(user?.rules) ? user.rules : []
      const allowed = rules.includes("*") || rules.includes(systemRule)
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
