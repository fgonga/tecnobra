import { ReportService } from './ReportService'
import { PaymentService } from './PaymentService'
import { db } from '../db/db'
import dayjs from 'dayjs'
import axios from 'axios'
import toMoney from '../utils/money'
import { config } from '../config/env'
import { ValidationError } from '../exceptions/ValidationError'
import { AppyPayClient } from '@bit/appypayts'
import type { ChargeListItem, PaymentWebHook } from '@bit/appypayts'

async function getAbandonedRecovery(date: string) {
    const [notifiedRows]: any = await db.execute(
        `SELECT COUNT(*) AS total FROM orders WHERE DATE(abandoned_notified_at) = ?`,
        [date]
    )
    const [recoveredRows]: any = await db.execute(
        `SELECT COUNT(*) AS total, COALESCE(SUM(subtotal), 0) AS value
         FROM orders
         WHERE abandoned_notified_at IS NOT NULL
           AND status = 'completed'
           AND DATE(completed_at) = ?`,
        [date]
    )
    const notified  = Number(notifiedRows[0]?.total ?? 0)
    const recovered = Number(recoveredRows[0]?.total ?? 0)
    const value     = Number(recoveredRows[0]?.value ?? 0)
    const rate      = notified > 0 ? Math.round((recovered / notified) * 100) : 0
    return { notified, recovered, value, rate }
}

async function getPaymentRecovery(date: string) {
    const [cols]: any = await db.execute(
        `SELECT COUNT(*) AS exists_col
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'payments'
           AND COLUMN_NAME = 'recovery_notified_at'`
    )
    if (!Number(cols[0]?.exists_col)) return { notified: 0, recovered: 0, value: 0, rate: 0 }

    const [notifiedRows]: any = await db.execute(
        `SELECT COUNT(*) AS total FROM payments WHERE DATE(recovery_notified_at) = ?`,
        [date]
    )
    const [recoveredRows]: any = await db.execute(
        `SELECT COUNT(*) AS total, COALESCE(SUM(o.subtotal), 0) AS value
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         WHERE DATE(p.recovery_notified_at) = ?
           AND o.status = 'completed'`,
        [date]
    )
    const notified  = Number(notifiedRows[0]?.total ?? 0)
    const recovered = Number(recoveredRows[0]?.total ?? 0)
    const value     = Number(recoveredRows[0]?.value ?? 0)
    const rate      = notified > 0 ? Math.round((recovered / notified) * 100) : 0
    return { notified, recovered, value, rate }
}

export class HelpdeskService {
    static async sendDayResume(dateStr?: string, phone?: string): Promise<{ message: string }> {
        const reportDate = dateStr ? dayjs(dateStr) : dayjs()
        const date       = reportDate.format('YYYY-MM-DD')

        const report = await ReportService.report({
            type: 'custom',
            includes: ['paymentsStatus', 'ordersStatus', 'paymentsMoney', 'courses', 'resume'],
            start: date,
            end:   date,
        })

        const t       = report?.resume?.total ?? {}
        const orders  = report?.ordersStatus  ?? {}
        const courses = report?.courses        ?? []

        const sales          = Number(t.sales           ?? 0)
        const gross          = Number(t.gross           ?? 0)
        const discounts      = Number(t.discounts       ?? 0)
        const refundsCount   = Number(t.refunds_count   ?? 0)
        const refundsAmount  = Number(t.refunds_amount  ?? 0)
        const resultIliquido = Number(t.result_iliquido ?? 0)
        const fees           = Number(t.fees            ?? 0)
        const result         = Number(t.result          ?? 0)
        const commissions    = Number(t.commissions     ?? 0)
        const resultFinal    = Number(t.result_final    ?? 0)

        const abandoned  = await getAbandonedRecovery(date)
        const paymentRec = await getPaymentRecovery(date)

        const recoveryNotified  = abandoned.notified  + paymentRec.notified
        const recoveryRecovered = abandoned.recovered + paymentRec.recovered
        const recoveryValue     = abandoned.value     + paymentRec.value
        const recoveryRate      = recoveryNotified > 0
            ? Math.round((recoveryRecovered / recoveryNotified) * 100)
            : 0

        const kz = (v: number) => `${toMoney(v)} Kz`

        const message = `Resumo Diário
${reportDate.format('DD/MM/YYYY')}
RESUMO
  Nº Vendas: ${sales}
  Bruto: ${kz(gross)}
  Descontos: ${kz(discounts)}
  Devoluções (${refundsCount}): ${kz(refundsAmount)}
  Ilíquido: ${kz(resultIliquido)}
  Encargos: ${kz(fees)}
  Líquido: ${kz(result)}
  Comissões: ${kz(commissions)}
  Líquido Final: ${kz(resultFinal)}

ENCOMENDAS
  Concluído: ${orders.completed ?? 0}
  Cancelado: ${orders.canceled  ?? 0}
  Pendente: ${orders.pending    ?? 0}

RECUPERAÇÃO
  Msg enviadas: ${recoveryNotified}
  Recuperadas: ${recoveryRecovered}
  Taxa: ${recoveryRate}%
  Recuperado: ${kz(recoveryValue)}

CURSOS
${courses.map((c: any, i: number) =>
    `${i + 1}) ${c.name} — ${c.qtd} Un — ${kz(c.total)}`
).join('\n') || 'Sem vendas'}
`

