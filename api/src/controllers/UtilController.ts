import { UsersService } from "../services/UsersService";
import { config } from "../config/env";
import { BaseCrudController } from "./BaseCrudController";
import {PaymentService} from "../services/PaymentService";
import {PaymentWebHook} from "@bit/appypayts/src/types";
import type { FastifyReply, FastifyRequest } from "fastify";
import {failedQueue, successQueue} from "../queues/index";
export class UtilController extends BaseCrudController<UsersService> {
  constructor() {
    super(new UsersService());
  }
  static async devAprovePayment(req: FastifyRequest<{ Body: any }>, reply: FastifyReply)  {
    if (!config.isDev) return false;
    const data = {
      id: "ac691b8d-1f6c-4298-85b2-8c4dd490f306",
      merchantTransactionId:  req.body.paymentCode,
      amount: 60000,
      options: null,
      directDebit: null,
      reference: null,
      eletronicReceipt: null,
      responseStatus: {
        successful: true,
        status: "Success",
        code: 100,
        message: "Obrigado! O seu pagamento foi registado com Sucesso.",
        source: "GPO",
        sourceDetails: {
          attempt: 1,
          type: "NONE",
          code: "NONE",
          message: "OK"
        }
      }
    }
    await successQueue.add("success-payment", data, {
        priority: 1,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      });
    return true;
  }
  static async devRecusePayment(req: FastifyRequest<{ Body: any }>, reply: FastifyReply)  {
    if (!config.isDev) return false;
    const data = {
      id: "a3e338ec-b79a-441b-b45f-f686010d0f50",
      merchantTransactionId: req.body.paymentCode,
      amount: 60000,
      options: null,
      directDebit: null,
      reference: null,
      eletronicReceipt: null,
      responseStatus: {
        successful: false,
        status: "Failed",
        code: 211,
        message: "O prazo de pagamento expirou. Deverá autorizar o seu pagamento num prazo máximo de 90 segundos. Por favor, tente novamente. ",
        source: "GPO",
        sourceDetails: {
          attempt: 1,
          type: "EPMS_PROCESSOR",
          code: "EXT_AUT_SY_907",
          message: "Recusado pelo processador. Podera ser TIMEOUT. Necessário contactar a área de suporte."
        }
      }
    }
     await failedQueue.add("failed-payment", data);
    return true;
  }

}
