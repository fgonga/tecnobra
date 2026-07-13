import { BaseModel } from "./base.model"
import {ScheduleLogger} from "../logger/ScheduleLogger";

export interface Event {
  id?: number
  unique_code: string
  type: "payment_success" | "payment_refund" | "course_update"
  status: "pending" | "processing" | "processed" | "failed"
  payload: string
  retry_count: number
  max_retries: number
  last_error?: string
  created_at?: string
  processed_at?: string
  next_retry_at?: string
}

export class EventModel extends BaseModel {
  static tableName = "events"

  private static async executeWithDebug(sql: string, params: any[]) {
    const conn = this.getConnection()

    ScheduleLogger.info(`[SQL] ${sql.replace(/\s+/g, ' ')}`)
    ScheduleLogger.info(`[PARAMS] ${JSON.stringify(params)}`)
    ScheduleLogger.info(`[TYPES] ${params.map(p => typeof p).join(',')}`)

    return conn.execute(sql, params)
  }

  static async findPendingForDispatch(limit = 10): Promise<Event[]> {
    const safeLimit = Number(limit) || 10

    const sql = `
      SELECT *
      FROM ${this.tableName}
      WHERE 
      (
        status = 'pending'
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      )
      OR
      (
        status = 'processing'
        AND created_at <= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      )
      ORDER BY id ASC
      LIMIT ${safeLimit}
    `

    ScheduleLogger.info(`[findPendingForDispatch] LIMIT=${safeLimit} TYPE=${typeof safeLimit}`)

    const conn = this.getConnection()
    const [rows] = await conn.execute(sql)

    return rows as Event[]
  }

  static async markProcessing(id: number) {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'processing'
      WHERE id = ?
    `
    await this.executeWithDebug(sql, [Number(id)])
  }

  static async markProcessed(id: number) {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'processed',
          processed_at = NOW()
      WHERE id = ?
    `
    await this.executeWithDebug(sql, [Number(id)])
  }

  static async markFailedOrRetry(event: Event, errorMessage: string) {
    const retry = (event.retry_count ?? 0) + 1
    const maxRetries = event.max_retries ?? 0
    const safeId = Number(event.id)
    const safeError = String(errorMessage ?? '')

    ScheduleLogger.info(`[markFailedOrRetry] EVENT_ID=${safeId}`)
    ScheduleLogger.info(`[markFailedOrRetry] RETRY=${retry} MAX=${maxRetries}`)
    ScheduleLogger.info(`[markFailedOrRetry] ERROR_LENGTH=${safeError.length}`)

    if (retry >= maxRetries) {
      const sql = `
        UPDATE ${this.tableName}
        SET status = 'failed',
            retry_count = ?,
            last_error = ?
        WHERE id = ?
      `
      await this.executeWithDebug(sql, [retry, safeError, safeId])
    } else {
      const delaySeconds = Math.max(0, Math.pow(2, retry) * 30)

      const sql = `
        UPDATE ${this.tableName}
        SET status = 'pending',
            retry_count = ?,
            next_retry_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
            last_error = ?
        WHERE id = ?
      `
      await this.executeWithDebug(sql, [
        retry,
        Number(delaySeconds),
        safeError,
        safeId
      ])
    }
  }
}