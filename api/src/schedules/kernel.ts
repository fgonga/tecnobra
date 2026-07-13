import { CronJob } from "toad-scheduler";
import dispatchEvents from "./tasks/dispatchEvents";
import unreturnedToolsAlertTick from "./tasks/unreturnedToolsAlert";

export const schedules = [
    new CronJob(
        { cronExpression: "* * * * * *" }, // a cada 1 segundo (intervalo real controlado por events_dispatch_interval)
        dispatchEvents
    ),
    // a cada 5 minutos — dispara o alerta de ferramentas não devolvidas
    // uma vez por dia, à hora configurada (parametrization.alerta_ferramentas_hora)
    new CronJob(
        { cronExpression: "0 */5 * * * *" },
        unreturnedToolsAlertTick
    ),
];
