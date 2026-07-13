import { PaymentSuccessBuilder } from "./builders/PaymentSuccessBuilder"
import { PaymentRefundBuilder } from "./builders/PaymentRefundBuilder"
import { CourseUpdateBuilder } from "./builders/CourseUpdateBuilder"
import { SettlementPaidBuilder } from "./builders/SettlementPaidBuilder"
import { SettlementCreatedBuilder } from "./builders/SettlementCreatedBuilder"
import { SettlementCancelledBuilder } from "./builders/SettlementCancelledBuilder"
import { SettlementProofUpdatedBuilder } from "./builders/SettlementProofUpdatedBuilder"
import { InfluencerSyncBuilder } from "./builders/InfluencerSyncBuilder"
import { CouponUpdatedBuilder } from "./builders/CouponUpdatedBuilder"
export interface EventPayloadBuilder {
  supports(type: string): boolean
  build(eventData: any): Promise<any>
}
export class EventBuilderRegistry {

  private static builders: EventPayloadBuilder[] = [
    new PaymentSuccessBuilder(),
    new PaymentRefundBuilder(),
    new CourseUpdateBuilder(),
    new SettlementPaidBuilder(),
    new SettlementCreatedBuilder(),
    new SettlementCancelledBuilder(),
    new SettlementProofUpdatedBuilder(),
    new InfluencerSyncBuilder(),
    new CouponUpdatedBuilder(),
  ]

  static getBuilder(type: string): EventPayloadBuilder | null {
    return this.builders.find(b => b.supports(type)) || null
  }
}