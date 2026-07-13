import { AsyncTask } from "toad-scheduler";
import {OrderModel} from "../../models/order.model";
import {notificationQueue} from "../../queues";
import {ScheduleLogger} from "../../logger/ScheduleLogger";


export async function abandonedRemember() {
    ScheduleLogger.info("abandonedRemember[start]");
    try {
        const orders = await OrderModel.findAbandoned(5);
        ScheduleLogger.info("abandonedRemember[run] found - "+orders.length +" orders");
        for (const order of orders) {
            ScheduleLogger.info(`abandonedRemember[run] notificando pedido abandonado ID ${order.code} - ${order.phone}` );
            notificationQueue.add("notification", {
                notify: "CartRecovery",
                context: { orderCode: order.code, phone: order.phone },
            });
            await OrderModel.markAbandonedNotified(order.id);
        }
        ScheduleLogger.info("abandonedRemember[end]");
        return orders.length;
    }catch (e) {
        ScheduleLogger.error("abandonedRemember[error]" + e.message);
    }
}

export default new AsyncTask(
    "abandonedRemember",
    abandonedRemember
);
