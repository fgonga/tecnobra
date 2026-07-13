import { EventPayloadBuilder } from "../EventBuilderRegistry"
import { SettlementModel } from "../../models/settlement.model"

export class SettlementCancelledBuilder implements EventPayloadBuilder {
  supports(type: string): boolean {
    return type === "settlement_cancelled"
  }

  async build(eventData: any) {
    const { settlementId } = eventData.data
    if (!settlementId) throw new Error("settlementId required")

    // Buscar coupon_code antes da eliminação (o registo pode já não existir)
    const [row] = await SettlementModel.query<any>(
      `SELECT s.*, c.code AS coupon_code
       FROM settlements s
       LEFT JOIN influencers i ON i.id = s.influencer_id
       LEFT JOIN coupons c ON c.id = i.coupon_id
       WHERE s.id = ?`,
      [settlementId]
    )

    return {
      settlement_id: settlementId,
      coupon_code:   row?.coupon_code ?? null,
    }
  }
}