        const destination = phone || config.whatsapp.phone
        const url = `${config.whatsapp.apiUrl}/send/message`
        try {
            await axios.post(
                url,
                { phone: destination, message },
                {
                    headers: { 'X-Device-Id': config.whatsapp.deviceId },
                    auth: config.whatsapp.user
                        ? { username: config.whatsapp.user, password: config.whatsapp.password }
                        : undefined,
                    timeout: 10_000,
                }
            )
        } catch (err: any) {
            const status = err?.response?.status
            const data   = err?.response?.data
            console.error(`[Whatsapp] POST ${url} falhou`, {
                status,
                body: typeof data === 'string' ? data : JSON.stringify(data),
                message: err?.message,
            })
            const gatewayMsg =
                (typeof data === 'string' && data) ||
                data?.message || data?.error || data?.detail || err?.message || 'erro desconhecido'
            // Erro operacional → o modal "Enviar Resumo Diário" mostra a razão real
            // (ex.: número não está no WhatsApp) em vez de um 500 genérico.
            throw new ValidationError(
                `Falha ao enviar pelo WhatsApp${status ? ` (${status})` : ''}: ${gatewayMsg}`,
                422,
                'warning'
            )
        }

        return { message }
    }

    static async reconcilePayments(start: string, end: string): Promise<{
        items: Array<{
            payment_id: number
            code: string
            order_id: number | null
            customer_name: string | null
            amount: number
            payment_type: string | null
            db_status: string
            appy_status: string | null
            appy_id: string | null
            appy_amount: number | null
            appy_updated_at: string | null
            match: boolean
            divergence: 'match' | 'missing_in_appy' | 'status_mismatch' | 'amount_mismatch'
            recommended_action: 'apply_paid' | 'apply_failed' | 'reverse' | 'noop' | 'manual'
        }>
        summary: {
            total: number
            match: number
            status_mismatch: number
            missing_in_appy: number
            amount_mismatch: number
            db_paid_count: number
            db_paid_amount: number
            db_unpaid_count: number
            db_unpaid_amount: number
            appy_success_count: number
            appy_success_amount: number
            appy_unpaid_count: number
            appy_unpaid_amount: number
            apply_paid_count: number
            apply_paid_amount: number
            apply_failed_count: number
            apply_failed_amount: number
            reverse_count: number
            reverse_amount: number
        }
    }> {
        const startDay = dayjs(start).startOf('day')
        const endDay   = dayjs(end).endOf('day')
        if (!startDay.isValid() || !endDay.isValid()) {
            throw new Error('Datas inválidas.')
        }
        if (endDay.isBefore(startDay)) {
            throw new Error('Data final anterior à inicial.')
        }

        const [rows]: any = await db.execute(
            `SELECT p.id            AS payment_id,
                    p.code          AS code,
                    p.order_id      AS order_id,
                    p.amount        AS amount,
                    p.payment_type  AS payment_type,
                    p.status        AS db_status,
                    (SELECT oc.name FROM order_customers oc WHERE oc.order_id = p.order_id ORDER BY oc.id LIMIT 1) AS customer_name
             FROM payments p
             WHERE p.created_at BETWEEN ? AND ?
             ORDER BY p.created_at DESC`,
            [startDay.format('YYYY-MM-DD HH:mm:ss'), endDay.format('YYYY-MM-DD HH:mm:ss')]
        )

        const dbPayments = rows as Array<{
            payment_id: number
            code: string
            order_id: number | null
            amount: number
            payment_type: string | null
            db_status: string
            customer_name: string | null
        }>

        const dateFrom = startDay.format('YYYY-MM-DDTHH:mm:ss')
        const dateTo   = endDay.format('YYYY-MM-DDTHH:mm:ss')
        const appyMap  = new Map<string, ChargeListItem>()
        const limit    = 50
        let skip       = 0
        let safety     = 200

        while (safety-- > 0) {
            let res
            try {
                res = await AppyPayClient.analyticsCharges({ dateFrom, dateTo, limit, skip })
            } catch (err: any) {
                const body = err?.response?.data
                console.error('AppyPay analyticsCharges error', err?.response?.status, body ? JSON.stringify(body) : err?.message)
                throw new Error(`AppyPay erro ${err?.response?.status ?? ''}: ${body?.message ?? body?.error ?? err?.message ?? 'desconhecido'}`)
            }
            for (const c of res.payments || []) {
                if (c.merchantTransactionId) appyMap.set(c.merchantTransactionId, c)
            }
            if (!res.hasMorePages || (res.payments?.length ?? 0) < limit) break
            skip += limit
        }

        const dbToAppy: Record<string, string[]> = {
            pending: ['Pending', 'Requested'],
            paid:    ['Success'],
            failed:  ['Failed'],
        }

        const items = dbPayments.map((p) => {
            const charge = appyMap.get(p.code)
            const appyStatus = charge?.status ?? null

            let divergence: 'match' | 'missing_in_appy' | 'status_mismatch' | 'amount_mismatch' = 'match'
            if (!charge) {
                divergence = 'missing_in_appy'
            } else {
                const expected = dbToAppy[p.db_status] || []
                if (!expected.includes(String(appyStatus))) {
                    divergence = 'status_mismatch'
                } else if (Number(charge.amount) !== Number(p.amount)) {
                    divergence = 'amount_mismatch'
                }
            }

            let recommended_action: 'apply_paid' | 'apply_failed' | 'reverse' | 'noop' | 'manual' = 'noop'
            if (!charge) {
                recommended_action = 'manual'
            } else if (appyStatus === 'Success') {
                recommended_action = p.db_status === 'paid' ? 'noop' : 'apply_paid'
            } else if (appyStatus === 'Failed') {
                if (p.db_status === 'paid') recommended_action = 'reverse'
                else if (p.db_status === 'failed') recommended_action = 'noop'
                else recommended_action = 'apply_failed'
            }

            return {
                payment_id: p.payment_id,
                code: p.code,
                order_id: p.order_id,
                customer_name: p.customer_name,
                amount: Number(p.amount),
                payment_type: p.payment_type,
                db_status: p.db_status,
                appy_status: appyStatus,
                appy_id: charge ? String(charge.rId ?? charge.id ?? '') : null,
                appy_amount: charge ? Number(charge.amount) : null,
                appy_updated_at: charge?.updatedDate ?? null,
                match: divergence === 'match',
                divergence,
                recommended_action,
            }
        })

        const sumAmount = (filter: (i: typeof items[number]) => boolean, key: 'amount' | 'appy_amount' = 'amount') =>
            items.filter(filter).reduce((s, i) => s + Number((i as any)[key] ?? 0), 0)

        const summary = {
            total: items.length,
            match: items.filter((i) => i.divergence === 'match').length,
            status_mismatch: items.filter((i) => i.divergence === 'status_mismatch').length,
            missing_in_appy: items.filter((i) => i.divergence === 'missing_in_appy').length,
            amount_mismatch: items.filter((i) => i.divergence === 'amount_mismatch').length,

            db_paid_count: items.filter((i) => i.db_status === 'paid').length,
            db_paid_amount: sumAmount((i) => i.db_status === 'paid'),
            db_unpaid_count: items.filter((i) => i.db_status !== 'paid').length,
            db_unpaid_amount: sumAmount((i) => i.db_status !== 'paid'),

            appy_success_count: items.filter((i) => i.appy_status === 'Success').length,
            appy_success_amount: sumAmount((i) => i.appy_status === 'Success', 'appy_amount'),
            appy_unpaid_count: items.filter((i) => i.appy_status && i.appy_status !== 'Success').length,
            appy_unpaid_amount: sumAmount((i) => !!i.appy_status && i.appy_status !== 'Success', 'appy_amount'),

            apply_paid_count: items.filter((i) => i.recommended_action === 'apply_paid').length,
            apply_paid_amount: sumAmount((i) => i.recommended_action === 'apply_paid'),
            apply_failed_count: items.filter((i) => i.recommended_action === 'apply_failed').length,
            apply_failed_amount: sumAmount((i) => i.recommended_action === 'apply_failed'),
            reverse_count: items.filter((i) => i.recommended_action === 'reverse').length,
            reverse_amount: sumAmount((i) => i.recommended_action === 'reverse'),
        }

        return { items, summary }
    }

    /**
     * Aplica a reconciliação para os pagamentos indicados, usando AppyPay como
     * fonte da verdade. Para confirmar/falhar segue o mesmo fluxo do webhook
     * (filas successQueue/failedQueue → PaymentService.process); para reverter
     * pagamentos que estão pagos aqui mas falhados na AppyPay, cria uma
     * devolução aprovada via RefundService (que reverte carteira e desmatricula
     * o aluno).
     */
    static async applyReconciliation(codes: string[], approvedBy?: string): Promise<{
        results: Array<{ code: string; action: string; ok: boolean; error?: string }>
    }> {
        const { successQueue, failedQueue } = await import('../queues')
        const { RefundService } = await import('./RefundService')
        const refundService = new RefundService()

        const results: Array<{ code: string; action: string; ok: boolean; error?: string }> = []

        for (const code of codes) {
            try {
                const list = await AppyPayClient.findChargeByMerchantId(code)
                const charge = list.payments?.[0]
                if (!charge) {
                    results.push({ code, action: 'skipped', ok: false, error: 'Não encontrado na AppyPay' })
                    continue
                }

                const [dbRows]: any = await db.execute(
                    `SELECT p.id, p.order_id, p.amount, p.status, p.is_paid
                     FROM payments p WHERE p.code = ? LIMIT 1`,
                    [code]
                )
                const dbPayment = dbRows?.[0]
                if (!dbPayment) {
                    results.push({ code, action: 'skipped', ok: false, error: 'Pagamento não existe localmente' })
                    continue
                }

                const synthetic: PaymentWebHook = {
                    id: String(charge.rId ?? charge.id ?? ''),
                    merchantTransactionId: charge.merchantTransactionId,
                    amount: Number(charge.amount),
                    options: charge.options ?? undefined,
                    reference: charge.reference ?? undefined,
                    responseStatus: {
                        successful: charge.status === 'Success',
                        status: (charge.status as any) ?? 'Failed',
                        code: charge.status === 'Success' ? 100 : 200,
                        message: '[Reconciliação manual]',
                        source: (charge.paymentMethod as any) ?? 'APPY',
                    },
                }

                if (charge.status === 'Success') {
                    if (dbPayment.is_paid === 1) {
                        results.push({ code, action: 'noop_already_paid', ok: true })
                    } else {
                        await successQueue.add('success-payment', synthetic, {
                            priority: 1,
                            attempts: 5,
                            backoff: { type: 'exponential', delay: 3000 },
                        })
                        results.push({ code, action: 'apply_paid', ok: true })
                    }
                } else if (charge.status === 'Failed') {
                    if (dbPayment.is_paid === 1) {
                        // reverter via RefundService
                        if (!dbPayment.order_id) {
                            results.push({ code, action: 'reverse_skipped', ok: false, error: 'Pagamento sem ordem associada' })
                            continue
                        }
                        const refundId = await db.execute(
                            `INSERT INTO refunds (order_id, payment_id, amount, reason, status, requested_by, created_at, updated_at)
                             VALUES (?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
                            [
                                dbPayment.order_id,
                                dbPayment.id,
                                Number(dbPayment.amount),
                                'Reconciliação automática: AppyPay reportou pagamento como falhado',
                                approvedBy ?? 'reconciliacao',
                            ]
                        ).then(([r]: any) => r.insertId as number)

                        await refundService.approve(
                            refundId,
                            'Aprovado automaticamente via reconciliação AppyPay',
                            approvedBy ?? 'reconciliacao'
                        )
                        results.push({ code, action: 'reverse', ok: true })
                    } else if (dbPayment.status === 'failed') {
                        results.push({ code, action: 'noop_already_failed', ok: true })
                    } else {
                        await failedQueue.add('failed-payment', synthetic)
                        results.push({ code, action: 'apply_failed', ok: true })
                    }
                } else {
                    // Pending / Requested na AppyPay — ainda não decidiu
                    results.push({ code, action: 'skipped', ok: false, error: `AppyPay ainda em estado ${charge.status}` })
                }
            } catch (err: any) {
                console.error(`[applyReconciliation] erro em ${code}:`, err?.message ?? err)
                results.push({ code, action: 'error', ok: false, error: err?.message ?? 'Erro inesperado' })
            }
        }

        return { results }
    }
}
