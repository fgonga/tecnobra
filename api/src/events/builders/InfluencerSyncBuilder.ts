import { EventPayloadBuilder } from "../EventPayloadBuilder"
import { InfluencerModel } from "../../models/influencer.model"
import { CouponModel } from "../../models/coupon.model"

export class InfluencerSyncBuilder implements EventPayloadBuilder {
  supports(type: string): boolean {
    return type === "influencer_sync"
  }

  async build(eventData: any) {
    const { influencerId } = eventData.data
    if (!influencerId) throw new Error("influencerId required")

    const influencer = await InfluencerModel.findOneBy("id", influencerId)
    if (!influencer) throw new Error(`Influencer ${influencerId} not found`)

    const coupon = influencer.coupon_id
      ? await CouponModel.findOneBy("id", influencer.coupon_id)
      : null

    return {
      id:                   influencer.id,
      name:                 influencer.name,
      email:                influencer.email,
      phone:                influencer.phone,
      status:               influencer.status,
      commission:           influencer.commission,
      coupon_code:          coupon?.code ?? null,
      min_payout_kz:        influencer.min_payout_kz ?? null,
      bank_name:            influencer.bank_name ?? null,
      bank_account_name:    influencer.bank_account_name ?? null,
      bank_account_number:  influencer.bank_account_number ?? null,
    }
  }
}
