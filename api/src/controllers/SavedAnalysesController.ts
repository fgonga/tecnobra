import type { FastifyRequest, FastifyReply } from 'fastify'
import { SavedAnalysesModel } from '../models/saved_analyses.model'
import { handleControllerError } from '../exceptions/handleControllerError'

export class SavedAnalysesController {
  static async index(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (req as any).user.sub
      const analyses = await SavedAnalysesModel.findByUser(userId)
      return reply.code(200).send(analyses)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  static async store(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.sub
      const { name, periods_config, report_snapshots, ai_analysis } = req.body

      if (!periods_config || !report_snapshots) {
        return reply.code(400).send({ message: 'periods_config e report_snapshots são obrigatórios.' })
      }

      const saved = await SavedAnalysesModel.genericCreate({
        user_id: userId,
        name: name || 'Análise',
        periods_config: JSON.stringify(periods_config),
        report_snapshots: JSON.stringify(report_snapshots),
        ai_analysis: ai_analysis || null,
      })

      const row = await SavedAnalysesModel.findByIdAndUser(saved.id, userId)
      return reply.code(201).send(row)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  static async show(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.sub
      const analysis = await SavedAnalysesModel.findByIdAndUser(Number(req.params.id), userId)
      if (!analysis) return reply.code(404).send({ message: 'Análise não encontrada.' })
      return reply.code(200).send(analysis)
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  static async destroy(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (req as any).user.sub
      const analysis = await SavedAnalysesModel.findByIdAndUser(Number(req.params.id), userId)
      if (!analysis) return reply.code(404).send({ message: 'Análise não encontrada.' })
      await SavedAnalysesModel.deleteByIdAndUser(Number(req.params.id), userId)
      return reply.code(200).send({ message: 'Análise eliminada.' })
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }
}
