import type { FastifyReply, FastifyRequest } from "fastify";
import { successQueue, failedQueue } from "../queues";
import type { PaymentWebHook } from "@bit/appypayts/src/types";
import {WebHookLogger} from "../logger/WebHookLogger";

export class WebHookController {
  static async handle(
      req: FastifyRequest<{ Body: PaymentWebHook }>,
      reply: FastifyReply
  ) {
    const body = req.body;
    const rs = body.responseStatus;
    if (rs.code === 100) {
      // Pagamento efetivamente confirmado/pago.
      await successQueue.add("success-payment", body, {
        priority: 1,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      });
    } else if (rs.successful === false || rs.status === "Failed") {
      // Falha real (recusado, expirado, número inválido, etc.).
      await failedQueue.add("failed-payment", body);
    } else {
      // Estado INTERMÉDIO — ex.: referência criada (code 101 "aceite para
      // processamento") ou a aguardar autorização (102). NÃO é falha: o
      // pagamento continua PENDENTE até chegar a confirmação (code 100) ou
      // uma falha real. Marcar como falhado aqui era o bug.
      WebHookLogger.info("WebHookController[handle][intermédio-ignorado] " + JSON.stringify(body));
    }
    console.log(body)
    WebHookLogger.info(
        "WebHookController[handle] " + JSON.stringify(body)
    );

    return reply.code(200).send({ ok: true });
  }
}
