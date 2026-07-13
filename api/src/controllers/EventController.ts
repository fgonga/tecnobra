import type { FastifyRequest, FastifyReply } from "fastify"
import { db } from "../db/db"
import { handleControllerError } from "../exceptions/handleControllerError"
import { config } from "../config/env"
import axios from "axios"
import { EventModel } from "../models/event.model"

export class EventController {

  static async index(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { page = 1, perPage = 30, status, type } = req.query as any
      const offset = (Number(page) - 1) * Number(perPage)
      const conditions: string[] = []
      const params: any[] = []

      if (status) { conditions.push("status = ?"); params.push(status) }
      if (type)   { conditions.push("type = ?");   params.push(type) }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

      const [[{ total }]] = await db.execute(
        `SELECT COUNT(*) as total FROM events ${where}`, params
      ) as any
      // db.query (texto, não prepared): aceita LIMIT/OFFSET inteiros sem o erro
      // "Incorrect arguments to mysqld_stmt_execute" do db.execute.
      const [rows] = await db.query(
        `SELECT * FROM events ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, Number(perPage), Number(offset)]
      ) as any

      return reply.send({ data: rows, total: Number(total), page: Number(page), perPage: Number(perPage) })
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  static async retry(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const id = Number(req.params.id)
      const [[event]] = await db.execute("SELECT * FROM events WHERE id = ?", [id]) as any
      if (!event) return reply.code(404).send({ message: "Evento não encontrado" })

      await db.execute(
        `UPDATE events SET status = 'pending', retry_count = 0, next_retry_at = NULL, last_error = NULL WHERE id = ?`,
        [id]
      )
      return reply.send({ ok: true })
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  // Executa o evento agora e devolve o log detalhado da tentativa
  static async execute(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const logs: { ts: string; level: string; msg: string }[] = []
    const log = (level: "info" | "error", msg: string) =>
      logs.push({ ts: new Date().toISOString(), level, msg })

    try {
      const id = Number(req.params.id)
      const [[event]] = await db.execute("SELECT * FROM events WHERE id = ?", [id]) as any
      if (!event) return reply.code(404).send({ message: "Evento não encontrado" })

      log("info", `Evento #${event.id} | tipo: ${event.type} | retry_count: ${event.retry_count}/${event.max_retries}`)

      // Repõe para pending e reset contadores
      await db.execute(
        `UPDATE events SET status = 'pending', retry_count = 0, next_retry_at = NULL, last_error = NULL WHERE id = ?`,
        [id]
      )
      log("info", "Estado reposto para pending")

      // Marca como processing
      await EventModel.markProcessing(event.id)
      log("info", "Marcado como processing")

      const url = `${config.partner.apiUrl}/api/v1/webhooks/events/dispatch`
      const body = { key: config.partner.apiKey, event }

      log("info", `POST ${url}`)
      log("info", `Request body: ${JSON.stringify(body, null, 2)}`)

      let httpStatus: number | null = null
      let httpData: any = null
      let success = false

      try {
        const response = await axios.post(url, body, { timeout: 10000 })
        httpStatus = response.status
        httpData = response.data
        log("info", `Resposta HTTP ${httpStatus}`)
        log("info", `Response body: ${JSON.stringify(httpData, null, 2)}`)
        await EventModel.markProcessed(event.id)
        log("info", "Marcado como processed — sucesso")
        success = true
      } catch (axiosErr: any) {
        httpStatus = axiosErr?.response?.status ?? null
        httpData   = axiosErr?.response?.data   ?? null
        const errMsg = axiosErr?.message ?? "erro desconhecido"
        log("error", `Falha HTTP: ${errMsg}`)
        if (httpStatus) log("error", `Status HTTP: ${httpStatus}`)
        if (httpData)   log("error", `Response body: ${JSON.stringify(httpData, null, 2)}`)
        log("error", `Stack: ${axiosErr?.stack ?? '—'}`)

        const [[fresh]] = await db.execute("SELECT * FROM events WHERE id = ?", [id]) as any
        await EventModel.markFailedOrRetry(fresh, errMsg)
        log("error", `Marcado como failed/retry`)
      }

      // Devolve evento actualizado
      const [[updated]] = await db.execute("SELECT * FROM events WHERE id = ?", [id]) as any

      return reply.send({ success, logs, event: updated, httpStatus, httpData })
    } catch (err: any) {
      log("error", `Erro interno: ${err?.message}`)
      return reply.code(500).send({ success: false, logs, message: err?.message })
    }
  }
}
