import { InfluencersService } from "../services/InfluencersService";
import { BaseCrudController } from "./BaseCrudController";
import { handleControllerError } from "../exceptions/handleControllerError";
import { eventQueue } from "../queues";
import { InfluencerModel } from "../models/influencer.model";
import type { FastifyRequest, FastifyReply } from "fastify";

export class InfluencersController extends BaseCrudController<InfluencersService> {
  constructor() {
    super(new InfluencersService());
  }

  store = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const data = await this.service.store(req.body)
      if (data?.id) {
        await eventQueue.add("influencer-sync-event", {
          type: "influencer_sync",
          data: { influencerId: data.id },
        })
      }
      reply.code(200).send(data)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const id = Number((req.params as any).id)
      const body = req.body as any

      // Verificar se o coupon_id mudou ANTES de actualizar
      let couponChanged = false
      if (body?.coupon_id) {
        const existing = await InfluencerModel.findOneBy("id", id)
        couponChanged = existing != null && Number(existing.coupon_id) !== Number(body.coupon_id)
      }

      const ok = await this.service.update(id, body)

      // Sempre sincronizar dados do parceiro
      await eventQueue.add("influencer-sync-event", {
        type: "influencer_sync",
        data: { influencerId: id },
      })

      // Só emitir coupon_updated se o cupão realmente mudou
      if (couponChanged) {
        await eventQueue.add("coupon-updated-event", {
          type: "coupon_updated",
          data: { couponId: body.coupon_id, influencerId: id },
        })
      }

      reply.code(200).send(ok)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }
}
