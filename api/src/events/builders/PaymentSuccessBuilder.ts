import {EventPayloadBuilder} from "../EventPayloadBuilder";
import {PaymentModel} from "../../models/payment.model";
import {OrderModel} from "../../models/order.model";
import {CouponModel} from "../../models/coupon.model";
import {CourseModel} from "../../models/course.model";

export class PaymentSuccessBuilder implements EventPayloadBuilder {

  supports(type: string): boolean {
    return type === "payment_success"
  }

  async build(eventData: any) {

    if (!eventData?.data?.paymentId) {
      throw new Error("paymentId required")
    }

    const payment = await PaymentModel.findOneBy(
        "code",
        eventData.data.paymentId
    )

    if (!payment) throw new Error("Payment not found")

    const order = await OrderModel.findOneBy("id", payment.order_id)
    if (!order) throw new Error("Order not found")

    const [coupon, course] = await Promise.all([
      order.coupon_id
          ? CouponModel.findOneBy("id", order.coupon_id)
          : null,
      order.course_id
          ? CourseModel.findOneBy("id", order.course_id)
          : null,
    ])

    return {
      payment,
      order,
      coupon,
      course,
    }
  }
}