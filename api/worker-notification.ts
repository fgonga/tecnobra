import { Worker } from "bullmq";
import { Envelope, SmsService } from "./src/services/SmsService";
import { NotificationService } from "./src/services/notification/NotificationService";
import { MessageLogService } from "./src/services/notification/MessageLogService";

/**
 * Worker da fila "notification".
 *
 * Formatos de job suportados:
 *  - { notify: <eventType>, context: { trabalhadorId? | visitanteId? | ..., phone?, email? },
 *      attachments?: [{ filename, contentBase64, contentType }] }
 *      → resolve o template ATIVO de cada canal e envia (NotificationService).
 *        Os anexos (só email) viajam em base64 pela fila e são convertidos aqui.
 *  - { message, to }
 *      → envio cru de SMS (ad-hoc, sem template).
 */
new Worker(
    "notification",
    async (job) => {
        // Disparo por evento → templates configuráveis
        if (job.data.notify) {
            const attachments = (job.data.attachments ?? []).map((a: any) => ({
                filename: a.filename,
                content: Buffer.from(a.contentBase64, "base64"),
                contentType: a.contentType,
            }));
            const results = await NotificationService.dispatch(
                job.data.notify,
                job.data.context ?? {},
                attachments.length ? { attachments } : undefined
            );
            console.log(`[notify] ${job.data.notify}`, JSON.stringify(results));
            return;
        }

        // Envio cru de SMS (ad-hoc) — também contabilizado
        if (job.data.message) {
            const to = job.data.to;
            const body = job.data.message;
            try {
                const res: any = await SmsService.send({ to, message: body, type: "sms" } as Envelope);
                await MessageLogService.record({
                    eventType: job.data.eventType ?? null,
                    channel: "sms",
                    to,
                    body,
                    status: "sent",
                    providerId: res?.id ?? res?.message?.id ?? null,
                    orderCode: job.data.orderCode ?? null,
                });
            } catch (e: any) {
                await MessageLogService.record({
                    eventType: job.data.eventType ?? null,
                    channel: "sms",
                    to,
                    body,
                    status: "failed",
                    error: e?.message ?? String(e),
                    orderCode: job.data.orderCode ?? null,
                });
                throw e;
            }
            return;
        }
    },
    {
        connection: { host: "127.0.0.1", port: 6379 },
        concurrency: 2,
    }
);
