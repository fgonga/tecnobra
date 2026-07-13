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
 */
import { AsyncTask } from "toad-scheduler";
import {OrdersService} from "../../services/OrdersService.ts";
import {OrderModel} from "../../models/order.model.ts";
import {ScheduleLogger} from "../../logger/ScheduleLogger";

export async function updatePendingOrders() {
    ScheduleLogger.info("updatePendingOrders[start]");
    try {
        const orders = await OrderModel.updatePendingOrders(20);
        ScheduleLogger.info(`updatePendingOrders[run] -  ${orders[0].affectedRows} pending orders.`);
        ScheduleLogger.info("updatePendingOrders[end]");
        return;
    }catch (e) {
        ScheduleLogger.error("updatePendingOrders[error]", e);
    }
}
export default new AsyncTask(
    "updatePendingOrders",
    updatePendingOrders
);
