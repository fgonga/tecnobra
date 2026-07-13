import { db } from "../db/db";
import { Order, OrderModel } from "../models/order.model";
import { OrderCustomerModel } from "../models/order_customer.model";
import { Payment, PaymentModel } from "../models/payment.model";
import { generateCode } from "../utils/generators";
import { formatDate, normalizeDatetimeLocal, nowTo } from "../utils/date";
import { CouponModel, ICoupon } from "../models/coupon.model";
import { ValidationError } from "../exceptions/ValidationError";
import { Course, CourseModel } from "../models/course.model";
import { CalculatorOut, CheckoutCalculator } from "../utils/CheckoutCalculator";
import { Config } from "../models/config.model";
import { configCache } from "./ConfigCache";
import toMoney from "../utils/money";
import dayjs from "dayjs";
import { AppyPayClient } from "@bit/appypayts/src/AppyPayClient";
import {
  CreateChargeInput,
  PaymentMethod,
  QrCharge,
} from "@bit/appypayts/src/types";
import { AppLogger } from "../logger/AppLogger";
import AppyPayWebHookMessage from "../utils/AppyPayMessage";
type PaymentType = "qr" | "express" | "ref";
type Student = { name: string; email: string; phone: string };
interface CheckoutBody {
  students: Student[];
  quantity: number;
  paymentType: PaymentType;
  phone?: string | null;
  coupon_code?: string | null;
  orderCode?: string | null;
  paymentCode?: string | null;
  courseId: number;
  couponId: number;
  cardId?: number;
}
export class CheckoutService {
  static async processOrder(
    body: CheckoutBody,
    calculated: CalculatorOut,
    connection: any,
    card: any,
  ): Promise<{ orderId: number; orderCode: string }> {
    const { students, quantity, orderCode: inputCode } = body;
    if (inputCode) {
      const existingOrder = await OrderModel.findOneBy(
        "code",
        inputCode,
        connection,
      );
      if (!existingOrder) throw new ValidationError("Encomenda não encontrada");
      await OrderModel.update(
        existingOrder.id,
        {
          quantity: students.length,
          amount_due: calculated.realValue,
          discount_promotion: calculated.discountPromo,
          discount_coupon: calculated.discountCoupon,
          discount_card: calculated.discountCard,
          discount_total:
            calculated.discountCoupon +
            calculated.discountPromo +
            calculated.discountCard,
          coupon_id: body.couponId ?? null,
          subtotal: calculated.subtotal,
          amount_paid: calculated.totalPay,
          card_id: card.id,
          card_percentage: card.percentage,
          card_name: card.name,
        },
        connection,
      );
      await OrderCustomerModel.deleteAllBy(
        "order_id",
        existingOrder.id,
        connection,
      );
      await OrderCustomerModel.createMany(
        existingOrder.id,
        students,
        connection,
      );
      return { orderId: existingOrder.id, orderCode: existingOrder.code };
    }
    const orderCode = generateCode("ORD", 12, true);
    const order = (await OrderModel.create(
      {
        code: orderCode,
        quantity: students.length,
        amount_due: calculated.realValue,
        discount_promotion: calculated.discountPromo,
        discount_coupon: calculated.discountCoupon,
        discount_card: calculated.discountCard,
        discount_total:
          calculated.discountCoupon +
          calculated.discountPromo +
          calculated.discountCard,
        coupon_id: body.couponId ?? null,
        course_id: body.courseId,
        subtotal: calculated.subtotal,
        amount_paid: calculated.totalPay,
        card_id: card.id,
        card_percentage: card.percentage,
        card_name: card.name,
      },
      connection,
    )) as Order;
    await OrderCustomerModel.createMany(order.id, students, connection);
    return { orderId: order.id, orderCode };
  }

