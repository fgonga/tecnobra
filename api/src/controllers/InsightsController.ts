import type { FastifyRequest, FastifyReply } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { handleControllerError } from '../exceptions/handleControllerError'
import { config } from '../config/env'

const client = new Anthropic({ apiKey: config.anthropic.apiKey })

function buildDataContext(body: any): string {
  const { summary, dayReport, monthReport, courseReport, influencerReport, refundsByStatus, period } = body
  return JSON.stringify({
    periodo: period,
    resumo: summary,
    refunds_por_status: refundsByStatus,
    top_dias: dayReport?.report?.slice(-7) ?? [],
    total_diario: dayReport?.total ?? null,
    meses: monthReport?.report ?? [],
    total_mensal: monthReport?.total ?? null,
    top_cursos: courseReport?.report?.slice(0, 5) ?? [],
    top_influenciadores: influencerReport?.report?.slice(0, 5) ?? [],
  }, null, 2)
}

const SYSTEM_ANALYST = `És um analista financeiro sénior da Academia Treesix, em Angola.
Respondes sempre em Português de Angola. Não uses markdown. Usa valores concretos (Kz, %, nº de pedidos) sempre que possível.`

export class InsightsController {
  // ── Resumo executivo (1-shot) ──────────────────────────────────────
  static async generate(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const dataContext = buildDataContext(req.body)

      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 400,
        system: SYSTEM_ANALYST,
        messages: [
          {
            role: 'user',
            content: `Analisa os dados de vendas abaixo e gera um resumo executivo conciso (máximo 4 frases) para o gestor de topo.

Foca-te em:
1. Performance geral do período (crescimento ou queda)
2. Anomalias ou alertas (devoluções elevadas, cursos com baixo desempenho, influenciadores com resultado negativo)
3. Uma recomendação accionável

Não uses markdown, apenas texto corrido.

Dados:
${dataContext}`,
          },
        ],
      })

      const insight = (message.content[0] as any).text ?? ''
      return reply.code(200).send({ insight })
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  // ── 4 Cards de insights automáticos ───────────────────────────────
  static async cards(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const dataContext = buildDataContext(req.body)

      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system: SYSTEM_ANALYST,
        messages: [
          {
            role: 'user',
            content: `Com base nos dados abaixo, gera exactamente 4 análises focadas. Responde APENAS com JSON válido, sem texto adicional, sem markdown, sem blocos de código.

Formato obrigatório:
{"geral":"...","devoluções":"...","cursos":"...","influenciadores":"..."}

Instruções por campo (máximo 3 frases cada, texto corrido, sem markdown):
- geral: Performance geral do período — receita, crescimento, pedidos
- devoluções: Estado das devoluções — pendentes, aprovadas, rejeitadas, riscos
- cursos: Top cursos e cursos com baixa performance ou alto abandono
- influenciadores: Top influenciadores e comissões, alertas de resultado negativo

Dados:
${dataContext}`,
          },
        ],
      })

      const raw = (message.content[0] as any).text ?? '{}'
      let cards: Record<string, string> = {}
      try {
        cards = JSON.parse(raw)
      } catch {
        try {
          const match = raw.match(/\{[\s\S]*\}/)
          if (match) cards = JSON.parse(match[0])
        } catch {
          cards = {}
        }
      }

      return reply.code(200).send({ cards })
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  // ── Análise comparativa de múltiplos períodos ─────────────────────
  static async compare(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const { periods } = req.body as { periods: Array<{ period: { start: string; end: string; name?: string }; data: any }> }

      if (!Array.isArray(periods) || periods.length < 2) {
        return reply.code(400).send({ message: 'São necessários pelo menos 2 períodos para comparar.' })
      }

      const context = periods.map((p, i) => ({
        nome: p.period.name || `Período ${String.fromCharCode(65 + i)}`,
        periodo: p.period,
        resumo: p.data?.summary,
        refunds_por_status: p.data?.refundsByStatus,
        top_dias: p.data?.dayReport?.report?.slice(-7) ?? [],
        total_diario: p.data?.dayReport?.total ?? null,
        meses: p.data?.monthReport?.report ?? [],
        top_cursos: p.data?.courseReport?.report?.slice(0, 5) ?? [],
        top_influenciadores: p.data?.influencerReport?.report?.slice(0, 5) ?? [],
      }))

      const periodNames = context.map(c => c.nome).join(', ')

      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 800,
        system: SYSTEM_ANALYST,
        messages: [
          {
            role: 'user',
            content: `Analisa e compara os seguintes ${periods.length} períodos de negócio: ${periodNames}.

Para cada par de períodos adjacentes, identifica:
1. O que cresceu e o que caiu (receita, vendas, devoluções)
2. Anomalias ou alertas relevantes
3. Tendências observadas ao longo dos períodos
4. Uma recomendação accionável baseada na evolução

Não uses markdown, apenas texto corrido. Sê conciso e directo (máximo 6 frases).

Dados dos períodos:
${JSON.stringify(context, null, 2)}`,
          },
        ],
      })

      const analysis = (message.content[0] as any).text ?? ''
      return reply.code(200).send({ analysis })
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }

  // ── Chat multi-turn com contexto dos dados ─────────────────────────
  static async chat(req: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
    try {
      const { messages, ...reportData } = req.body
      const dataContext = buildDataContext(reportData)

      if (!Array.isArray(messages) || messages.length === 0) {
        return reply.code(400).send({ message: 'messages é obrigatório' })
      }

      // Sanitizar e validar mensagens antes de enviar para a API
      const validRoles = new Set(["user", "assistant"]);
      const sanitized = messages
        .slice(-40)
        .filter((m: any) => validRoles.has(m?.role) && typeof m?.content === "string" && m.content.trim().length > 0)
        .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 4000) }));

      // Garantir alternância correcta de roles (remover mensagens consecutivas do mesmo role)
      const deduped: { role: "user" | "assistant"; content: string }[] = [];
      for (const msg of sanitized) {
        if (deduped.length === 0 || deduped[deduped.length - 1].role !== msg.role) {
          deduped.push(msg);
        } else {
          deduped[deduped.length - 1] = msg; // manter a última mensagem do mesmo role
        }
      }

      // A última mensagem deve ser do utilizador
      if (deduped.length === 0 || deduped[deduped.length - 1].role !== "user") {
        return reply.code(400).send({ message: "A última mensagem deve ser do utilizador." });
      }

      const response = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        system: `${SYSTEM_ANALYST}

Tens acesso aos seguintes dados do período seleccionado pelo gestor:
${dataContext}

Responde de forma directa e útil. Usa valores concretos dos dados. Não uses markdown.`,
        messages: deduped,
      })

      const reply_text = (response.content[0] as any).text ?? ''
      return reply.code(200).send({ message: reply_text })
    } catch (err: any) {
      handleControllerError(reply, err)
    }
  }
}
