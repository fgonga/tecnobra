import { Worker } from "bullmq";
import { EventService } from "./src/services/EventService";

new Worker(
    "system-events",
    async (job) => await EventService.processEvent(job.data),
    {
        connection: { host: "127.0.0.1", port: 6379 },
        concurrency: 5,
    }
);

