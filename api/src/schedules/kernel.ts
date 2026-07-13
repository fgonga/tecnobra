import { CronJob } from "toad-scheduler";
import sendDayResume from "./tasks/sendDayResume";
import updatePendingOrders from "./tasks/updatePendingOrders";
import expirePendingReferences from "./tasks/expirePendingReferences";
import referenceExpiryRemember from "./tasks/referenceExpiryRemember";
import abandonedRemember from "./tasks/abandonedRemember";
import authAppyPay from "./tasks/authAppyPay";
import dispatchEvents from "./tasks/dispatchEvents";
import autoGeneralSettlement from "./tasks/autoGeneralSettlement";
import autoPartnerSettlements from "./tasks/autoPartnerSettlements";

export const schedules = [
    // a cada 15 minutos — marca referências vencidas como falhadas
    // (antes do updatePendingOrders para manter orders/payments consistentes)
    new CronJob(
        { cronExpression: "0 */15 * * * *" },
        expirePendingReferences
    ),
    // a cada 30 minutos
    new CronJob(
        { cronExpression: "0 */30 * * * *" },
        updatePendingOrders
    ),
    // diariamente às 08:00 — lembra referências que expiram hoje
    new CronJob(
        { cronExpression: "0 0 8 * * *" },
        referenceExpiryRemember
    ),
    // a cada 5 minutos
    new CronJob(
        { cronExpression: "0 */5 * * * *" },
        abandonedRemember
    ),
    //
    new CronJob(
        { cronExpression: "0 0 * * * *" },
        authAppyPay
    ),
    // diariamente às 06:00
    new CronJob(
        { cronExpression: "0 0 6 * * *" },
        sendDayResume
    ),
    // toda segunda-feira às 06:00 — gera repasse geral da semana anterior
    new CronJob(
        { cronExpression: "0 0 6 * * 1" },
        autoGeneralSettlement
    ),
    // diariamente às 06:05 — gera repasses de parceiros (só corre nos dias configurados)
    new CronJob(
        { cronExpression: "0 5 6 * * *" },
        autoPartnerSettlements
    ),
    new CronJob(
        { cronExpression: "* * * * * *" }, // a cada 1 segundo (intervalo real controlado por events_dispatch_interval)
        dispatchEvents
    )
];
