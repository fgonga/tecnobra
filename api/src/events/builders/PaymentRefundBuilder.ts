import { EventPayloadBuilder } from "../EventPayloadBuilder"
import { BaseModel } from "../../models/base.model"
import { CouponModel } from "../../models/coupon.model"

export class PaymentRefundBuilder implements EventPayloadBuilder {

  supports(type: string): boolean {
    return type === "payment_refund"
  }

  async build(eventData: any) {
    if (!eventData?.data?.refundId) {
      throw new Error("refundId required")
    }

    const [refund] = await BaseModel.query<any>(
      `SELECT * FROM refunds WHERE id = ? LIMIT 1`,
      [eventData.data.refundId]
    )
    if (!refund) throw new Error("Refund not found")

    const [order] = await BaseModel.query<any>(
      `SELECT * FROM orders WHERE id = ? LIMIT 1`,
      [refund.order_id]
    )

    const [payment] = refund.payment_id
      ? await BaseModel.query<any>(`SELECT * FROM payments WHERE id = ? LIMIT 1`, [refund.payment_id])
      : [null]

    const coupon = order?.coupon_id
      ? await CouponModel.findOneBy("id", order.coupon_id)
      : null

    return { refund, order, payment, coupon }
  }
}
