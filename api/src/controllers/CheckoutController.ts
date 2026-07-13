import type { FastifyReply, FastifyRequest } from "fastify";
import { handleCheckoutError } from "../exceptions/handleCheckoutError";

import { PaymentModel } from "../models/payment.model";
import {CheckoutService} from "../services/CheckoutService";
import {CoursesService} from "../services/CoursesService";
import {handleControllerError} from "../exceptions/handleControllerError";
import {ConfigController} from "./ConfigController";
import {configCache} from "../services/ConfigCache";
import {CouponsService} from "../services/CouponsService";
import {CouponModel} from "../models/coupon.model";
import {ValidationError} from "../exceptions/ValidationError";
import AppyPayWebHookMessage from "../utils/AppyPayMessage";

type PaymentType = "qr" | "express" | "ref";
type Student = { name: string; email: string; phone: string };
type CheckoutBody = {
  students: Student[];
  quantity: number;
  paymentType: PaymentType;
  phone?: string | null;
};

export class CheckoutController {
  static async done(req: FastifyRequest<{ Body: CheckoutBody }>, reply: FastifyReply) {
    try {
      const result = await CheckoutService.done(req.body);
      return reply.code(200).send(result);
    } catch (err) {
      handleControllerError(reply, err);
    }
  }

  static async configurations(req: FastifyRequest, reply: FastifyReply) {
    try {
      const rawCourse = req.query?.course;
      const courseSlug = rawCourse ? String(rawCourse) : null;
      const course = await CoursesService.findDefault(courseSlug)
      const config = await configCache.get();
      // Devolve apenas o que o checkout precisa — campos de back-office
      // (taxas, dias de liquidação, payout mínimo, etc.) ficam de fora.
      const configurations = {
        promotion_active: config.promotion_active,
        promotion_quantity: config.promotion_quantity,
        promotion_quantity_max: config.promotion_quantity_max,
        default_payment_method: config.default_payment_method,
        express_enabled: config.express_enabled,
        ref_enabled: config.ref_enabled,
        qr_enabled: config.qr_enabled,
        reference_expiration_minutes: config.reference_expiration_minutes,
        reference_entity: config.reference_entity,
        course: {
          course_card_image_url: course.course_card_image_url,
          description: course.description,
          name: course.name,
          slug: course.slug,
          price: course.price,
          levels: course.levels,
          id: course.id
        }
      };

      return reply.code(200).send(configurations);
    } catch (err) {
      return handleControllerError(reply, err);
    }
  }
  static async checkPayment(req: FastifyRequest, reply: FastifyReply) {
    const paymentId = (req.query as any)?.paymentId;
    if (!paymentId) return reply.code(400).send({ message: "paymentId é obrigatório" });

    const payment = await PaymentModel.findOneByCode(paymentId);
    if (!payment?.length) return reply.code(404).send({ message: "Pagamento não encontrado" });

    const record = payment[0];
    const status = record.status || "pending";
    let parsed = null;
    if (status !== "pending") {
      try {
        const raw = typeof record.response === "string" ? JSON.parse(record.response) : record.response;
        parsed = raw?.responseStatus ? AppyPayWebHookMessage(raw) : null;
      } catch { /* resposta inválida — usa fallback */ }
    }
    const response = {
      status,
      message:   parsed?.message   ?? (status === "pending" ? "Aguardando confirmação de pagamento." : "Falha no pagamento. Tente novamente."),
      retryable: parsed?.retryable ?? (status !== "paid"),
    };

    return reply.code(200).send(response);
  }


  static async coupon(req: FastifyRequest, reply: FastifyReply) {
    try {
      if (req.query && (req.query as any).code){
        return reply.code(200).send( await CheckoutService.getCoupon(req.query.code));
      }
      ValidationError("Código de cupom é obrigatório");
    } catch (err) {
      return handleControllerError(reply, err);
    }
  }
  static async card(req: FastifyRequest, reply: FastifyReply) {
    try {
      if (req.query && (req.query as any).code){
        return reply.code(200).send( await CheckoutService.getCard(req.query.code));
      }
      ValidationError("Código do cartão é obrigatório");
    } catch (err) {
      return handleControllerError(reply, err);
    }
  }
  static async cart(req: FastifyRequest, reply: FastifyReply) {
    try {
      if (req.query && (req.query as any).code){
        return reply.code(200).send( await CheckoutService.getCart(req.query.code));
      }
      ValidationError("Código da encomenda é obrigatório");
    } catch (err) {
      return handleControllerError(reply, err);
    }
  }
  static async print(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { orderCode, paymentCode } = req.query as any;

      if (!orderCode || !paymentCode) {
        throw new ValidationError("Dados inválidos");
      }

      const result = await CheckoutService.print(orderCode, paymentCode);
      return reply.code(200).send(result);

    } catch (err) {
      return handleControllerError(reply, err);
    }
  }

}
