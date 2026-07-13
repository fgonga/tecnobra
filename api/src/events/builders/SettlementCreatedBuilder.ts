import { EventPayloadBuilder } from "../EventPayloadBuilder"
import { SettlementModel } from "../../models/settlement.model"

export class SettlementCreatedBuilder implements EventPayloadBuilder {
  supports(type: string): boolean {
    return type === "settlement_created"
  }

  async build(eventData: any) {
    const { settlementId } = eventData.data
    if (!settlementId) throw new Error("settlementId required")

    const [row] = await SettlementModel.query<any>(
      `SELECT s.*, c.code AS coupon_code
       FROM settlements s
       LEFT JOIN influencers i ON i.id = s.influencer_id
       LEFT JOIN coupons c ON c.id = i.coupon_id
       WHERE s.id = ?`,
      [settlementId]
    )
    if (!row) throw new Error(`Settlement ${settlementId} not found`)

    return {
      settlement_id:  row.id,
      type:           row.type,
      influencer_id:  row.influencer_id ?? null,
      coupon_code:    row.coupon_code ?? null,
      amount:         row.amount,
      period_start:   row.period_start ?? null,
      period_end:     row.period_end   ?? null,
      status:         row.status,
    }
  }
}
