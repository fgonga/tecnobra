import { AsyncTask } from "toad-scheduler";
import { PaymentModel } from "../../models/payment.model";
import { notificationQueue } from "../../queues";
import { ScheduleLogger } from "../../logger/ScheduleLogger";

/**
 * Lembra o cliente, no dia em que a referência vai expirar, que ainda pode pagar
 * (tentativa de recuperação). Corre uma vez por dia; `reminded_at` evita duplicados.
 *
 * Segue o padrão do abandonedRemember: seleciona → enfileira notificação → marca.
 * A mensagem é resolvida por template (evento "ReferenceExpiring") em SMS/WhatsApp.
 */
export async function referenceExpiryRemember() {
    ScheduleLogger.info("referenceExpiryRemember[start]");
    try {
        const payments = await PaymentModel.findExpiringToday();
        ScheduleLogger.info(`referenceExpiryRemember[run] found - ${payments.length} referência(s) a expirar hoje`);
        for (const payment of payments) {
            ScheduleLogger.info(`referenceExpiryRemember[run] lembrando referência ${payment.reference ?? payment.code} - ${payment.phone}`);
            notificationQueue.add("notification", {
                notify: "ReferenceExpiring",
                context: { paymentCode: payment.code, phone: payment.phone },
            });
            await PaymentModel.markReminded(payment.code);
        }
        ScheduleLogger.info("referenceExpiryRemember[end]");
        return payments.length;
    } catch (e: any) {
        ScheduleLogger.error("referenceExpiryRemember[error]" + e.message);
    }
}

export default new AsyncTask(
    "referenceExpiryRemember",
    referenceExpiryRemember
);
