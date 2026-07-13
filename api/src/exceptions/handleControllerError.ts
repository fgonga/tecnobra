/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

import type { FastifyReply } from "fastify"
import { ValidationError } from "./ValidationError"

const isDev = process.env.APP_DEVELOPMENT?.trim() === "true"

export function handleControllerError(reply: FastifyReply, err: any) {
    const isOperational = err instanceof ValidationError
    if (!isOperational) {
        console.error("[Internal Error]", err)
    }
    const status = isOperational && Number.isInteger(err?.status) ? err.status : 500
    const message = isOperational ? (err?.message || "Erro interno no servidor") : "Erro interno no servidor"
    const type = isOperational ? (err?.type || "Danger") : "Danger"
    return reply.code(status).send({
        type,
        message,
        ...(isDev && !isOperational && {
            dev_error: err?.message ?? String(err),
            dev_stack: err?.stack,
        }),
    })
}