  static async processPayment(
    checkout: CheckoutBody,
    calculated: CalculatorOut,
    orderId: number,
    connection: any,
  ): Promise<Payment> {
    try {
      const code = generateCode("PAY", 12, true);
      await PaymentModel.create(
        {
          code,
          order_id: orderId,
          response: {},
          amount: calculated.totalPay,
          status: "pending",
          is_payed: false,
          expired_at: nowTo(),
          phone: checkout.phone,
          payment_type: checkout.paymentType,
          // Identificador de quem pagou (pesquisável na listagem): no express é o
          // telefone; no ref é preenchido depois com a referência (saveReference).
          reference:
            checkout.paymentType === "express" ? checkout.phone : null,
        },
        connection,
      );

      return {
        code,
      };
    } catch (error) {
      // Log técnico com contexto
      AppLogger.error("CheckoutService[processPayment][error] " + error);

      // Reemite o erro para manter a pilha (stack trace)
      throw error;
    }
  }

  static async requestPaymentToProcessor(
    checkout: CheckoutBody,
    calculated: CalculatorOut,
    orderId: number,
    code: string,
  ): Promise<{
    qr?: string;
    reference?: { entity: string; referenceNumber: string; dueDate: string };
  }> {
    try {
      const { paymentType, phone } = checkout;

      const common = {
        amount: calculated.totalPay,
        merchantTransactionId: code,
        description: code,
      };

      switch (paymentType) {
        case "express": {
          const response = await AppyPayClient.chargeExpress({
            ...common,
            paymentMethod: PaymentMethod.aexpress,
            paymentInfo: { phoneNumber: phone },
          } as CreateChargeInput);
          if (response?.responseStatus && !response.responseStatus.successful) {
            const result = AppyPayWebHookMessage(response);
            throw new ValidationError(
              result.message,
              422,
              result.retryable ? "warning" : "danger",
            );
          }
          return {};
        }
        case "qr": {
          const response = await AppyPayClient.chargeQr({
            ...common,
            paymentMethod: PaymentMethod.qr,
            qrCodeType: "SINGLE",
          } as QrCharge);

          if (!response?.responseStatus?.successful)
            throw new ValidationError(
              "Erro ao gerar o QR Code, tente novamente",
              422,
              "danger",
            );

          return { qr: response.qrCodeArr };
        }
        case "ref": {
          const config = (await configCache.get()) as Config;
          const minutes = Number(config?.reference_expiration_minutes) || 1440;
          const fallbackDueDate = dayjs().add(minutes, "minute").toISOString();

          // Modo "gerada pelo portal": NÃO enviamos paymentInfo. A AppyPay gera a
          // referência dentro do range válido da entidade e devolve-a em
          // response.reference. Evita o erro 800 "reference number length differs"
          // que ocorria quando gerávamos a referência nós próprios.
          const response = await AppyPayClient.chargeRef({
            ...common,
            paymentMethod: PaymentMethod.ref,
          } as CreateChargeInput);

          // Numa cobrança por referência, code 101/102 (pendente) é o estado normal:
          // a referência foi criada e aguarda o pagamento do cliente. Logo, o
          // sucesso afere-se pela presença da referência, não pelo successful.
          const ref = response?.reference;
          if (!ref?.referenceNumber) {
            const result = response?.responseStatus
              ? AppyPayWebHookMessage(response)
              : {
                  message:
                    "Não foi possível gerar a referência. Tente novamente.",
                  retryable: true,
                };
            throw new ValidationError(
              result.message,
              422,
              result.retryable ? "warning" : "danger",
            );
          }

          return {
            reference: {
              // A entidade é parametrizável: o valor do config sobrepõe o devolvido pela AppyPay.
              entity: config.reference_entity || ref.entity || "",
              referenceNumber: ref.referenceNumber,
              // `||` (não `??`) para também cair no fallback se vier string vazia.
              dueDate: ref.dueDate || fallbackDueDate,
            },
          };
        }

        default:
          throw new ValidationError(
            "Tipo de pagamento inválido",
            400,
            "warning",
          );
      }
    } catch (error: any) {
      // AppyPayError (lib) expõe .original/.httpStatusCode; axios cru expõe .response.data/.status
      const appyPayBody = error?.original ?? error?.response?.data;
      AppLogger.error(
        "CheckoutService[requestPaymentToProcessor][error] " +
          (error?.message ?? error) +
          (appyPayBody
            ? " | AppyPay response: " + JSON.stringify(appyPayBody)
            : ""),
      );
      throw error;
    }
  }
  // Fazer cache!
  static async getCourseData(body: CheckoutBody) {
    const course = (await CourseModel.findOneBy("id", body.courseId)) as Course;

    if (!course) throw new ValidationError("Curso não encontrado");
    return {
      id: body.courseId,
      price: course.price,
      type: course.thinkific_type,
    };
  }
  static async getPromotionData(body: CheckoutBody) {
    const config = (await configCache.get()) as Config;
    if (!config) throw new ValidationError("Parametrizações não encontrada");
    if (!config.promotion_active) {
      return { promotion_quantity: 0, promotion_quantity_max: 0 };
    }
    return {
      promotion_quantity: config.promotion_quantity,
      promotion_quantity_max: config.promotion_quantity_max,
    };
  }
  static async getCouponData(body: CheckoutBody) {
    if (body.couponId == null)
      return {
        amount: 0,
        percentage: 0,
      };
    const coupon = (await CouponModel.findOneBy(
      "id",
      body.couponId,
    )) as ICoupon;
    if (!coupon) throw new ValidationError("Parametrizações não encontrada");
    if (new Date(coupon.expire_at).getTime() < Date.now()) {
      throw new ValidationError("Cupom expirado.");
    }
    if (coupon.active == 0) {
      throw new ValidationError("Cupom desactivado.");
    }
    return {
      amount: coupon.amount,
      percentage: coupon.percentage,
    };
  }

