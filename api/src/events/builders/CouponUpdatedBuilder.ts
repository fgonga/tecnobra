import { EventPayloadBuilder } from "../EventPayloadBuilder"
import { CouponModel } from "../../models/coupon.model"
import { InfluencerModel } from "../../models/influencer.model"

export class CouponUpdatedBuilder implements EventPayloadBuilder {
  supports(type: string): boolean {
    return type === "coupon_updated"
  }

  async build(eventData: any) {
    const { couponId, influencerId } = eventData.data
    if (!couponId) throw new Error("couponId required")

    const coupon = await CouponModel.findOneBy("id", couponId)
    if (!coupon) throw new Error(`Coupon ${couponId} not found`)

    let influencer = null
    if (influencerId) {
      influencer = await InfluencerModel.findOneBy("id", influencerId)
    } else {
      const rows = await InfluencerModel.query<any>(
        "SELECT id, name, email FROM influencers WHERE coupon_id = ? LIMIT 1",
        [couponId]
      )
      influencer = rows[0] ?? null
    }

    return {
      coupon_id:       coupon.id,
      coupon_code:     coupon.code,
      coupon_active:   coupon.active,
      influencer_id:   influencer?.id ?? null,
      influencer_name: influencer?.name ?? null,
    }
  }
}
