import { EventModel } from "../models/event.model"
import { BaseCrudService } from "./BaseCrudService"
import { v4 as uuidv4 } from "uuid"
import { nowTo } from "../utils/date"
import {EventBuilderRegistry} from "../events/EventBuilderRegistry";

export class EventService extends BaseCrudService<typeof EventModel> {

  constructor() {
    super(EventModel)
  }

  static async processEvent(eventData: any) {
    const builder = EventBuilderRegistry.getBuilder(eventData.type)

    const payload = builder
      ? await builder.build(eventData)
      : null

    const data = {
      status: "pending",
      type: eventData.type,
      max_retries: eventData.maxRetries ?? 10,
      retry_count: 0,
      created_at: nowTo(),
      unique_code: uuidv4(),
      ...(payload && { payload: JSON.stringify(payload) })
    }

    return EventModel.genericCreate(data)
  }
}