  static async getCardData(body: CheckoutBody) {
    console.log("getCardData" + body.cardId);
    if (body.cardId == null)
      return {
        id: null,
        name: null,
        percentage: 0,
      };
    const card = await this.getCard(String(body.cardId));
    console.log(card);
    return {
      id: card.id,
      name: card.name,
      percentage: 15,
    };
  }

  static async assertPaymentMethodEnabled(paymentType: PaymentType) {
    const config = (await configCache.get()) as Config;
    if (!config) return;
    const map: Record<string, any> = {
      express: config.express_enabled,
      qr: config.qr_enabled,
      ref: config.ref_enabled,
    };
    const value = map[paymentType];
    if (value === 0 || value === false) {
      throw new ValidationError(
        "Método de pagamento indisponível de momento.",
        422,
        "warning",
      );
    }
  }

  static async done(body: CheckoutBody) {
    await this.assertPaymentMethodEnabled(body.paymentType);
    const course = await this.getCourseData(body);
    const promotion = await this.getPromotionData(body);
    const coupon = await this.getCouponData(body);
    const card = await this.getCardData(body);
    const calc = CheckoutCalculator.calculate({
      quantity: body.quantity,
      price: Number(course.price),
      promotion_quantity: promotion.promotion_quantity,
      promotion_quantity_max: promotion.promotion_quantity_max,
      coupon: {
        amount: coupon.amount,
        percentage: coupon.percentage,
      },
      card,
    }) as CalculatorOut;
    this.validateStudents(body.students, calc.expectedStudents);
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
      const { orderId, orderCode } = await this.processOrder(
        body,
        calc,
        connection,
        card,
      );
      const { code } = await this.processPayment(
        body,
        calc,
        orderId,
        connection,
      );
      await connection.commit();
      try {
        const processor = await this.requestPaymentToProcessor(
          body,
          calc,
          orderId,
          code,
        );
        if (processor.reference) {
          const expiredAt = dayjs(processor.reference.dueDate).format(
            "YYYY-MM-DD HH:mm:ss",
          );
          await PaymentModel.saveReference(
            code,
            { reference: processor.reference },
            expiredAt,
          );
        }
        return {
          orderCode: orderCode,
          paymentCode: code,
          qr: processor.qr ?? "",
          reference: processor.reference,
        };
      } catch (processorErr) {
        await PaymentModel.updateStatus(code, "failed", undefined, undefined);
        throw processorErr;
      }
    } catch (err) {
      await connection.rollback();
      AppLogger.error("CheckoutService[done][error] " + err);
      throw err;
    } finally {
      connection.release();
    }
  }

  static validateStudents(students: Student[], expected: number) {
    if (!Array.isArray(students) || students.length === 0) {
      throw new Error("Nenhum estudante informado.");
    }
    if (students.length !== expected) {
      throw new Error(
        `Número de estudantes inválido. Esperado ${expected}, recebido ${students.length}.`,
      );
    }
  }

  static async getCoupon(code: string) {
    let coupon = await CouponModel.findOneBy("code", code);
    if (coupon == null) throw new ValidationError("Cupom inválido");

    if (new Date(coupon.expire_at).getTime() < Date.now()) {
      throw new ValidationError("Cupom expirado");
    }
    if (coupon.active == 0) {
      throw new ValidationError("Cupom desactivado");
    }
    return {
      id: coupon.id,
      code: coupon.code,
      amount: Number(coupon.amount),
      percentage: Number(coupon.percentage),
    };
  }

  static async getCard(code: string) {
    try {
      const student = await CeuClient.validateStudent(code);
      return {
        code: code,
        name: student.data.name,
        id: student.data.id,
        percentage: 15,
      };
    } catch (e) {
      console.log(e.toString());
      throw new ValidationError("Cartão inválido");
    }
  }
  static async getCart(code: string) {
    try {
      const order = await OrderModel.findOneBy("code", code);
      if (!order) throw new ValidationError("Encomenda inválida");
      if (order.status == "completed")
        throw new ValidationError("Encomenda já concluída");
      order.course = await OrderModel.course(order);
      order.customers = await OrderModel.customers(order);
      order.coupon = await OrderModel.coupon(order);
      return order;
    } catch (e) {
      console.log(e.toString());
      throw new ValidationError("Encomenda invalida");
    }
  }
  static async print(orderCode: string, paymentCode: string) {
    const connection = await db.getConnection();

    try {
      const order = (await OrderModel.findOneBy(
        "code",
        orderCode,
        connection,
      )) as Order;
      if (!order) throw new ValidationError("Encomenda não encontrada");

      const payment = await PaymentModel.findOneBy(
        "code",
        paymentCode,
        connection,
      );
      if (!payment) throw new ValidationError("Pagamento não encontrado");

      const students = await OrderCustomerModel.findAllBy(
        "order_id",
        order.id,
        connection,
      );
      const course = (await CourseModel.findOneBy(
        "id",
        order.course_id,
        connection,
      )) as Course;
      const coupon = order.coupon_id
        ? await CouponModel.findOneBy("id", order.coupon_id, connection)
        : null;

      return {
        order: {
          code: order.code,
          created_at: formatDate(order.pending_at),
          paid_at: formatDate(payment.paid_at),
          payment: {
            code: payment.code,
          },
          course: {
            name: course.name,
            price: toMoney(course.price),
          },
          client: students.length
            ? { name: students[0].name, phone: students[0].phone }
            : null,
          students,
          discounts: [
            {
              name: "Promoção",
              amount: toMoney(order.discount_promotion || 0),
            },
            { name: "Cupom", amount: toMoney(order.discount_coupon || 0) },
            { name: "Cartão CEU", amount: toMoney(order.discount_card || 0) },
          ],
          subtotal: toMoney(order.amount_due),
          discount: toMoney(order.discount_total),
          total: toMoney(order.amount_paid),
        },
        printed_at: formatDate(Date()),
        coupon,
      };
    } finally {
      connection.release();
    }
  }
}
