import { db } from "../db/db";
import { Payment, PaymentModel } from "../models/payment.model";
import { Order, OrderModel } from "../models/order.model";
import { Course, CourseModel } from "../models/course.model";
import { OrderCustomer, OrderCustomerModel } from "../models/order_customer.model";
import { Thinkific } from "@bit/thinkificts/Thinkific";
import { nowTo } from "../utils/date";
import { AppLogger } from "../logger/AppLogger";
import "dotenv/config";
type ThinkificType = "course" | "bundle";

export class EnrolmentService {
  static async process(paymentCode: string): Promise<{ success: boolean }> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const payment = await PaymentModel.findOneBy("code", paymentCode, connection) as Payment;
      if (!payment) throw new Error(`Payment not found: ${paymentCode}`);

      const order = await OrderModel.findOneBy("id", payment.order_id, connection) as Order;
      if (!order) throw new Error(`Order not found: ${payment.order_id}`);

      const course = await CourseModel.findOneBy("id", order.course_id, connection) as Course;
      if (!course) throw new Error(`Course not found: ${order.course_id}`);

      const orderCustomers = await OrderCustomerModel.findAllBy(
        "order_id",
        order.id,
        connection
      ) as OrderCustomer[];

      for (const oc of orderCustomers) {
        await this.enrollCustomer(oc, course, connection);
      }

      await OrderModel.update(
        order.id,
        { status: "completed", completed_at: nowTo(0) },
        connection
      );

      await connection.commit();
      return { success: true };

    } catch (e) {
      await connection.rollback();
      AppLogger.error("EnrolmentService[process]", e);
      throw e;
    } finally {
      connection.release();
    }
  }

  private static async enrollCustomer(
    orderCustomer: OrderCustomer,
    course: Course,
    connection: any
  ): Promise<void> {

    let thinkificUserId = orderCustomer.thinkific_user_id;

    if (!thinkificUserId) {
      const [first, ...rest] = (orderCustomer.name || "").trim().split(/\s+/);

      const user = await Thinkific.safeCreateUser({
        first_name: first || "Nome",
        last_name: rest.join(" ") || "Sobrenome",
        email: orderCustomer.email,
        send_welcome_email: true
      });

      thinkificUserId = user.id;

      await OrderCustomerModel.update(
        orderCustomer.id,
        { thinkific_user_id: thinkificUserId },
        connection
      );
    }

    if (!orderCustomer.thinkific_enrollment_id) {
      const type = (course.thinkific_type || "course").toLowerCase() as ThinkificType;
      const targetId = Number(course.thinkific_id);

      let enrollmentId: number;

      if (type === "bundle") {
        await Thinkific.enrollBundleWithExpiry(thinkificUserId, targetId, 365);
        enrollmentId = 1;
      } else {
        const enrollment = await Thinkific.enrollCourseWithExpiry(
          thinkificUserId,
          targetId,
          365
        );
        enrollmentId = enrollment.id;
      }

      await OrderCustomerModel.update(
        orderCustomer.id,
        {
          thinkific_enrollment_id: enrollmentId,
          status: "completed"
        },
        connection
      );
    }
  }
}
