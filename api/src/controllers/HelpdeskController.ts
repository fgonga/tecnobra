import type { FastifyRequest, FastifyReply } from 'fastify'
import { HelpdeskService } from '../services/HelpdeskService'
import { handleControllerError } from '../exceptions/handleControllerError'

export class HelpdeskController {
    static sendDayResume = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { date, phone } = req.body as { date?: string; phone?: string }
            const result = await HelpdeskService.sendDayResume(date, phone)
            reply.code(200).send({ success: true, preview: result.message })
        } catch (err: any) {
            handleControllerError(reply, err)
        }
    }

    static reconcilePayments = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { start, end } = req.body as { start?: string; end?: string }
            if (!start || !end) {
                return reply.code(422).send({ message: 'Informe start e end.' })
            }
            const result = await HelpdeskService.reconcilePayments(start, end)
            reply.code(200).send(result)
        } catch (err: any) {
            handleControllerError(reply, err)
        }
    }

    static applyReconciliation = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { codes } = req.body as { codes?: string[] }
            if (!Array.isArray(codes) || codes.length === 0) {
                return reply.code(422).send({ message: 'Informe codes (array não vazio).' })
            }
            const approvedBy = (req as any).user?.email || (req as any).user?.username || 'reconciliacao'
            const result = await HelpdeskService.applyReconciliation(codes, approvedBy)
            reply.code(200).send(result)
        } catch (err: any) {
            handleControllerError(reply, err)
        }
    }
}
