import { FastifyRequest, FastifyReply } from "fastify";
import { handleControllerError } from "../exceptions/handleControllerError";
import { RecoveryService } from "../services/RecoveryService";

export class RecoveryController {
    static async stats(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { start, end } = req.query as any;
            return reply.code(200).send(await RecoveryService.stats(start, end));
        } catch (err) { handleControllerError(reply, err); }
    }

    static async orders(req: FastifyRequest, reply: FastifyReply) {
        try {
            return reply.code(200).send(await RecoveryService.recoverableOrders(req.query as any));
        } catch (err) { handleControllerError(reply, err); }
    }

    static async send(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { orderIds, message } = req.body as any;
            if (!Array.isArray(orderIds) || !orderIds.length) {
                return reply.code(400).send({ message: "orderIds é obrigatório." });
            }
            if (!message?.trim()) {
                return reply.code(400).send({ message: "message é obrigatório." });
            }
            return reply.code(200).send(await RecoveryService.sendRecovery(orderIds, message));
        } catch (err) { handleControllerError(reply, err); }
    }
}
