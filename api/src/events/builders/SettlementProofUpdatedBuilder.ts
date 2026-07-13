import { EventPayloadBuilder } from "../EventBuilderRegistry"
import { SettlementModel } from "../../models/settlement.model"

export class SettlementProofUpdatedBuilder implements EventPayloadBuilder {
  supports(type: string): boolean {
    return type === "settlement_proof_updated"
  }

  async build(eventData: any) {
    const { settlementId, proofUrls } = eventData.data
    if (!settlementId) throw new Error("settlementId required")

    // proofUrls pode vir directamente do event data (já serializado pelo controller)
    // mas consultamos o registo para garantir consistência
    const [row] = await SettlementModel.query<any>(
      `SELECT s.id, s.proof_urls, c.code AS coupon_code
       FROM settlements s
       LEFT JOIN influencers i ON i.id = s.influencer_id
       LEFT JOIN coupons c ON c.id = i.coupon_id
       WHERE s.id = ?`,
      [settlementId]
    )
    if (!row) throw new Error(`Settlement ${settlementId} not found`)

    const urls = row.proof_urls
      ? (typeof row.proof_urls === "string" ? JSON.parse(row.proof_urls) : row.proof_urls)
      : []

    return {
      settlement_id: row.id,
      coupon_code:   row.coupon_code ?? null,
      proof_urls:    urls,
    }
  }
}
