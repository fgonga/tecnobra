import { CronJob } from "toad-scheduler";
import dispatchEvents from "./tasks/dispatchEvents";

export const schedules = [
    new CronJob(
        { cronExpression: "* * * * * *" }, // a cada 1 segundo (intervalo real controlado por events_dispatch_interval)
        dispatchEvents
    ),
];
