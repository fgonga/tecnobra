import { AsyncTask } from "toad-scheduler";
import { PaymentModel } from "../../models/payment.model";
import { ScheduleLogger } from "../../logger/ScheduleLogger";

/**
 * Marca como falhadas as referências (ref/aref) pendentes cuja validade
 * (expired_at) já passou. Sem isto, um pagamento por referência não pago
 * fica eternamente "pendente", pois só transitava para "failed" via webhook.
 *
 * Corre ANTES do updatePendingOrders para que o cancelamento de encomendas
 * fique consistente (a query de cancelamento já trata refs 'failed' como inválidas).
 */
export async function expirePendingReferences() {
    ScheduleLogger.info("expirePendingReferences[start]");
    try {
        const affected = await PaymentModel.expireStaleReferences();
        ScheduleLogger.info(`expirePendingReferences[run] - ${affected} referência(s) expirada(s).`);
        ScheduleLogger.info("expirePendingReferences[end]");
        return affected;
    } catch (e: any) {
        ScheduleLogger.error("expirePendingReferences[error]" + e.message);
    }
}

export default new AsyncTask(
    "expirePendingReferences",
    expirePendingReferences
);
