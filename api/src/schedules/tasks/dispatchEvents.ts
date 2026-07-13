import { AsyncTask } from "toad-scheduler"
import axios from "axios"
import pLimit from "p-limit"

import { EventModel } from "../../models/event.model"
import { ScheduleLogger } from "../../logger/ScheduleLogger"
import { config } from "../../config/env"
import { configCache } from "../../services/ConfigCache"

let isRunning = false
let lastRunAt: number | null = null

export async function dispatchEvents() {
  if (isRunning) {
    ScheduleLogger.warn("dispatchEvents[skip] already running")
    return
  }

  // Sem webhook externo configurado, não há para onde despachar eventos.
  if (!config.partner.apiUrl) return

  const cfg = await configCache.get()
  const intervalSeconds = cfg.events_dispatch_interval ?? 60
  const intervalMs = intervalSeconds * 1000
  const now = Date.now()
  if (lastRunAt !== null && now - lastRunAt < intervalMs) {
    ScheduleLogger.info(`dispatchEvents[skip] intervalo de ${intervalSeconds}s ainda não atingido`)
    return
  }
  lastRunAt = now

  isRunning = true
  ScheduleLogger.info("dispatchEvents[start]")

  try {
    const events = await EventModel.findPendingForDispatch(200)

    ScheduleLogger.info(`dispatchEvents[run] found ${events.length} events`)
    ScheduleLogger.info(`dispatchEvents[eventSample] ${JSON.stringify(events[0] ?? null)}`)

    const limit = pLimit(20)

    await Promise.all(
      events.map(event =>
        limit(() => processSingle(event))
      )
    )

  } catch (err: any) {
    ScheduleLogger.error("dispatchEvents[error] " + String(err?.message))
    ScheduleLogger.error("dispatchEvents[stack] " + String(err?.stack))
  }

  ScheduleLogger.info("dispatchEvents[end]")
  isRunning = false
}

async function processSingle(event: any) {
  ScheduleLogger.info(`EVENT RAW: ${JSON.stringify(event)}`)
  ScheduleLogger.info(`EVENT TYPES: id=${typeof event?.id} retry=${typeof event?.retry_count} max=${typeof event?.max_retries}`)

  try {
    ScheduleLogger.info(`EVENT[${event?.id}] -> markProcessing`)
    await EventModel.markProcessing(event.id)

    ScheduleLogger.info(`EVENT[${event?.id}] -> axios START`)

    const response = await axios.post(
      `${config.partner.apiUrl}/api/v1/webhooks/events/dispatch`,
      {
        key: config.partner.apiKey,
        event: event
      },
      { timeout: 1000 }
    )

    ScheduleLogger.info(`EVENT[${event?.id}] -> axios OK status=${response.status}`)

    ScheduleLogger.info(`EVENT[${event?.id}] -> markProcessed`)
    await EventModel.markProcessed(event.id)

    ScheduleLogger.info(`EVENT[${event?.id}] DONE`)

  } catch (err: any) {
    ScheduleLogger.info(`EVENT[${event?.id}] -> ERROR CAUGHT`)
    ScheduleLogger.info(`ERROR TYPE: ${typeof err}`)
    ScheduleLogger.info(`ERROR MESSAGE: ${String(err?.message)}`)
    ScheduleLogger.info(`ERROR STACK: ${String(err?.stack)}`)

    if (err?.response) {
      ScheduleLogger.info(`AXIOS STATUS: ${err.response.status}`)
      ScheduleLogger.info(`AXIOS DATA: ${JSON.stringify(err.response.data)}`)
    }

    await EventModel.markFailedOrRetry(
      event,
      String(err?.message ?? 'unknown error')
    )
  }
}

export default new AsyncTask(
  "dispatchEvents",
  dispatchEvents
)